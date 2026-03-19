# import logging
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from drf_spectacular.utils import extend_schema

# from utils.base_api import BaseView
# from utils.helpers import paginate_data
# from utils.reusable_functions import create_response, get_first_error
# from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED
# from utils.decorator import permission_required
# from utils.permission_enums import *

# from .models import JobDescription, JobSkill, JobStatus
# from .serializers import (
#     JobDescriptionWriteSerializer,
#     JobDescriptionDetailSerializer,
#     JobDescriptionListSerializer,
#     JobSkillSerializer,
# )
# from .filters import JobDescriptionFilter

# logger = logging.getLogger(__name__)


# def _scope_filters(user):
#     company = getattr(user, 'company', None)
#     if company:
#         return {'company': company}
#     return {}


# # ─────────────────────────────────────────────────────────
# #  Main CRUD   →   /api/jobs/v1/job/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobDescriptionWriteSerializer
#     list_serializer    = JobDescriptionListSerializer
#     filterset_class    = JobDescriptionFilter

#     @extend_schema(summary='Create a job description')
#     @permission_required([CREATE_JOB])
#     def post(self, request):
#         return super().post_(request)

#     @extend_schema(summary='List or retrieve job descriptions')
#     @permission_required([READ_JOB])
#     def get(self, request):
#         try:
#             user  = request.user
#             scope = _scope_filters(user)                               # e.g. {'company': user.company}
#             qs    = JobDescription.objects.filter(deleted=False, **scope)

#             # Apply filterset (search, ordering, status, etc.)
#             if self.filterset_class:
#                 filtered = self.filterset_class(request.GET, queryset=qs)
#                 qs = filtered.qs if filtered.is_valid() else qs

#             job_id = request.query_params.get('id')

#             # ── Single record ──
#             if job_id:
#                 instance = qs.filter(id=job_id).first()
#                 if not instance:
#                     return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)
#                 serializer = JobDescriptionDetailSerializer(instance, context={'request': request})
#                 return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)

#             # ── List ──
#             serializer_class = self.list_serializer or JobDescriptionListSerializer
#             data, count      = paginate_data(qs, request)
#             serialized       = serializer_class(data, many=True, context={'request': request}).data
#             return Response(create_response(SUCCESSFUL, serialized, count), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception("JobView.get error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @extend_schema(summary='Partial update a job description')
#     @permission_required([UPDATE_JOB])
#     def patch(self, request):
#         try:
#             job_id = request.query_params.get('id')
#             if not job_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             scope    = _scope_filters(request.user)
#             instance = JobDescription.objects.filter(deleted=False, id=job_id, **scope).first()
#             if not instance:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             serializer = self.serializer_class(
#                 instance, data=request.data, partial=True, context={'request': request}
#             )
#             if serializer.is_valid():
#                 serializer.save(updated_by=request.user)
#                 return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
#             return Response(
#                 create_response(get_first_error(serializer.errors)),
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         except Exception as e:
#             logger.exception("JobView.patch error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#     @extend_schema(summary='Soft-delete (archive) a job description')
#     @permission_required([DELETE_JOB])
#     def delete(self, request):
#         try:
#             job_id = request.query_params.get('id')
#             if not job_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             scope    = _scope_filters(request.user)
#             instance = JobDescription.objects.filter(deleted=False, id=job_id, **scope).first()
#             if not instance:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             instance.soft_delete(user=request.user)
#             serialized_resp = self.serializer_class(instance, context={'request': request}).data
#             return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception("JobView.delete error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Lightweight list   →   /api/jobs/v1/job/list/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobListView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobDescriptionListSerializer
#     filterset_class    = JobDescriptionFilter

#     @extend_schema(summary='Lightweight job list for dropdowns / cards')
#     @permission_required([SHOW_JOB])
#     def get(self, request):
#         try:
#             scope = _scope_filters(request.user)
#             qs    = JobDescription.objects.filter(deleted=False, **scope)

#             if self.filterset_class:
#                 filtered = self.filterset_class(request.GET, queryset=qs)
#                 qs = filtered.qs if filtered.is_valid() else qs

#             data, count = paginate_data(qs, request)
#             serialized  = self.serializer_class(data, many=True, context={'request': request}).data
#             return Response(create_response(SUCCESSFUL, serialized, count), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception("JobListView.get error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# # ─────────────────────────────────────────────────────────
# #  Toggle status   →   /api/jobs/v1/job/toggle/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobToggleView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobDescriptionWriteSerializer

#     @extend_schema(summary='Toggle job status (active / paused / draft / closed)')
#     @permission_required([UPDATE_JOB])
#     def patch(self, request):
#         try:
#             job_id = request.query_params.get('id')
#             if not job_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             extra    = _scope_filters(request.user)
#             instance = JobDescription.objects.filter(deleted=False, id=job_id, **extra).first()
#             if not instance:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             new_status = request.data.get('status')
#             if new_status not in JobStatus.values:
#                 return Response(
#                     create_response(f"Invalid status. Choices: {', '.join(JobStatus.values)}"),
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             instance.status     = new_status
#             instance.updated_by = request.user
#             instance.save(update_fields=['status', 'updated_by', 'updated_at'])

#             serialized_resp = self.serializer_class(instance, context={'request': request}).data
#             return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception("JobToggleView.patch error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_400_BAD_REQUEST)


# # ─────────────────────────────────────────────────────────
# #  Trigger AI Analysis   →   /api/jobs/v1/job/analyze/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobAnalyzeView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobDescriptionWriteSerializer

#     @extend_schema(summary='Trigger AI analysis on a job description')
#     @permission_required([ANALYZE_JOB])
#     def post(self, request):
#         try:
#             job_id = request.query_params.get('id')
#             if not job_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             extra    = _scope_filters(request.user)
#             instance = JobDescription.objects.filter(deleted=False, id=job_id, **extra).first()
#             if not instance:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             from apps.core.tasks import analyze_job_description_task
#             task = analyze_job_description_task.delay(str(instance.id))

#             return Response(
#                 create_response(SUCCESSFUL, {
#                     'task_id': task.id,
#                     'job_id':  str(instance.id),
#                     'message': 'JD analysis started.',
#                 }),
#                 status=status.HTTP_202_ACCEPTED,
#             )

#         except Exception as e:
#             logger.exception("JobAnalyzeView.post error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_400_BAD_REQUEST)


# # ─────────────────────────────────────────────────────────
# #  Job Stats   →   /api/jobs/v1/job/stats/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobStatsView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobDescriptionListSerializer

#     @extend_schema(summary='Job statistics for the company')
#     @permission_required([STATS_JOB])
#     def get(self, request):
#         try:
#             qs   = JobDescription.objects.filter(deleted=False, **_scope_filters(request.user))
#             data = {
#                 'total':            qs.count(),
#                 'active':           qs.filter(status=JobStatus.ACTIVE).count(),
#                 'draft':            qs.filter(status=JobStatus.DRAFT).count(),
#                 'paused':           qs.filter(status=JobStatus.PAUSED).count(),
#                 'closed':           qs.filter(status=JobStatus.CLOSED).count(),
#                 'archived':         qs.filter(status=JobStatus.ARCHIVED).count(),
#                 'total_screenings': sum(qs.values_list('screening_count', flat=True)),
#                 'by_status':        {s: qs.filter(status=s).count() for s in JobStatus.values},
#             }
#             return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception("JobStatsView.get error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Job Skills   →   /api/jobs/v1/job/skills/
# #  GET    ?job_id=<uuid>              → list all skills for job
# #  POST   ?job_id=<uuid>              → add a skill
# #  PATCH  ?job_id=<uuid>&id=<uuid>   → update a skill
# #  DELETE ?job_id=<uuid>&id=<uuid>   → delete a skill
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobSkillView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobSkillSerializer

#     def _get_job(self, request, job_id):
#         """Fetch job scoped to user's company. Returns None if not found."""
#         extra = _scope_filters(request.user)
#         return JobDescription.objects.filter(
#             deleted=False, id=job_id, **extra
#         ).first()

#     def _get_skill(self, job, skill_id):
#         """Fetch a single skill belonging to this job."""
#         return JobSkill.objects.filter(
#             id=skill_id, job=job, deleted=False
#         ).first()

#     @extend_schema(summary='List all skills for a job')
#     @permission_required([READ_JOB])
#     def get(self, request):
#         job_id = request.query_params.get('job_id')
#         if not job_id:
#             return Response(
#                 create_response('job_id query param is required.'),
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         job = self._get_job(request, job_id)
#         if not job:
#             return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         skills = JobSkill.objects.filter(job=job, deleted=False)
#         data   = JobSkillSerializer(skills, many=True).data
#         return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

#     @extend_schema(summary='Add a skill to a job')
#     @permission_required([UPDATE_JOB])
#     def post(self, request):
#         job_id = request.query_params.get('job_id')
#         if not job_id:
#             return Response(
#                 create_response('job_id query param is required.'),
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         job = self._get_job(request, job_id)
#         if not job:
#             return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         serializer = JobSkillSerializer(data=request.data)
#         if serializer.is_valid():
#             # unique_together guard — revive if soft-deleted
#             existing = JobSkill.objects.filter(
#                 job=job, name=serializer.validated_data['name']
#             ).first()

#             if existing:
#                 if existing.deleted:
#                     # Revive the soft-deleted skill with new data
#                     for attr, value in serializer.validated_data.items():
#                         setattr(existing, attr, value)
#                     existing.deleted = False
#                     existing.save()
#                     return Response(
#                         create_response(SUCCESSFUL, JobSkillSerializer(existing).data),
#                         status=status.HTTP_200_OK,
#                     )
#                 return Response(
#                     create_response(f'Skill "{existing.name}" already exists for this job.'),
#                     status=status.HTTP_409_CONFLICT,
#                 )

#             skill = serializer.save(job=job)
#             return Response(
#                 create_response(SUCCESSFUL, JobSkillSerializer(skill).data),
#                 status=status.HTTP_201_CREATED,
#             )

#         return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#     @extend_schema(summary='Update a skill')
#     @permission_required([UPDATE_JOB])
#     def patch(self, request):
#         job_id   = request.query_params.get('job_id')
#         skill_id = request.query_params.get('id')

#         if not job_id or not skill_id:
#             return Response(
#                 create_response('Both job_id and id query params are required.'),
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         job = self._get_job(request, job_id)
#         if not job:
#             return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         skill = self._get_skill(job, skill_id)
#         if not skill:
#             return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         serializer = JobSkillSerializer(skill, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)

#         return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#     @extend_schema(summary='Delete a skill (soft delete)')
#     @permission_required([UPDATE_JOB])
#     def delete(self, request):
#         job_id   = request.query_params.get('job_id')
#         skill_id = request.query_params.get('id')

#         if not job_id or not skill_id:
#             return Response(
#                 create_response('Both job_id and id query params are required.'),
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         job = self._get_job(request, job_id)
#         if not job:
#             return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         skill = self._get_skill(job, skill_id)
#         if not skill:
#             return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         skill.deleted = True
#         skill.save(update_fields=['deleted'])
#         return Response(
#             create_response(SUCCESSFUL, {'id': str(skill.id), 'message': f'Skill "{skill.name}" deleted.'}),
#             status=status.HTTP_200_OK,
#         )



import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from utils.permission_enums import *
from utils.reusable_functions import create_response, get_first_error
from utils.helpers import paginate_data
from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED

from utils.base_api import BaseView
from utils.decorator import permission_required

from .models import JobDescription, JobSkill, JobAnalysis
from .serializers import (
    JobDescriptionWriteSerializer,
    JobDescriptionListSerializer,
    JobDescriptionDetailSerializer,
    JobAnalysisSerializer,
    JobSkillSerializer,
)
from .filters import JobDescriptionFilter

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────
#  Helper — scope queryset to the current user's company
# ─────────────────────────────────────────────────────────
def _get_job_queryset(user):
    """
    Returns a scoped, non-deleted queryset for JobDescription.
    Superusers see everything; everyone else sees only their company.
    Falls back to the full unscoped qs if the user has no company assigned
    (mirrors Company view behaviour where multi-tenancy guard is inactive).
    """
    qs = JobDescription.objects.filter(deleted=False)
    if user.is_superuser:
        return qs
    if user.company_id:
        return qs.filter(company_id=user.company_id)
    # No company assigned — return empty so no data leaks across tenants.
    # Change to `return qs` only if you want to disable multi-tenancy here.
    return qs.none()


# ─────────────────────────────────────────────────────────
#  Main CRUD   →   /api/jobs/v1/job/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionWriteSerializer
    list_serializer    = JobDescriptionListSerializer
    filterset_class    = JobDescriptionFilter

    # ── POST  ────────────────────────────────────────────
    @extend_schema(summary='Create a job description')
    @permission_required([CREATE_JOB])
    def post(self, request):
        try:
            serializer = JobDescriptionWriteSerializer(
                data=request.data, context={'request': request}
            )
            if serializer.is_valid():
                job = serializer.save(created_by=request.user)
                resp = JobDescriptionDetailSerializer(job, context={'request': request}).data
                return Response(create_response(SUCCESSFUL, resp), status=status.HTTP_201_CREATED)
            return Response(
                create_response(get_first_error(serializer.errors)),
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("JobView.post error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── GET  ─────────────────────────────────────────────
    @extend_schema(summary='List or retrieve job descriptions')
    @permission_required([READ_JOB])
    def get(self, request):
        try:
            qs = _get_job_queryset(request.user)

            # Apply filters — mirrors Company view: use .qs if valid, else keep qs as-is
            if self.filterset_class:
                filtered = self.filterset_class(request.GET, queryset=qs)
                qs = filtered.qs if filtered.is_valid() else qs

            # Ordering
            order    = request.query_params.get('order', 'desc')
            order_by = request.query_params.get('order_by', 'created_at')
            qs = qs.order_by(f"-{order_by}" if order == 'desc' else order_by)

            job_id = request.query_params.get('id')

            # ── Single record ──
            if job_id:
                instance = qs.filter(id=job_id).first()
                if not instance:
                    return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)
                serializer = JobDescriptionDetailSerializer(instance, context={'request': request})
                return Response(
                    create_response(SUCCESSFUL, serializer.data),
                    status=status.HTTP_200_OK,
                )

            # ── List ──
            data, count = paginate_data(qs, request)
            serialized  = JobDescriptionListSerializer(
                data, many=True, context={'request': request}
            ).data
            return Response(create_response(SUCCESSFUL, serialized, count), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobView.get error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── PATCH  ───────────────────────────────────────────
    @extend_schema(summary='Partial update a job description')
    @permission_required([UPDATE_JOB])
    def patch(self, request):
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            instance = _get_job_queryset(request.user).filter(id=job_id).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            serializer = JobDescriptionWriteSerializer(
                instance, data=request.data, partial=True, context={'request': request}
            )
            if serializer.is_valid():
                job  = serializer.save(updated_by=request.user)
                resp = JobDescriptionDetailSerializer(job, context={'request': request}).data
                return Response(create_response(SUCCESSFUL, resp), status=status.HTTP_200_OK)
            return Response(
                create_response(get_first_error(serializer.errors)),
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("JobView.patch error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── DELETE  ──────────────────────────────────────────
    @extend_schema(summary='Soft-delete (archive) a job description')
    @permission_required([DELETE_JOB])
    def delete(self, request):
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            instance = _get_job_queryset(request.user).filter(id=job_id).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            instance.deleted    = True
            instance.updated_by = request.user
            instance.save()

            resp = JobDescriptionWriteSerializer(instance, context={'request': request}).data
            return Response(create_response(SUCCESSFUL, resp), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobView.delete error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Lightweight list   →   /api/jobs/v1/job/list/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobListView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionListSerializer
    filterset_class    = JobDescriptionFilter

    @extend_schema(summary='Lightweight job list for dropdowns / cards')
    @permission_required([SHOW_JOB])
    def get(self, request):
        try:
            qs = _get_job_queryset(request.user)

            if self.filterset_class:
                filtered = self.filterset_class(request.GET, queryset=qs)
                qs = filtered.qs if filtered.is_valid() else qs

            order    = request.query_params.get('order', 'desc')
            order_by = request.query_params.get('order_by', 'created_at')
            qs = qs.order_by(f"-{order_by}" if order == 'desc' else order_by)

            data, count = paginate_data(qs, request)
            serialized  = JobDescriptionListSerializer(
                data, many=True, context={'request': request}
            ).data
            return Response(create_response(SUCCESSFUL, serialized, count), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobListView.get error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Toggle status   →   /api/jobs/v1/job/toggle/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobToggleView(BaseView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Toggle job status')
    @permission_required([UPDATE_JOB])
    def patch(self, request):
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            instance = _get_job_queryset(request.user).filter(id=job_id).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            new_status = request.data.get('status')
            if not new_status:
                return Response(
                    create_response('status field is required.'),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            instance.status     = new_status
            instance.updated_by = request.user
            instance.save(update_fields=['status', 'updated_by'])

            resp = JobDescriptionListSerializer(instance, context={'request': request}).data
            return Response(create_response(SUCCESSFUL, resp), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobToggleView.patch error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  AI Analysis   →   /api/jobs/v1/job/analyze/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobAnalyzeView(BaseView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Trigger AI analysis for a job description')
    @permission_required([UPDATE_JOB])
    def post(self, request):
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            instance = _get_job_queryset(request.user).filter(id=job_id).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            # ── Trigger your AI analysis task here ──
            # e.g. analyze_job_task.delay(str(instance.id))

            analysis = getattr(instance, 'analysis', None)
            resp     = JobAnalysisSerializer(analysis).data if analysis else {}
            return Response(create_response(SUCCESSFUL, resp), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobAnalyzeView.post error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Stats   →   /api/jobs/v1/job/stats/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobStatsView(BaseView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(summary='Company job statistics')
    @permission_required([READ_JOB])
    def get(self, request):
        try:
            qs = _get_job_queryset(request.user)

            from django.db.models import Count, Q
            stats = qs.aggregate(
                total         = Count('id'),
                active        = Count('id', filter=Q(status='active')),
                draft         = Count('id', filter=Q(status='draft')),
                closed        = Count('id', filter=Q(status='closed')),
                with_analysis = Count('id', filter=Q(analysis__isnull=False)),
            )
            return Response(create_response(SUCCESSFUL, stats), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobStatsView.get error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Job Skills   →   /api/jobs/v1/job/skills/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobSkillView(BaseView):
    permission_classes = (IsAuthenticated,)

    # ── GET all skills for a job ──
    @extend_schema(summary='List skills for a job')
    @permission_required([READ_JOB])
    def get(self, request):
        try:
            job_id = request.query_params.get('job_id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            job = _get_job_queryset(request.user).filter(id=job_id).first()
            if not job:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            skills     = job.skills.filter(deleted=False)
            serialized = JobSkillSerializer(skills, many=True).data
            return Response(
                create_response(SUCCESSFUL, serialized, len(serialized)),
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception("JobSkillView.get error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── POST add a skill ──
    @extend_schema(summary='Add a skill to a job')
    @permission_required([UPDATE_JOB])
    def post(self, request):
        try:
            job_id = request.query_params.get('job_id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            job = _get_job_queryset(request.user).filter(id=job_id).first()
            if not job:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            serializer = JobSkillSerializer(data=request.data)
            if serializer.is_valid():
                skill = serializer.save(job=job)
                return Response(
                    create_response(SUCCESSFUL, JobSkillSerializer(skill).data),
                    status=status.HTTP_201_CREATED,
                )
            return Response(
                create_response(get_first_error(serializer.errors)),
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("JobSkillView.post error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── PATCH update a skill ──
    @extend_schema(summary='Update a job skill')
    @permission_required([UPDATE_JOB])
    def patch(self, request):
        try:
            skill_id = request.query_params.get('id')
            job_id   = request.query_params.get('job_id')
            if not skill_id or not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            job = _get_job_queryset(request.user).filter(id=job_id).first()
            if not job:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            skill = job.skills.filter(deleted=False, id=skill_id).first()
            if not skill:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            serializer = JobSkillSerializer(skill, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
            return Response(
                create_response(get_first_error(serializer.errors)),
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("JobSkillView.patch error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ── DELETE soft-delete a skill ──
    @extend_schema(summary='Delete a job skill')
    @permission_required([DELETE_JOB])
    def delete(self, request):
        try:
            skill_id = request.query_params.get('id')
            job_id   = request.query_params.get('job_id')
            if not skill_id or not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            job = _get_job_queryset(request.user).filter(id=job_id).first()
            if not job:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            skill = job.skills.filter(deleted=False, id=skill_id).first()
            if not skill:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            skill.deleted = True
            skill.save(update_fields=['deleted'])
            return Response(create_response(SUCCESSFUL, {'id': str(skill_id)}), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("JobSkillView.delete error: %s", e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)