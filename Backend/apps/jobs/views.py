# import logging
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from drf_spectacular.utils import extend_schema

# from utils.base_api import BaseView
# from utils.reusable_functions import create_response
# from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED
# from utils.decorator import permission_required
# from utils.permission_enums import *

# from .models import JobDescription, JobStatus
# from .serializers import (
#     JobDescriptionWriteSerializer,
#     JobDescriptionDetailSerializer,
#     JobDescriptionListSerializer,
# )
# from .filters import JobDescriptionFilter

# logger = logging.getLogger(__name__)


# # def _scope_filters(user):
# #     """Return extra_filters dict scoped to user's company (non-super-admin)."""
# #     from apps.users.models import Role
# #     if getattr(user, 'role', None) != Role.SUPER_ADMIN:
# #         return {'company': user.company}
# #     return {}


# def _scope_filters(user):
#     """Return extra_filters dict scoped to user's company (non-super-admin)."""
#     # Check if user is Super Admin (based on your login response)
#     is_super_admin = (
#         getattr(user, 'role_name', None) == "Super" or 
#         getattr(user, 'role', None) == 1
#     )
    
#     if not is_super_admin:
#         # Non-super admins only see their own company's jobs
#         # Make sure user has a company attribute
#         if hasattr(user, 'company') and user.company:
#             return {'company': user.company}
#         else:
#             # If user has no company, return empty queryset
#             return {'id': None}  # This will return no results
    
#     # Super admin sees all jobs
#     return {}


# # ─────────────────────────────────────────────────────────
# #  Main CRUD   →   /api/jobs/v1/job/
# #  GET    ?id=<uuid>   → single detail
# #  GET                 → paginated list
# #  POST               → create
# #  PATCH  ?id=<uuid>  → partial update
# #  DELETE ?id=<uuid>  → soft delete (archive)
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
#         # Get the job ID from query params
#         job_id = request.query_params.get('id')
        
#         # Set company scope filter
#         self.extra_filters = _scope_filters(request.user)
        
#         if job_id:
#             # For single job retrieval, use detail serializer
#             self.serializer_class = JobDescriptionDetailSerializer
            
#             # Override the base class behavior to handle single object retrieval
#             try:
#                 # First apply company scope filter, then filter by ID
#                 queryset = JobDescription.objects.filter(
#                     deleted=False, 
#                     **self.extra_filters
#                 )
                
#                 # Get the specific job
#                 instance = queryset.get(id=job_id)
                
#                 # Serialize and return
#                 serializer = self.serializer_class(instance, context={'request': request})
#                 return Response(
#                     create_response(SUCCESSFUL, serializer.data), 
#                     status=status.HTTP_200_OK
#                 )
#             except JobDescription.DoesNotExist:
#                 return Response(
#                     create_response(NOT_FOUND), 
#                     status=status.HTTP_404_NOT_FOUND
#                 )
#         else:
#             # For list view, use the base class method
#             return super().get_(request)

#     @extend_schema(summary='Partial update a job description')
#     @permission_required([UPDATE_JOB])
#     def patch(self, request):
#         self.extra_filters = _scope_filters(request.user)
#         return super().patch_(request)

#     @extend_schema(summary='Soft-delete (archive) a job description')
#     @permission_required([DELETE_JOB])
#     def delete(self, request):
#         """
#         Soft delete: sets deleted=True + status=ARCHIVED.
#         Uses ?id= query param — consistent with BaseView pattern.
#         """
#         try:
#             job_id = request.query_params.get('id')
#             if not job_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             extra = _scope_filters(request.user)
#             instance = JobDescription.objects.filter(
#                 deleted=False, id=job_id, **extra
#             ).first()

#             if not instance:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             # Delegate to model's soft_delete helper
#             instance.soft_delete(user=request.user)

#             serialized_resp = self.serializer_class(instance, context={'request': request}).data
#             return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception("JobView.delete error: %s", e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Lightweight list   →   /api/jobs/v1/job/list/
# #  GET  (for dropdowns, cards, show_job permission)
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobListView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobDescriptionListSerializer
#     filterset_class    = JobDescriptionFilter

#     @extend_schema(summary='Lightweight job list for dropdowns / cards')
#     @permission_required([SHOW_JOB])
#     def get(self, request):
#         self.extra_filters = _scope_filters(request.user)
#         return super().get_(request)

# # ─────────────────────────────────────────────────────────
# #  Toggle status   →   /api/jobs/v1/job/toggle/
# #  PATCH  ?id=<uuid>   body: {"status": "active"|"paused"|...}
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
# #  POST  ?id=<uuid>
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

#             instance = JobDescription.objects.filter(
#                 deleted=False, id=job_id, company=request.user.company
#             ).first()
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
# #  GET
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['jobs'])
# class JobStatsView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = JobDescriptionListSerializer   # required by BaseView

#     @extend_schema(summary='Job statistics for the company')
#     @permission_required([STATS_JOB])
#     def get(self, request):
#         try:
#             qs = JobDescription.objects.filter(
#                 deleted=False, **_scope_filters(request.user)
#             )
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

from .models import JobDescription, JobSkill, JobStatus
from .serializers import (
    JobDescriptionWriteSerializer,
    JobDescriptionDetailSerializer,
    JobDescriptionListSerializer,
    JobSkillSerializer,
)
from .filters import JobDescriptionFilter

logger = logging.getLogger(__name__)


def _scope_filters(user):
    company = getattr(user, 'company', None)
    if company:
        return {'company': company}
    return {}


# ─────────────────────────────────────────────────────────
#  Main CRUD   →   /api/jobs/v1/job/
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
        job_id = request.query_params.get('id')
        self.extra_filters = _scope_filters(request.user)

        if job_id:
            try:
                queryset   = JobDescription.objects.filter(deleted=False, **self.extra_filters)
                instance   = queryset.get(id=job_id)
                serializer = JobDescriptionDetailSerializer(instance, context={'request': request})
                return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
            except JobDescription.DoesNotExist:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)
        else:
            return super().get_(request)

    @extend_schema(summary='Partial update a job description')
    @permission_required([UPDATE_JOB])
    def patch(self, request):
        self.extra_filters = _scope_filters(request.user)
        return super().patch_(request)

    @extend_schema(summary='Soft-delete (archive) a job description')
    @permission_required([DELETE_JOB])
    def delete(self, request):
        try:
            job_id = request.query_params.get('id')
            if not job_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra    = _scope_filters(request.user)
            instance = JobDescription.objects.filter(deleted=False, id=job_id, **extra).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            instance.soft_delete(user=request.user)
            serialized_resp = self.serializer_class(instance, context={'request': request}).data
            return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

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
        self.extra_filters = _scope_filters(request.user)
        return super().get_(request)


# ─────────────────────────────────────────────────────────
#  Toggle status   →   /api/jobs/v1/job/toggle/
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

            extra    = _scope_filters(request.user)
            instance = JobDescription.objects.filter(deleted=False, id=job_id, **extra).first()
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
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobStatsView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobDescriptionListSerializer

    @extend_schema(summary='Job statistics for the company')
    @permission_required([STATS_JOB])
    def get(self, request):
        try:
            qs   = JobDescription.objects.filter(deleted=False, **_scope_filters(request.user))
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


# ─────────────────────────────────────────────────────────
#  Job Skills   →   /api/jobs/v1/job/skills/
#  GET    ?job_id=<uuid>              → list all skills for job
#  POST   ?job_id=<uuid>              → add a skill
#  PATCH  ?job_id=<uuid>&id=<uuid>   → update a skill
#  DELETE ?job_id=<uuid>&id=<uuid>   → delete a skill
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'])
class JobSkillView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = JobSkillSerializer

    def _get_job(self, request, job_id):
        """Fetch job scoped to user's company. Returns None if not found."""
        extra = _scope_filters(request.user)
        return JobDescription.objects.filter(
            deleted=False, id=job_id, **extra
        ).first()

    def _get_skill(self, job, skill_id):
        """Fetch a single skill belonging to this job."""
        return JobSkill.objects.filter(
            id=skill_id, job=job, deleted=False
        ).first()

    @extend_schema(summary='List all skills for a job')
    @permission_required([READ_JOB])
    def get(self, request):
        job_id = request.query_params.get('job_id')
        if not job_id:
            return Response(
                create_response('job_id query param is required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        job = self._get_job(request, job_id)
        if not job:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skills = JobSkill.objects.filter(job=job, deleted=False)
        data   = JobSkillSerializer(skills, many=True).data
        return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

    @extend_schema(summary='Add a skill to a job')
    @permission_required([UPDATE_JOB])
    def post(self, request):
        job_id = request.query_params.get('job_id')
        if not job_id:
            return Response(
                create_response('job_id query param is required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        job = self._get_job(request, job_id)
        if not job:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        serializer = JobSkillSerializer(data=request.data)
        if serializer.is_valid():
            # unique_together guard — revive if soft-deleted
            existing = JobSkill.objects.filter(
                job=job, name=serializer.validated_data['name']
            ).first()

            if existing:
                if existing.deleted:
                    # Revive the soft-deleted skill with new data
                    for attr, value in serializer.validated_data.items():
                        setattr(existing, attr, value)
                    existing.deleted = False
                    existing.save()
                    return Response(
                        create_response(SUCCESSFUL, JobSkillSerializer(existing).data),
                        status=status.HTTP_200_OK,
                    )
                return Response(
                    create_response(f'Skill "{existing.name}" already exists for this job.'),
                    status=status.HTTP_409_CONFLICT,
                )

            skill = serializer.save(job=job)
            return Response(
                create_response(SUCCESSFUL, JobSkillSerializer(skill).data),
                status=status.HTTP_201_CREATED,
            )

        return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary='Update a skill')
    @permission_required([UPDATE_JOB])
    def patch(self, request):
        job_id   = request.query_params.get('job_id')
        skill_id = request.query_params.get('id')

        if not job_id or not skill_id:
            return Response(
                create_response('Both job_id and id query params are required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        job = self._get_job(request, job_id)
        if not job:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skill = self._get_skill(job, skill_id)
        if not skill:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        serializer = JobSkillSerializer(skill, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)

        return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary='Delete a skill (soft delete)')
    @permission_required([UPDATE_JOB])
    def delete(self, request):
        job_id   = request.query_params.get('job_id')
        skill_id = request.query_params.get('id')

        if not job_id or not skill_id:
            return Response(
                create_response('Both job_id and id query params are required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        job = self._get_job(request, job_id)
        if not job:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skill = self._get_skill(job, skill_id)
        if not skill:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skill.deleted = True
        skill.save(update_fields=['deleted'])
        return Response(
            create_response(SUCCESSFUL, {'id': str(skill.id), 'message': f'Skill "{skill.name}" deleted.'}),
            status=status.HTTP_200_OK,
        )