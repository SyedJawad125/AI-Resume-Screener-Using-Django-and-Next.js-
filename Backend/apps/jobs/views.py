import logging
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from utils.base_api import BaseView
from utils.reusable_functions import create_response
from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED
from utils.decorator import permission_required
from utils.permission_enums import *

from .models import JobDescription, JobStatus
from .serializers import (
    JobDescriptionWriteSerializer,
    JobDescriptionDetailSerializer,
    JobDescriptionListSerializer,
)
from .filters import JobDescriptionFilter

logger = logging.getLogger(__name__)


def _scope_filters(user):
    """Return extra_filters dict scoped to user's company (non-super-admin)."""
    from apps.users.models import UserRole
    if getattr(user, 'role', None) != UserRole.SUPER_ADMIN:
        return {'company': user.company}
    return {}


# ─────────────────────────────────────────────────────────
#  Main CRUD   →   /api/jobs/v1/job/
#  GET    ?id=<uuid>   → single detail
#  GET                 → paginated list
#  POST               → create
#  PATCH  ?id=<uuid>  → partial update
#  DELETE ?id=<uuid>  → soft delete (archive)
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionWriteSerializer
    list_serializer    = JobDescriptionListSerializer
    filterset_class    = JobDescriptionFilter

    @extend_schema(summary='Create a job description')
    @permission_required([CREATE_JOB])
    def post(self, request):
        return super().post_(request)

    @extend_schema(summary='List or retrieve job descriptions')
    @permission_required([READ_JOB])
    def get(self, request):
        self.extra_filters = _scope_filters(request.user)
        # Use detail serializer when fetching a single job by id
        if request.query_params.get('id'):
            self.serializer_class = JobDescriptionDetailSerializer
        return super().get_(request)

    @extend_schema(summary='Partial update a job description')
    @permission_required([UPDATE_JOB])
    def patch(self, request):
        self.extra_filters = _scope_filters(request.user)
        return super().patch_(request)

    @extend_schema(summary='Soft-delete (archive) a job description')
    @permission_required([DELETE_JOB])
    def delete(self, request):
        """
        Soft delete: sets deleted=True + status=ARCHIVED.
        Uses ?id= query param — consistent with BaseView pattern.
        """
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra = _scope_filters(request.user)
            instance = JobDescription.objects.filter(
                deleted=False, id=job_id, **extra
            ).first()

            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            # Delegate to model's soft_delete helper
            instance.soft_delete(user=request.user)

            serialized_resp = self.serializer_class(instance, context={'request': request}).data
            return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobView.delete error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Lightweight list   →   /api/jobs/v1/job/list/
#  GET  (for dropdowns, cards, show_job permission)
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobListView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionListSerializer
    filterset_class    = JobDescriptionFilter

    @extend_schema(summary='Lightweight job list for dropdowns / cards')
    @permission_required([SHOW_JOB])
    def get(self, request):
        self.extra_filters = _scope_filters(request.user)
        return super().get_(request)


# ─────────────────────────────────────────────────────────
#  Toggle status   →   /api/jobs/v1/job/toggle/
#  PATCH  ?id=<uuid>   body: {"status": "active"|"paused"|...}
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobToggleView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionWriteSerializer

    @extend_schema(summary='Toggle job status (active / paused / draft / closed)')
    @permission_required([UPDATE_JOB])
    def patch(self, request):
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra    = _scope_filters(request.user)
            instance = JobDescription.objects.filter(deleted=False, id=job_id, **extra).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            new_status = request.data.get('status')
            if new_status not in JobStatus.values:
                return Response(
                    create_response(f"Invalid status. Choices: {', '.join(JobStatus.values)}"),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            instance.status     = new_status
            instance.updated_by = request.user
            instance.save(update_fields=['status', 'updated_by', 'updated_at'])

            serialized_resp = self.serializer_class(instance, context={'request': request}).data
            return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobToggleView.patch error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────
#  Trigger AI Analysis   →   /api/jobs/v1/job/analyze/
#  POST  ?id=<uuid>
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobAnalyzeView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionWriteSerializer

    @extend_schema(summary='Trigger AI analysis on a job description')
    @permission_required([ANALYZE_JOB])
    def post(self, request):
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            instance = JobDescription.objects.filter(
                deleted=False, id=job_id, company=request.user.company
            ).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            from apps.core.tasks import analyze_job_description_task
            task = analyze_job_description_task.delay(str(instance.id))

            return Response(
                create_response(SUCCESSFUL, {
                    'task_id': task.id,
                    'job_id':  str(instance.id),
                    'message': 'JD analysis started.',
                }),
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            logger.exception("JobAnalyzeView.post error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────
#  Job Stats   →   /api/jobs/v1/job/stats/
#  GET
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobStatsView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionListSerializer   # required by BaseView

    @extend_schema(summary='Job statistics for the company')
    @permission_required([STATS_JOB])
    def get(self, request):
        try:
            qs = JobDescription.objects.filter(
                deleted=False, **_scope_filters(request.user)
            )
            data = {
                'total':            qs.count(),
                'active':           qs.filter(status=JobStatus.ACTIVE).count(),
                'draft':            qs.filter(status=JobStatus.DRAFT).count(),
                'paused':           qs.filter(status=JobStatus.PAUSED).count(),
                'closed':           qs.filter(status=JobStatus.CLOSED).count(),
                'archived':         qs.filter(status=JobStatus.ARCHIVED).count(),
                'total_screenings': sum(qs.values_list('screening_count', flat=True)),
                'by_status':        {s: qs.filter(status=s).count() for s in JobStatus.values},
            }
            return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobStatsView.get error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)