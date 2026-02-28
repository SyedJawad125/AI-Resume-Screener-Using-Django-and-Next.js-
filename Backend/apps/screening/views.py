import logging
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from .models import ScreeningSession, ScreeningResult, AgentExecutionLog, ScreeningStatus
from .serializers import (
    StartScreeningSerializer,
    ScreeningSessionListSerializer,
    ScreeningSessionDetailSerializer,
    ScreeningResultListSerializer,
    ScreeningResultDetailSerializer,
    HumanDecisionSerializer,
    AgentLogSerializer,
    CompareCandidatesSerializer,
)
from .filters import ScreeningSessionFilter, ScreeningResultFilter

logger = logging.getLogger(__name__)


def company_sessions(user):
    from apps.users.models import UserRole
    qs = ScreeningSession.objects.select_related('job', 'initiated_by', 'company')
    if getattr(user, 'role', None) == UserRole.SUPER_ADMIN:
        return qs
    qs = qs.filter(company=user.company)
    if getattr(user, 'role', None) == UserRole.RECRUITER:
        qs = qs.filter(initiated_by=user)
    return qs


def company_results(user):
    from apps.users.models import UserRole
    qs = ScreeningResult.objects.select_related('resume', 'job', 'session', 'reviewed_by')
    if getattr(user, 'role', None) == UserRole.SUPER_ADMIN:
        return qs
    qs = qs.filter(session__company=user.company)
    if not user.has_perm_for('can_view_all_results'):
        qs = qs.filter(session__initiated_by=user)
    return qs


# ─────────────────────────────────────────────────────────
#  Start Screening Session
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'], summary='Start a new AI screening session')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_screening_view(request):
    """
    Validates the request, creates the session + pending results,
    then kicks off the async Celery pipeline.
    """
    from apps.users.permissions import CanScreenResumes
    if not request.user.has_perm_for('can_screen_resumes'):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    ser = StartScreeningSerializer(data=request.data, context={'request': request})
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    job     = ser.job
    resumes = ser.resumes

    # Create session
    session = ScreeningSession.objects.create(
        job              = job,
        company          = request.user.company,
        initiated_by     = request.user,
        total_resumes    = resumes.count(),
        pass_threshold   = ser.validated_data['pass_threshold'],
        top_n_candidates = ser.validated_data['top_n_candidates'],
        status           = ScreeningStatus.PENDING,
    )

    # Bulk-create pending result rows
    ScreeningResult.objects.bulk_create([
        ScreeningResult(session=session, resume=r, job=job)
        for r in resumes
    ])

    # Fire the Celery task
    from core.tasks import run_screening_session_task
    task = run_screening_session_task.delay(str(session.id))
    session.task_id = task.id
    session.save(update_fields=['task_id'])

    # Increment job screening counter
    job.screening_count += 1
    job.save(update_fields=['screening_count'])

    logger.info(f'Screening session {session.id} started by {request.user.email} '
                f'for job "{job.title}" with {resumes.count()} resumes.')

    return Response(
        {
            'message':       f'Screening started for {resumes.count()} resume(s).',
            'session_id':    str(session.id),
            'task_id':       task.id,
            'total_resumes': resumes.count(),
        },
        status=status.HTTP_202_ACCEPTED,
    )


# ─────────────────────────────────────────────────────────
#  Sessions
# ─────────────────────────────────────────────────────────
class ScreeningSessionListView(generics.ListAPIView):
    """GET /api/v1/screening/sessions/"""
    serializer_class   = ScreeningSessionListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class    = ScreeningSessionFilter
    ordering_fields    = ['created_at', 'status', 'total_resumes', 'completed_at']
    ordering           = ['-created_at']

    def get_queryset(self):
        return company_sessions(self.request.user)

    @extend_schema(tags=['screening'], summary='List screening sessions')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ScreeningSessionDetailView(generics.RetrieveDestroyAPIView):
    """GET /api/v1/screening/sessions/<id>/  — with top candidates + progress"""
    serializer_class   = ScreeningSessionDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field       = 'id'

    def get_queryset(self):
        return company_sessions(self.request.user).prefetch_related('results')

    def destroy(self, request, *args, **kwargs):
        session = self.get_object()
        if session.status == ScreeningStatus.PROCESSING:
            return Response(
                {'error': 'Cannot delete a session that is currently processing.'},
                status=status.HTTP_409_CONFLICT,
            )
        session.delete()
        return Response({'message': 'Session deleted.'}, status=status.HTTP_200_OK)

    @extend_schema(tags=['screening'], summary='Get session detail')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ─────────────────────────────────────────────────────────
#  Results
# ─────────────────────────────────────────────────────────
class ScreeningResultListView(generics.ListAPIView):
    """GET /api/v1/screening/results/ — paginated, filterable, sortable"""
    serializer_class   = ScreeningResultListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = ScreeningResultFilter
    search_fields      = ['resume__candidate_name', 'resume__candidate_email']
    ordering_fields    = [
        'overall_score', 'skill_score', 'experience_score', 'education_score',
        'rank', 'created_at',
    ]
    ordering = ['-overall_score']

    def get_queryset(self):
        return company_results(self.request.user)

    @extend_schema(tags=['screening'], summary='List screening results')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ScreeningResultDetailView(generics.RetrieveAPIView):
    """GET /api/v1/screening/results/<id>/  — full explanation + agent logs"""
    serializer_class   = ScreeningResultDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field       = 'id'

    def get_queryset(self):
        return company_results(self.request.user).prefetch_related('agent_logs')

    @extend_schema(tags=['screening'], summary='Get result with full AI explanation')
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


# ─────────────────────────────────────────────────────────
#  Human Decision
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'], summary='Submit HR decision on a candidate')
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def human_decision_view(request, id):
    """HR shortlists / rejects / invites a candidate."""
    if not request.user.has_perm_for('can_screen_resumes'):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        result = ScreeningResult.objects.get(id=id, session__company=request.user.company)
    except ScreeningResult.DoesNotExist:
        return Response({'error': 'Result not found.'}, status=status.HTTP_404_NOT_FOUND)

    ser = HumanDecisionSerializer(result, data=request.data, partial=True, context={'request': request})
    if ser.is_valid():
        ser.save()
        return Response(ScreeningResultListSerializer(result).data)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────────────────
#  Compare Candidates
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'], summary='Side-by-side comparison of 2–5 candidates')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_candidates_view(request):
    ser = CompareCandidatesSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    ids     = ser.validated_data['result_ids']
    results = ScreeningResult.objects.filter(
        id__in=ids,
        session__company=request.user.company,
        status=ScreeningStatus.COMPLETED,
    ).select_related('resume', 'job')

    if results.count() < 2:
        return Response(
            {'error': 'Need at least 2 completed results to compare.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    candidates = []
    for r in results:
        candidates.append({
            'result_id':           str(r.id),
            'candidate_name':      r.resume.candidate_name,
            'candidate_email':     r.resume.candidate_email,
            'overall_score':       r.overall_score,
            'score_breakdown':     r.score_breakdown,
            'years_of_experience': r.years_of_experience,
            'education_level':     r.education_level,
            'matched_skills':      r.matched_skills[:10],
            'missing_skills':      r.missing_skills[:10],
            'strengths':           r.strengths[:3],
            'weaknesses':          r.weaknesses[:3],
            'ai_decision':         r.ai_decision,
            'human_decision':      r.human_decision,
            'recommendation':      r.recommendation,
            'rank':                r.rank,
        })

    candidates.sort(key=lambda x: x['overall_score'], reverse=True)
    job = results.first().job
    return Response({
        'job':        {'id': str(job.id), 'title': job.title},
        'winner':     candidates[0]['candidate_name'],
        'candidates': candidates,
    })


# ─────────────────────────────────────────────────────────
#  Agent Logs
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'], summary='Get agent execution logs for a result')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def agent_logs_view(request, result_id):
    try:
        result = ScreeningResult.objects.get(id=result_id, session__company=request.user.company)
    except ScreeningResult.DoesNotExist:
        return Response({'error': 'Result not found.'}, status=status.HTTP_404_NOT_FOUND)

    logs = AgentExecutionLog.objects.filter(screening_result=result).order_by('created_at')
    return Response(AgentLogSerializer(logs, many=True).data)


# ─────────────────────────────────────────────────────────
#  Analytics
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['analytics'], summary='Screening analytics dashboard')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    if not request.user.has_perm_for('can_view_analytics'):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    sessions = ScreeningSession.objects.filter(company=request.user.company)
    results  = ScreeningResult.objects.filter(session__company=request.user.company)
    completed_results = results.filter(status=ScreeningStatus.COMPLETED)

    data = {
        'sessions': {
            'total':       sessions.count(),
            'completed':   sessions.filter(status=ScreeningStatus.COMPLETED).count(),
            'in_progress': sessions.filter(status=ScreeningStatus.PROCESSING).count(),
            'failed':      sessions.filter(status=ScreeningStatus.FAILED).count(),
        },
        'candidates': {
            'total_screened':  results.count(),
            'avg_score':       round(completed_results.aggregate(a=Avg('overall_score'))['a'] or 0, 2),
            'avg_skill_score': round(completed_results.aggregate(a=Avg('skill_score'))['a'] or 0, 2),
            'avg_exp_score':   round(completed_results.aggregate(a=Avg('experience_score'))['a'] or 0, 2),
            'by_ai_decision': {
                d: completed_results.filter(ai_decision=d).count()
                for d in ['shortlisted', 'interview', 'maybe', 'hold', 'rejected']
            },
        },
        'human_decisions': {
            'total_reviewed': results.exclude(human_decision='').count(),
            'by_decision': {
                d: results.filter(human_decision=d).count()
                for d in ['shortlisted', 'interview', 'maybe', 'hold', 'rejected']
            },
        },
        'cost': {
            'total_tokens_used': sessions.aggregate(t=Count('total_tokens_used'))['t'],
            'total_cost_usd':    str(sessions.aggregate(
                c=Count('total_cost_usd'))['c'] or 0),
        },
        'top_jobs_by_screenings': list(
            sessions.values('job__title')
                    .annotate(count=Count('id'))
                    .order_by('-count')[:10]
        ),
    }
    return Response(data)