import logging
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from .models import JobDescription, JobStatus
from .serializers import (
    JobDescriptionListSerializer,
    JobDescriptionDetailSerializer,
    JobDescriptionWriteSerializer,
)
from .filters import JobDescriptionFilter

logger = logging.getLogger(__name__)


def get_company_qs(user):
    """Base queryset scoped to user's company."""
    from apps.users.models import UserRole
    qs = JobDescription.objects.select_related('company', 'created_by').prefetch_related('skills')
    if getattr(user, 'role', None) != UserRole.SUPER_ADMIN:
        qs = qs.filter(company=user.company)
    return qs


# ─────────────────────────────────────────────────────────
#  List + Create
# ─────────────────────────────────────────────────────────
class JobDescriptionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/jobs/          — list (paginated, filtered)
    POST /api/v1/jobs/          — create new JD
    """
    permission_classes  = [IsAuthenticated]
    filter_backends     = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class     = JobDescriptionFilter
    search_fields       = ['title', 'department', 'description', 'requirements']
    ordering_fields     = ['created_at', 'title', 'screening_count', 'min_experience_years']
    ordering            = ['-created_at']

    def get_queryset(self):
        return get_company_qs(self.request.user)

    def get_serializer_class(self):
        return JobDescriptionWriteSerializer if self.request.method == 'POST' else JobDescriptionListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            from apps.users.permissions import CanManageJobs
            return [IsAuthenticated(), CanManageJobs()]
        return [IsAuthenticated()]

    @extend_schema(tags=['jobs'], summary='List job descriptions')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(tags=['jobs'], summary='Create a job description')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


# ─────────────────────────────────────────────────────────
#  Retrieve + Update + Soft-delete
# ─────────────────────────────────────────────────────────
class JobDescriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/jobs/<id>/   — full detail with skills + analysis
    PATCH  /api/v1/jobs/<id>/   — partial update
    DELETE /api/v1/jobs/<id>/   — archive (soft delete)
    """
    permission_classes = [IsAuthenticated]
    lookup_field       = 'id'

    def get_queryset(self):
        return get_company_qs(self.request.user).select_related('analysis')

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return JobDescriptionWriteSerializer
        return JobDescriptionDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            from apps.users.permissions import CanManageJobs
            return [IsAuthenticated(), CanManageJobs()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        job.status = JobStatus.ARCHIVED
        job.save(update_fields=['status'])
        return Response({'message': 'Job archived successfully.'}, status=status.HTTP_200_OK)

    @extend_schema(tags=['jobs'], summary='Get job description detail')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(tags=['jobs'], summary='Update job description')
    def patch(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


# ─────────────────────────────────────────────────────────
#  Trigger AI Analysis
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'], summary='Trigger AI analysis of a job description')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_job_view(request, id):
    """
    Triggers the JD Analyzer Agent (async Celery task).
    Extracts skills, keywords, ideal candidate profile.
    """
    try:
        job = JobDescription.objects.get(id=id, company=request.user.company)
    except JobDescription.DoesNotExist:
        return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

    from core.tasks import analyze_job_description_task
    task = analyze_job_description_task.delay(str(job.id))
    return Response(
        {'message': 'JD analysis started.', 'task_id': task.id, 'job_id': str(job.id)},
        status=status.HTTP_202_ACCEPTED,
    )


# ─────────────────────────────────────────────────────────
#  Stats
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['jobs'], summary='Job statistics for the company')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_stats_view(request):
    qs = JobDescription.objects.filter(company=request.user.company)
    return Response({
        'total':             qs.count(),
        'active':            qs.filter(status=JobStatus.ACTIVE).count(),
        'draft':             qs.filter(status=JobStatus.DRAFT).count(),
        'total_screenings':  sum(qs.values_list('screening_count', flat=True)),
        'by_status': {s: qs.filter(status=s).count() for s in JobStatus.values},
    })