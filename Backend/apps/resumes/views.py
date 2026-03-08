# import logging
# from rest_framework.parsers import MultiPartParser, FormParser, JSONParser  
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from drf_spectacular.utils import extend_schema

# from utils.base_api import BaseView
# from utils.reusable_functions import create_response
# from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED
# from utils.decorator import permission_required
# from utils.permission_enums import *
# from .models import Resume, BulkResumeUpload, ResumeStatus
# from .serializers import (
#     ResumeWriteSerializer,
#     ResumeDetailSerializer,
#     ResumeListSerializer,
#     BulkUploadSerializer,
#     BulkUploadStatusSerializer,
#     ResumeRetryParseSerializer,
# )
# from .filters import ResumeFilter

# logger = logging.getLogger(__name__)


# def _scope_filters(user):
#     """
#     Return queryset filters scoped to the user's company & role.
#     Super admins (role=1) see all resumes.
#     """
#     # Check if user is Super Admin (role=1 from your login response)
#     if getattr(user, 'role', None) == 1:  # Super Admin
#         return {'deleted': False}
    
#     # For users with company
#     company = getattr(user, 'company', None)
#     if company:
#         filters = {'company': company, 'deleted': False}
        
#         # Check if user has RECRUITER role - based on your permission enums
#         # You can check by permission or role value
#         if not user.has_perm(SHOW_ALL_RESUMES):  # If no permission to see all resumes
#             filters['created_by'] = user
            
#         return filters
    
#     # Default: show only non-deleted resumes created by this user
#     return {'created_by': user, 'deleted': False}


# # ─────────────────────────────────────────────────────────
# #  Main CRUD   →   /api/resumes/v1/resume/
# #  GET    ?id=<uuid>   → single detail
# #  GET                 → paginated list
# #  POST               → upload single resume
# #  PATCH  ?id=<uuid>  → partial update (metadata only)
# #  DELETE ?id=<uuid>  → soft delete
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['resumes'])
# class ResumeView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     parser_classes     = (MultiPartParser, FormParser, JSONParser)
#     serializer_class   = ResumeWriteSerializer
#     list_serializer    = ResumeListSerializer
#     filterset_class    = ResumeFilter

#     @extend_schema(summary='Upload a single resume (multipart/form-data)')
#     @permission_required([UPLOAD_RESUME])
#     def post(self, request):
#         self.extra_filters = _scope_filters(request.user)
        
#         # Handle both JSON and multipart form data
#         if request.content_type == 'application/json':
#             # For JSON requests, use the data directly
#             data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
#         else:
#             # For multipart/form-data, copy the data
#             data = request.data.copy()
        
#         # Add company from user if not provided AND user has a company
#         if not data.get('company'):
#             if hasattr(request.user, 'company') and request.user.company:
#                 data['company'] = request.user.company.id
#             else:
#                 # For Super Admin or users without company, company field is required in the request
#                 if not data.get('company'):
#                     return Response(
#                         create_response('company field is required for users without an assigned company'),
#                         status=status.HTTP_400_BAD_REQUEST
#                     )
            
#         serializer = self.serializer_class(data=data, context={'request': request})
#         if not serializer.is_valid():
#             return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#         resume = serializer.save(created_by=request.user)

#         # Trigger async parsing
#         try:
#             from apps.core.tasks import parse_resume_task
#             task = parse_resume_task.delay(str(resume.id))
#             logger.info('Resume %s uploaded by %s — parse task: %s', resume.id, request.user.email, task.id)
#             task_id = task.id
#         except ImportError:
#             logger.warning('parse_resume_task not available, skipping async parsing')
#             task_id = None

#         return Response(
#             create_response(SUCCESSFUL, {
#                 'resume_id': str(resume.id),
#                 'task_id':   task_id,
#                 'status':    resume.status,
#                 'message':   'Resume uploaded successfully. Parsing in progress.',
#             }),
#             status=status.HTTP_201_CREATED,
#         )
#     @extend_schema(summary='List or retrieve resumes')
#     @permission_required([READ_RESUME])
#     def get(self, request):
#         resume_id = request.query_params.get('id')
#         self.extra_filters = _scope_filters(request.user)

#         if resume_id:
#             try:
#                 queryset = Resume.objects.filter(**self.extra_filters)
#                 instance = queryset.get(id=resume_id)
#                 serializer = ResumeDetailSerializer(instance, context={'request': request})
#                 return Response(
#                     create_response(SUCCESSFUL, serializer.data),
#                     status=status.HTTP_200_OK,
#                 )
#             except Resume.DoesNotExist:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)
#         else:
#             return super().get_(request)

#     @extend_schema(summary='Partial update resume metadata')
#     @permission_required([UPDATE_RESUME])
#     def patch(self, request):
#         self.extra_filters = _scope_filters(request.user)
#         return super().patch_(request)

#     @extend_schema(summary='Soft-delete (remove) a resume')
#     @permission_required([DELETE_RESUME])
#     def delete(self, request):
#         try:
#             resume_id = request.query_params.get('id')
#             if not resume_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             extra    = _scope_filters(request.user)
#             instance = Resume.objects.filter(id=resume_id, **extra).first()

#             if not instance:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             instance.soft_delete(user=request.user)

#             serialized_resp = self.serializer_class(instance, context={'request': request}).data
#             return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception('ResumeView.delete error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Lightweight list   →   /api/resumes/v1/resume/list/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['resumes'])
# class ResumeListView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = ResumeListSerializer
#     filterset_class    = ResumeFilter

#     @extend_schema(summary='Lightweight resume list for tables / dropdowns')
#     @permission_required([SHOW_RESUME])
#     def get(self, request):
#         self.extra_filters = _scope_filters(request.user)
#         return super().get_(request)


# # ─────────────────────────────────────────────────────────
# #  Bulk Upload   →   /api/resumes/v1/resume/bulk-upload/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['resumes'])
# class ResumeBulkUploadView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     parser_classes     = (MultiPartParser, FormParser)
#     serializer_class   = ResumeWriteSerializer

#     @extend_schema(summary='Bulk upload resumes (up to 100 files)')
#     @permission_required([BULK_UPLOAD_RESUME])
#     def post(self, request):
#         try:
#             serializer = BulkUploadSerializer(data=request.data)
#             if not serializer.is_valid():
#                 return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#             files   = serializer.validated_data['files']
#             tags    = serializer.validated_data.get('tags', [])
#             company = getattr(request.user, 'company', None)

#             if not company and getattr(request.user, 'role', None) != 1:  # Not super admin
#                 return Response(
#                     create_response('Your account has no company assigned.'),
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             # Create bulk session record
#             session = BulkResumeUpload.objects.create(
#                 company     = company,
#                 uploaded_by = request.user,
#                 total_files = len(files),
#                 tags        = tags,
#                 status      = 'processing',
#             )

#             # Persist each resume row
#             resume_ids = []
#             for f in files:
#                 r = Resume.objects.create(
#                     file              = f,
#                     original_filename = f.name,
#                     file_type         = f.name.rsplit('.', 1)[-1].lower(),
#                     file_size_kb      = f.size // 1024,
#                     company           = company,
#                     created_by        = request.user,
#                     tags              = tags,
#                     status            = ResumeStatus.UPLOADED,
#                 )
#                 resume_ids.append(str(r.id))

#             # Fire bulk parse task
#             try:
#                 from apps.core.tasks import bulk_parse_resumes_task
#                 task = bulk_parse_resumes_task.delay(resume_ids, str(session.id))
#                 session.task_id = task.id
#                 session.save(update_fields=['task_id'])
#                 task_id = task.id
#             except ImportError:
#                 logger.warning('bulk_parse_resumes_task not available, skipping async parsing')
#                 task_id = None

#             logger.info(
#                 'Bulk upload: %d resumes by %s — session: %s, task: %s',
#                 len(files), request.user.email, session.id, task_id,
#             )
#             return Response(
#                 create_response(SUCCESSFUL, {
#                     'bulk_session_id': str(session.id),
#                     'task_id':         task_id,
#                     'total_files':     len(files),
#                     'message':         f'{len(files)} resumes uploaded. Parsing in progress.',
#                 }),
#                 status=status.HTTP_202_ACCEPTED,
#             )

#         except Exception as e:
#             logger.exception('ResumeBulkUploadView.post error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Bulk Upload Status   →   /api/resumes/v1/resume/bulk-upload/status/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['resumes'])
# class ResumeBulkUploadStatusView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = BulkUploadStatusSerializer

#     @extend_schema(summary='Check bulk upload session status')
#     @permission_required([BULK_UPLOAD_RESUME])
#     def get(self, request):
#         try:
#             session_id = request.query_params.get('session_id')
#             if not session_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             filters = {'id': session_id}
#             company = getattr(request.user, 'company', None)
            
#             # Super admin can see any session
#             if getattr(request.user, 'role', None) != 1 and company:
#                 filters['company'] = company

#             session = BulkResumeUpload.objects.filter(**filters).first()
#             if not session:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             serializer = BulkUploadStatusSerializer(session)
#             return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception('ResumeBulkUploadStatusView.get error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Retry Failed Parses   →   /api/resumes/v1/resume/retry-parse/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['resumes'])
# class ResumeRetryParseView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = ResumeWriteSerializer

#     @extend_schema(summary='Re-trigger parsing for failed resumes')
#     @permission_required([RETRY_PARSE_RESUME])
#     def post(self, request):
#         try:
#             serializer = ResumeRetryParseSerializer(data=request.data)
#             if not serializer.is_valid():
#                 return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#             ids     = [str(i) for i in serializer.validated_data['resume_ids']]
#             extra   = _scope_filters(request.user)
#             resumes = Resume.objects.filter(id__in=ids, status=ResumeStatus.FAILED, **extra)

#             if not resumes.exists():
#                 return Response(
#                     create_response('No failed resumes found with those IDs.'),
#                     status=status.HTTP_404_NOT_FOUND,
#                 )

#             task_ids = []
#             try:
#                 from apps.core.tasks import parse_resume_task
#                 for r in resumes:
#                     task = parse_resume_task.delay(str(r.id))
#                     task_ids.append(task.id)
#             except ImportError:
#                 logger.warning('parse_resume_task not available, skipping async parsing')
#                 # Update status directly
#                 resumes.update(status=ResumeStatus.UPLOADED, parse_error='')

#             return Response(
#                 create_response(SUCCESSFUL, {
#                     'retried_count': resumes.count(),
#                     'task_ids':      task_ids,
#                     'message':       f'Retry started for {resumes.count()} resume(s).',
#                 }),
#                 status=status.HTTP_202_ACCEPTED,
#             )

#         except Exception as e:
#             logger.exception('ResumeRetryParseView.post error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Resume Stats   →   /api/resumes/v1/resume/stats/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['resumes'])
# class ResumeStatsView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = ResumeListSerializer

#     @extend_schema(summary='Resume statistics for the company')
#     @permission_required([STATS_RESUME])
#     def get(self, request):
#         try:
#             from django.db.models import Avg, Count
#             extra = _scope_filters(request.user)
#             qs    = Resume.objects.filter(**extra)

#             data = {
#                 'total':          qs.count(),
#                 'indexed':        qs.filter(is_indexed=True).count(),
#                 'active':         qs.filter(is_active=True).count(),
#                 'avg_experience': round(qs.aggregate(a=Avg('total_experience_years'))['a'] or 0, 1),
#                 'by_status': {s: qs.filter(status=s).count() for s in ResumeStatus.values},
#                 'by_education': {
#                     lvl: qs.filter(highest_education=lvl).count()
#                     for lvl in ['bachelor', 'master', 'phd', 'mba', 'associate', 'high_school', 'other']
#                 },
#             }
#             return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception('ResumeStatsView.get error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)







import logging
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from utils.base_api import BaseView
from utils.reusable_functions import create_response
from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED
from utils.decorator import permission_required
from utils.permission_enums import *

from .models import Resume, ResumeSkill, BulkResumeUpload, ResumeStatus
from .serializers import (
    ResumeWriteSerializer,
    ResumeDetailSerializer,
    ResumeListSerializer,
    ResumeSkillSerializer,
    BulkUploadSerializer,
    BulkUploadStatusSerializer,
    ResumeRetryParseSerializer,
)
from .filters import ResumeFilter

logger = logging.getLogger(__name__)


def _scope_filters(user):
    """
    Return queryset keyword filters scoped to the user's company.
    Super admins (role == 1) see every resume.
    Regular users without a company can only see their own uploads.
    Note: deleted=False is always applied at the call site, not here.
    """
    if getattr(user, 'role', None) == 1:
        return {}

    company = getattr(user, 'company', None)
    if company:
        return {'company': company}

    return {'created_by': user}


# ─────────────────────────────────────────────────────────
#  Main CRUD   →   /api/resumes/v1/resume/
#  GET    ?id=<uuid>   → single detail
#  GET                 → paginated list
#  POST               → upload single resume
#  PATCH  ?id=<uuid>  → partial update (metadata only)
#  DELETE ?id=<uuid>  → soft delete
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'])
class ResumeView(BaseView):
    permission_classes = (IsAuthenticated,)
    parser_classes     = (MultiPartParser, FormParser, JSONParser)
    serializer_class   = ResumeWriteSerializer
    list_serializer    = ResumeListSerializer
    filterset_class    = ResumeFilter

    @extend_schema(summary='Upload a single resume (multipart/form-data)')
    @permission_required([UPLOAD_RESUME])
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        resume = serializer.save()

        try:
            from apps.core.tasks import parse_resume_task
            task    = parse_resume_task.delay(str(resume.id))
            task_id = task.id
            logger.info('Resume %s uploaded by %s — parse task: %s', resume.id, request.user.email, task_id)
        except ImportError:
            logger.warning('parse_resume_task not available, skipping async parsing')
            task_id = None

        return Response(
            create_response(SUCCESSFUL, {
                'resume_id': str(resume.id),
                'task_id':   task_id,
                'status':    resume.status,
                'message':   'Resume uploaded successfully. Parsing in progress.',
            }),
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(summary='List or retrieve resumes')
    @permission_required([READ_RESUME])
    def get(self, request):
        resume_id = request.query_params.get('id')
        self.extra_filters = _scope_filters(request.user)

        if resume_id:
            try:
                instance   = Resume.objects.filter(deleted=False, **self.extra_filters).get(id=resume_id)
                serializer = ResumeDetailSerializer(instance, context={'request': request})
                return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
            except Resume.DoesNotExist:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        return super().get_(request)

    @extend_schema(summary='Partial update resume metadata')
    @permission_required([UPDATE_RESUME])
    def patch(self, request):
        self.extra_filters = _scope_filters(request.user)
        return super().patch_(request)

    @extend_schema(summary='Soft-delete (remove) a resume')
    @permission_required([DELETE_RESUME])
    def delete(self, request):
        try:
            resume_id = request.query_params.get('id')
            if not resume_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra    = _scope_filters(request.user)
            instance = Resume.objects.filter(deleted=False, id=resume_id, **extra).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            instance.soft_delete(user=request.user)
            serialized_resp = self.serializer_class(instance, context={'request': request}).data
            return Response(create_response(SUCCESSFUL, serialized_resp), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('ResumeView.delete error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Lightweight list   →   /api/resumes/v1/resume/list/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'])
class ResumeListView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ResumeListSerializer
    filterset_class    = ResumeFilter

    @extend_schema(summary='Lightweight resume list for tables / dropdowns')
    @permission_required([SHOW_RESUME])
    def get(self, request):
        self.extra_filters = _scope_filters(request.user)
        return super().get_(request)


# ─────────────────────────────────────────────────────────
#  Resume Skills   →   /api/resumes/v1/resume/skills/
#  GET    ?resume_id=<uuid>              → list all skills
#  POST   ?resume_id=<uuid>              → add a skill
#  PATCH  ?resume_id=<uuid>&id=<uuid>   → update a skill
#  DELETE ?resume_id=<uuid>&id=<uuid>   → soft delete a skill
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'])
class ResumeSkillView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ResumeSkillSerializer

    def _get_resume(self, request, resume_id):
        extra = _scope_filters(request.user)
        return Resume.objects.filter(deleted=False, id=resume_id, **extra).first()

    def _get_skill(self, resume, skill_id):
        return ResumeSkill.objects.filter(id=skill_id, resume=resume, deleted=False).first()

    @extend_schema(summary='List all skills for a resume')
    @permission_required([READ_RESUME])
    def get(self, request):
        resume_id = request.query_params.get('resume_id')
        if not resume_id:
            return Response(
                create_response('resume_id query param is required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = self._get_resume(request, resume_id)
        if not resume:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skills = ResumeSkill.objects.filter(resume=resume, deleted=False)
        data   = ResumeSkillSerializer(skills, many=True).data
        return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

    @extend_schema(summary='Add a skill to a resume')
    @permission_required([UPDATE_RESUME])
    def post(self, request):
        resume_id = request.query_params.get('resume_id')
        if not resume_id:
            return Response(
                create_response('resume_id query param is required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = self._get_resume(request, resume_id)
        if not resume:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        serializer = ResumeSkillSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

        # unique_together guard — revive if soft-deleted
        existing = ResumeSkill.objects.filter(
            resume=resume, name=serializer.validated_data['name']
        ).first()

        if existing:
            if existing.deleted:
                for attr, value in serializer.validated_data.items():
                    setattr(existing, attr, value)
                existing.deleted = False
                existing.save()
                return Response(
                    create_response(SUCCESSFUL, ResumeSkillSerializer(existing).data),
                    status=status.HTTP_200_OK,
                )
            return Response(
                create_response(f'Skill "{existing.name}" already exists for this resume.'),
                status=status.HTTP_409_CONFLICT,
            )

        skill = serializer.save(resume=resume)
        return Response(
            create_response(SUCCESSFUL, ResumeSkillSerializer(skill).data),
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(summary='Update a resume skill')
    @permission_required([UPDATE_RESUME])
    def patch(self, request):
        resume_id = request.query_params.get('resume_id')
        skill_id  = request.query_params.get('id')

        if not resume_id or not skill_id:
            return Response(
                create_response('Both resume_id and id query params are required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = self._get_resume(request, resume_id)
        if not resume:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skill = self._get_skill(resume, skill_id)
        if not skill:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        serializer = ResumeSkillSerializer(skill, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)

        return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(summary='Delete a resume skill (soft delete)')
    @permission_required([UPDATE_RESUME])
    def delete(self, request):
        resume_id = request.query_params.get('resume_id')
        skill_id  = request.query_params.get('id')

        if not resume_id or not skill_id:
            return Response(
                create_response('Both resume_id and id query params are required.'),
                status=status.HTTP_400_BAD_REQUEST,
            )

        resume = self._get_resume(request, resume_id)
        if not resume:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skill = self._get_skill(resume, skill_id)
        if not skill:
            return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        skill.deleted = True
        skill.save(update_fields=['deleted'])
        return Response(
            create_response(SUCCESSFUL, {'id': str(skill.id), 'message': f'Skill "{skill.name}" deleted.'}),
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────
#  Bulk Upload   →   /api/resumes/v1/resume/bulk-upload/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'])
class ResumeBulkUploadView(BaseView):
    permission_classes = (IsAuthenticated,)
    parser_classes     = (MultiPartParser, FormParser)
    serializer_class   = ResumeWriteSerializer

    @extend_schema(summary='Bulk upload resumes (up to 100 files)')
    @permission_required([BULK_UPLOAD_RESUME])
    def post(self, request):
        try:
            serializer = BulkUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

            files   = serializer.validated_data['files']
            tags    = serializer.validated_data.get('tags', [])
            company = getattr(request.user, 'company', None)

            if not company and getattr(request.user, 'role', None) != 1:
                return Response(
                    create_response('Your account has no company assigned.'),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            session = BulkResumeUpload.objects.create(
                company     = company,
                uploaded_by = request.user,
                total_files = len(files),
                tags        = tags,
                status      = 'processing',
            )

            resume_ids = []
            for f in files:
                r = Resume.objects.create(
                    file              = f,
                    original_filename = f.name,
                    file_type         = f.name.rsplit('.', 1)[-1].lower(),
                    file_size_kb      = f.size // 1024,
                    company           = company,
                    created_by        = request.user,
                    tags              = tags,
                    status            = ResumeStatus.UPLOADED,
                )
                resume_ids.append(str(r.id))

            try:
                from apps.core.tasks import bulk_parse_resumes_task
                task = bulk_parse_resumes_task.delay(resume_ids, str(session.id))
                session.task_id = task.id
                session.save(update_fields=['task_id'])
                task_id = task.id
            except ImportError:
                logger.warning('bulk_parse_resumes_task not available, skipping async parsing')
                task_id = None

            logger.info(
                'Bulk upload: %d resumes by %s — session: %s, task: %s',
                len(files), request.user.email, session.id, task_id,
            )
            return Response(
                create_response(SUCCESSFUL, {
                    'bulk_session_id': str(session.id),
                    'task_id':         task_id,
                    'total_files':     len(files),
                    'message':         f'{len(files)} resumes uploaded. Parsing in progress.',
                }),
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            logger.exception('ResumeBulkUploadView.post error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Bulk Upload Status   →   /api/resumes/v1/resume/bulk-upload/status/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'])
class ResumeBulkUploadStatusView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = BulkUploadStatusSerializer

    @extend_schema(summary='Check bulk upload session status')
    @permission_required([BULK_UPLOAD_RESUME])
    def get(self, request):
        try:
            session_id = request.query_params.get('session_id')
            if not session_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            filters = {'id': session_id}
            company = getattr(request.user, 'company', None)
            if getattr(request.user, 'role', None) != 1 and company:
                filters['company'] = company

            session = BulkResumeUpload.objects.filter(**filters).first()
            if not session:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            return Response(
                create_response(SUCCESSFUL, BulkUploadStatusSerializer(session).data),
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception('ResumeBulkUploadStatusView.get error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Retry Failed Parses   →   /api/resumes/v1/resume/retry-parse/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'])
class ResumeRetryParseView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ResumeWriteSerializer

    @extend_schema(summary='Re-trigger parsing for failed resumes')
    @permission_required([RETRY_PARSE_RESUME])
    def post(self, request):
        try:
            serializer = ResumeRetryParseSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

            ids     = [str(i) for i in serializer.validated_data['resume_ids']]
            extra   = _scope_filters(request.user)
            resumes = Resume.objects.filter(deleted=False, id__in=ids, status=ResumeStatus.FAILED, **extra)

            if not resumes.exists():
                return Response(
                    create_response('No failed resumes found with those IDs.'),
                    status=status.HTTP_404_NOT_FOUND,
                )

            task_ids = []
            try:
                from apps.core.tasks import parse_resume_task
                for r in resumes:
                    task = parse_resume_task.delay(str(r.id))
                    task_ids.append(task.id)
            except ImportError:
                logger.warning('parse_resume_task not available, skipping async parsing')
                resumes.update(status=ResumeStatus.UPLOADED, parse_error='')

            return Response(
                create_response(SUCCESSFUL, {
                    'retried_count': resumes.count(),
                    'task_ids':      task_ids,
                    'message':       f'Retry started for {resumes.count()} resume(s).',
                }),
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            logger.exception('ResumeRetryParseView.post error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Resume Stats   →   /api/resumes/v1/resume/stats/
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'])
class ResumeStatsView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ResumeListSerializer

    @extend_schema(summary='Resume statistics for the company')
    @permission_required([STATS_RESUME])
    def get(self, request):
        try:
            from django.db.models import Avg
            extra = _scope_filters(request.user)
            qs    = Resume.objects.filter(deleted=False, **extra)

            data = {
                'total':          qs.count(),
                'indexed':        qs.filter(is_indexed=True).count(),
                'active':         qs.filter(is_active=True).count(),
                'avg_experience': round(qs.aggregate(a=Avg('total_experience_years'))['a'] or 0, 1),
                'by_status': {s: qs.filter(status=s).count() for s in ResumeStatus.values},
                'by_education': {
                    lvl: qs.filter(highest_education=lvl).count()
                    for lvl in ['bachelor', 'master', 'phd', 'mba', 'associate', 'high_school', 'other']
                },
            }
            return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('ResumeStatsView.get error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)