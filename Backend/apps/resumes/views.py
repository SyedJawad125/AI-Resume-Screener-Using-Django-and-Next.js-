import logging
from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from .models import Resume, BulkResumeUpload, ResumeStatus
from .serializers import (
    ResumeUploadSerializer, ResumeListSerializer, ResumeDetailSerializer,
    ResumeUpdateSerializer, BulkUploadSerializer, BulkUploadStatusSerializer,
    ResumeRetryParseSerializer,
)
from .filters import ResumeFilter

logger = logging.getLogger(__name__)


def scoped_resumes(user):
    """Return resume queryset scoped to user's company & role."""
    from apps.users.models import UserRole
    qs = Resume.objects.select_related('uploaded_by', 'company')
    if getattr(user, 'role', None) == UserRole.SUPER_ADMIN:
        return qs
    qs = qs.filter(company=user.company, is_active=True)
    if getattr(user, 'role', None) == UserRole.RECRUITER:
        qs = qs.filter(uploaded_by=user)
    return qs


# ─────────────────────────────────────────────────────────
#  List
# ─────────────────────────────────────────────────────────
class ResumeListView(generics.ListAPIView):
    """
    GET /api/v1/resumes/
    """
    serializer_class   = ResumeListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = ResumeFilter
    search_fields      = ['candidate_name', 'candidate_email', 'candidate_location', 'original_filename']
    ordering_fields    = ['created_at', 'candidate_name', 'total_experience_years', 'status']
    ordering           = ['-created_at']

    def get_queryset(self):
        return scoped_resumes(self.request.user)

    @extend_schema(tags=['resumes'], summary='List resumes')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ─────────────────────────────────────────────────────────
#  Single Upload
# ─────────────────────────────────────────────────────────
class ResumeUploadView(generics.CreateAPIView):
    """
    POST /api/v1/resumes/upload/
    Accepts multipart/form-data with a single resume file.
    Triggers async parse task after saving.
    """
    serializer_class   = ResumeUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def get_permissions(self):
        from apps.users.permissions import CanUploadResumes
        return [IsAuthenticated(), CanUploadResumes()]

    @extend_schema(tags=['resumes'], summary='Upload a single resume')
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        resume = serializer.save()

        # Trigger async parsing
        from core.tasks import parse_resume_task
        task = parse_resume_task.delay(str(resume.id))

        logger.info(f'Resume {resume.id} uploaded by {request.user.email}, parse task: {task.id}')
        return Response(
            {
                'message':   'Resume uploaded. Parsing in progress.',
                'resume_id': str(resume.id),
                'task_id':   task.id,
                'status':    resume.status,
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────
#  Detail
# ─────────────────────────────────────────────────────────
class ResumeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/resumes/<id>/
    PATCH  /api/v1/resumes/<id>/   — update metadata only
    DELETE /api/v1/resumes/<id>/   — soft delete (is_active=False)
    """
    permission_classes = [IsAuthenticated]
    lookup_field       = 'id'

    def get_queryset(self):
        return scoped_resumes(self.request.user).prefetch_related('skills')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ResumeUpdateSerializer
        return ResumeDetailSerializer

    def destroy(self, request, *args, **kwargs):
        resume = self.get_object()
        resume.is_active = False
        resume.save(update_fields=['is_active'])
        return Response({'message': 'Resume removed.'}, status=status.HTTP_200_OK)

    @extend_schema(tags=['resumes'], summary='Get resume detail')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(tags=['resumes'], summary='Update resume metadata')
    def patch(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


# ─────────────────────────────────────────────────────────
#  Bulk Upload
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'], summary='Bulk upload resumes (up to 100 files)')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_upload_view(request):
    from apps.users.permissions import CanUploadResumes
    if not request.user.has_perm_for('can_upload_resumes'):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = BulkUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    files = serializer.validated_data['files']
    tags  = serializer.validated_data.get('tags', [])

    # Create session record
    session = BulkResumeUpload.objects.create(
        company     = request.user.company,
        uploaded_by = request.user,
        total_files = len(files),
        tags        = tags,
        status      = 'processing',
    )

    # Create resume DB rows
    resume_ids = []
    for f in files:
        r = Resume.objects.create(
            file              = f,
            original_filename = f.name,
            file_type         = f.name.rsplit('.', 1)[-1].lower(),
            file_size_kb      = f.size // 1024,
            company           = request.user.company,
            uploaded_by       = request.user,
            tags              = tags,
            status            = ResumeStatus.UPLOADED,
        )
        resume_ids.append(str(r.id))

    # Trigger bulk parse task
    from core.tasks import bulk_parse_resumes_task
    task = bulk_parse_resumes_task.delay(resume_ids, str(session.id))
    session.task_id = task.id
    session.save(update_fields=['task_id'])

    return Response(
        {
            'message':          f'{len(files)} resumes uploaded. Parsing in progress.',
            'bulk_session_id':  str(session.id),
            'task_id':          task.id,
            'total_files':      len(files),
        },
        status=status.HTTP_202_ACCEPTED,
    )


@extend_schema(tags=['resumes'], summary='Check bulk upload session status')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bulk_upload_status_view(request, session_id):
    try:
        session = BulkResumeUpload.objects.get(id=session_id, company=request.user.company)
    except BulkResumeUpload.DoesNotExist:
        return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(BulkUploadStatusSerializer(session).data)


# ─────────────────────────────────────────────────────────
#  Retry Failed Parses
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'], summary='Re-parse failed resumes')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_parse_view(request):
    serializer = ResumeRetryParseSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    ids     = [str(i) for i in serializer.validated_data['resume_ids']]
    resumes = Resume.objects.filter(id__in=ids, company=request.user.company, status=ResumeStatus.FAILED)

    if not resumes.exists():
        return Response({'error': 'No failed resumes found with those IDs.'}, status=status.HTTP_404_NOT_FOUND)

    from core.tasks import parse_resume_task
    task_ids = [parse_resume_task.delay(str(r.id)).id for r in resumes]

    return Response({
        'message':  f'Retry started for {resumes.count()} resume(s).',
        'task_ids': task_ids,
    })


# ─────────────────────────────────────────────────────────
#  Stats
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['resumes'], summary='Resume statistics for the company')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_stats_view(request):
    from django.db.models import Avg
    qs = Resume.objects.filter(company=request.user.company, is_active=True)
    return Response({
        'total':             qs.count(),
        'indexed':           qs.filter(is_indexed=True).count(),
        'avg_experience':    round(qs.aggregate(a=Avg('total_experience_years'))['a'] or 0, 1),
        'by_status':         {s: qs.filter(status=s).count() for s in ResumeStatus.values},
        'by_education':      {
            lvl: qs.filter(highest_education=lvl).count()
            for lvl in ['bachelor', 'master', 'phd', 'mba', 'associate', 'high_school', 'other']
        },
    })