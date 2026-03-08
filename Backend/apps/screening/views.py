# import logging
# from django.db.models import Avg, Count, Q
# from django.utils import timezone
# from rest_framework import generics, status, filters
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from django_filters.rest_framework import DjangoFilterBackend
# from drf_spectacular.utils import extend_schema

# from .models import ScreeningSession, ScreeningResult, AgentExecutionLog, ScreeningStatus
# from .serializers import (
#     StartScreeningSerializer,
#     ScreeningSessionListSerializer,
#     ScreeningSessionDetailSerializer,
#     ScreeningResultListSerializer,
#     ScreeningResultDetailSerializer,
#     HumanDecisionSerializer,
#     AgentLogSerializer,
#     CompareCandidatesSerializer,
# )
# from .filters import ScreeningSessionFilter, ScreeningResultFilter

# logger = logging.getLogger(__name__)


# def company_sessions(user):
#     from apps.users.models import UserRole
#     qs = ScreeningSession.objects.select_related('job', 'initiated_by', 'company')
#     if getattr(user, 'role', None) == UserRole.SUPER_ADMIN:
#         return qs
#     qs = qs.filter(company=user.company)
#     if getattr(user, 'role', None) == UserRole.RECRUITER:
#         qs = qs.filter(initiated_by=user)
#     return qs


# def company_results(user):
#     from apps.users.models import UserRole
#     qs = ScreeningResult.objects.select_related('resume', 'job', 'session', 'reviewed_by')
#     if getattr(user, 'role', None) == UserRole.SUPER_ADMIN:
#         return qs
#     qs = qs.filter(session__company=user.company)
#     if not user.has_perm_for('can_view_all_results'):
#         qs = qs.filter(session__initiated_by=user)
#     return qs


# # ─────────────────────────────────────────────────────────
# #  Start Screening Session
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'], summary='Start a new AI screening session')
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def start_screening_view(request):
#     """
#     Validates the request, creates the session + pending results,
#     then kicks off the async Celery pipeline.
#     """
#     from apps.users.permissions import CanScreenResumes
#     if not request.user.has_perm_for('can_screen_resumes'):
#         return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

#     ser = StartScreeningSerializer(data=request.data, context={'request': request})
#     if not ser.is_valid():
#         return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

#     job     = ser.job
#     resumes = ser.resumes

#     # Create session
#     session = ScreeningSession.objects.create(
#         job              = job,
#         company          = request.user.company,
#         initiated_by     = request.user,
#         total_resumes    = resumes.count(),
#         pass_threshold   = ser.validated_data['pass_threshold'],
#         top_n_candidates = ser.validated_data['top_n_candidates'],
#         status           = ScreeningStatus.PENDING,
#     )

#     # Bulk-create pending result rows
#     ScreeningResult.objects.bulk_create([
#         ScreeningResult(session=session, resume=r, job=job)
#         for r in resumes
#     ])

#     # Fire the Celery task
#     from core.tasks import run_screening_session_task
#     task = run_screening_session_task.delay(str(session.id))
#     session.task_id = task.id
#     session.save(update_fields=['task_id'])

#     # Increment job screening counter
#     job.screening_count += 1
#     job.save(update_fields=['screening_count'])

#     logger.info(f'Screening session {session.id} started by {request.user.email} '
#                 f'for job "{job.title}" with {resumes.count()} resumes.')

#     return Response(
#         {
#             'message':       f'Screening started for {resumes.count()} resume(s).',
#             'session_id':    str(session.id),
#             'task_id':       task.id,
#             'total_resumes': resumes.count(),
#         },
#         status=status.HTTP_202_ACCEPTED,
#     )


# # ─────────────────────────────────────────────────────────
# #  Sessions
# # ─────────────────────────────────────────────────────────
# class ScreeningSessionListView(generics.ListAPIView):
#     """GET /api/v1/screening/sessions/"""
#     serializer_class   = ScreeningSessionListSerializer
#     permission_classes = [IsAuthenticated]
#     filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
#     filterset_class    = ScreeningSessionFilter
#     ordering_fields    = ['created_at', 'status', 'total_resumes', 'completed_at']
#     ordering           = ['-created_at']

#     def get_queryset(self):
#         return company_sessions(self.request.user)

#     @extend_schema(tags=['screening'], summary='List screening sessions')
#     def get(self, request, *args, **kwargs):
#         return super().get(request, *args, **kwargs)


# class ScreeningSessionDetailView(generics.RetrieveDestroyAPIView):
#     """GET /api/v1/screening/sessions/<id>/  — with top candidates + progress"""
#     serializer_class   = ScreeningSessionDetailSerializer
#     permission_classes = [IsAuthenticated]
#     lookup_field       = 'id'

#     def get_queryset(self):
#         return company_sessions(self.request.user).prefetch_related('results')

#     def destroy(self, request, *args, **kwargs):
#         session = self.get_object()
#         if session.status == ScreeningStatus.PROCESSING:
#             return Response(
#                 {'error': 'Cannot delete a session that is currently processing.'},
#                 status=status.HTTP_409_CONFLICT,
#             )
#         session.delete()
#         return Response({'message': 'Session deleted.'}, status=status.HTTP_200_OK)

#     @extend_schema(tags=['screening'], summary='Get session detail')
#     def get(self, request, *args, **kwargs):
#         return super().get(request, *args, **kwargs)


# # ─────────────────────────────────────────────────────────
# #  Results
# # ─────────────────────────────────────────────────────────
# class ScreeningResultListView(generics.ListAPIView):
#     """GET /api/v1/screening/results/ — paginated, filterable, sortable"""
#     serializer_class   = ScreeningResultListSerializer
#     permission_classes = [IsAuthenticated]
#     filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
#     filterset_class    = ScreeningResultFilter
#     search_fields      = ['resume__candidate_name', 'resume__candidate_email']
#     ordering_fields    = [
#         'overall_score', 'skill_score', 'experience_score', 'education_score',
#         'rank', 'created_at',
#     ]
#     ordering = ['-overall_score']

#     def get_queryset(self):
#         return company_results(self.request.user)

#     @extend_schema(tags=['screening'], summary='List screening results')
#     def get(self, request, *args, **kwargs):
#         return super().get(request, *args, **kwargs)


# class ScreeningResultDetailView(generics.RetrieveAPIView):
#     """GET /api/v1/screening/results/<id>/  — full explanation + agent logs"""
#     serializer_class   = ScreeningResultDetailSerializer
#     permission_classes = [IsAuthenticated]
#     lookup_field       = 'id'

#     def get_queryset(self):
#         return company_results(self.request.user).prefetch_related('agent_logs')

#     @extend_schema(tags=['screening'], summary='Get result with full AI explanation')
#     def get(self, request, *args, **kwargs):
#         return super().get(request, *args, **kwargs)


# # ─────────────────────────────────────────────────────────
# #  Human Decision
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'], summary='Submit HR decision on a candidate')
# @api_view(['PATCH'])
# @permission_classes([IsAuthenticated])
# def human_decision_view(request, id):
#     """HR shortlists / rejects / invites a candidate."""
#     if not request.user.has_perm_for('can_screen_resumes'):
#         return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
#     try:
#         result = ScreeningResult.objects.get(id=id, session__company=request.user.company)
#     except ScreeningResult.DoesNotExist:
#         return Response({'error': 'Result not found.'}, status=status.HTTP_404_NOT_FOUND)

#     ser = HumanDecisionSerializer(result, data=request.data, partial=True, context={'request': request})
#     if ser.is_valid():
#         ser.save()
#         return Response(ScreeningResultListSerializer(result).data)
#     return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


# # ─────────────────────────────────────────────────────────
# #  Compare Candidates
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'], summary='Side-by-side comparison of 2–5 candidates')
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def compare_candidates_view(request):
#     ser = CompareCandidatesSerializer(data=request.data)
#     if not ser.is_valid():
#         return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

#     ids     = ser.validated_data['result_ids']
#     results = ScreeningResult.objects.filter(
#         id__in=ids,
#         session__company=request.user.company,
#         status=ScreeningStatus.COMPLETED,
#     ).select_related('resume', 'job')

#     if results.count() < 2:
#         return Response(
#             {'error': 'Need at least 2 completed results to compare.'},
#             status=status.HTTP_400_BAD_REQUEST,
#         )

#     candidates = []
#     for r in results:
#         candidates.append({
#             'result_id':           str(r.id),
#             'candidate_name':      r.resume.candidate_name,
#             'candidate_email':     r.resume.candidate_email,
#             'overall_score':       r.overall_score,
#             'score_breakdown':     r.score_breakdown,
#             'years_of_experience': r.years_of_experience,
#             'education_level':     r.education_level,
#             'matched_skills':      r.matched_skills[:10],
#             'missing_skills':      r.missing_skills[:10],
#             'strengths':           r.strengths[:3],
#             'weaknesses':          r.weaknesses[:3],
#             'ai_decision':         r.ai_decision,
#             'human_decision':      r.human_decision,
#             'recommendation':      r.recommendation,
#             'rank':                r.rank,
#         })

#     candidates.sort(key=lambda x: x['overall_score'], reverse=True)
#     job = results.first().job
#     return Response({
#         'job':        {'id': str(job.id), 'title': job.title},
#         'winner':     candidates[0]['candidate_name'],
#         'candidates': candidates,
#     })


# # ─────────────────────────────────────────────────────────
# #  Agent Logs
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'], summary='Get agent execution logs for a result')
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def agent_logs_view(request, result_id):
#     try:
#         result = ScreeningResult.objects.get(id=result_id, session__company=request.user.company)
#     except ScreeningResult.DoesNotExist:
#         return Response({'error': 'Result not found.'}, status=status.HTTP_404_NOT_FOUND)

#     logs = AgentExecutionLog.objects.filter(screening_result=result).order_by('created_at')
#     return Response(AgentLogSerializer(logs, many=True).data)


# # ─────────────────────────────────────────────────────────
# #  Analytics
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['analytics'], summary='Screening analytics dashboard')
# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def analytics_view(request):
#     if not request.user.has_perm_for('can_view_analytics'):
#         return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

#     sessions = ScreeningSession.objects.filter(company=request.user.company)
#     results  = ScreeningResult.objects.filter(session__company=request.user.company)
#     completed_results = results.filter(status=ScreeningStatus.COMPLETED)

#     data = {
#         'sessions': {
#             'total':       sessions.count(),
#             'completed':   sessions.filter(status=ScreeningStatus.COMPLETED).count(),
#             'in_progress': sessions.filter(status=ScreeningStatus.PROCESSING).count(),
#             'failed':      sessions.filter(status=ScreeningStatus.FAILED).count(),
#         },
#         'candidates': {
#             'total_screened':  results.count(),
#             'avg_score':       round(completed_results.aggregate(a=Avg('overall_score'))['a'] or 0, 2),
#             'avg_skill_score': round(completed_results.aggregate(a=Avg('skill_score'))['a'] or 0, 2),
#             'avg_exp_score':   round(completed_results.aggregate(a=Avg('experience_score'))['a'] or 0, 2),
#             'by_ai_decision': {
#                 d: completed_results.filter(ai_decision=d).count()
#                 for d in ['shortlisted', 'interview', 'maybe', 'hold', 'rejected']
#             },
#         },
#         'human_decisions': {
#             'total_reviewed': results.exclude(human_decision='').count(),
#             'by_decision': {
#                 d: results.filter(human_decision=d).count()
#                 for d in ['shortlisted', 'interview', 'maybe', 'hold', 'rejected']
#             },
#         },
#         'cost': {
#             'total_tokens_used': sessions.aggregate(t=Count('total_tokens_used'))['t'],
#             'total_cost_usd':    str(sessions.aggregate(
#                 c=Count('total_cost_usd'))['c'] or 0),
#         },
#         'top_jobs_by_screenings': list(
#             sessions.values('job__title')
#                     .annotate(count=Count('id'))
#                     .order_by('-count')[:10]
#         ),
#     }
#     return Response(data)






import logging
from django.db.models import Avg
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from utils.base_api import BaseView
from utils.reusable_functions import create_response
from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED
from utils.decorator import permission_required
from utils.permission_enums import *

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


# ─────────────────────────────────────────────────────────
#  Scope helpers  (mirror _scope_filters from jobs/resumes)
# ─────────────────────────────────────────────────────────
def _scope_sessions(user):
    """
    Keyword filters for ScreeningSession scoped to user's company.
    Super admins see all sessions. Recruiters see only their own.
    Note: always combine with an explicit queryset filter at call site.
    """
    if getattr(user, 'role', None) == 1:          # Super Admin
        return {}
    company = getattr(user, 'company', None)
    if not company:
        return {'initiated_by': user}
    filters = {'company': company}
    if not user.has_perm(SHOW_ALL_SCREENINGS):
        filters['initiated_by'] = user
    return filters


def _scope_results(user):
    """
    Keyword filters for ScreeningResult scoped to user's company.
    """
    if getattr(user, 'role', None) == 1:
        return {}
    company = getattr(user, 'company', None)
    if not company:
        return {'session__initiated_by': user}
    filters = {'session__company': company}
    if not user.has_perm(SHOW_ALL_SCREENINGS):
        filters['session__initiated_by'] = user
    return filters


# ─────────────────────────────────────────────────────────
#  Sessions   →   /api/screening/v1/session/
#  GET              → paginated list
#  GET  ?id=<uuid>  → single detail
#  DELETE ?id=<uuid>→ delete session
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class ScreeningSessionView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ScreeningSessionListSerializer
    filterset_class    = ScreeningSessionFilter

    @extend_schema(summary='List screening sessions')
    @permission_required([SHOW_SCREENING])
    def get(self, request):
        session_id = request.query_params.get('id')
        self.extra_filters = _scope_sessions(request.user)

        if session_id:
            try:
                instance = ScreeningSession.objects.filter(
                    **self.extra_filters
                ).select_related('job', 'initiated_by', 'company').prefetch_related('results').get(id=session_id)
                serializer = ScreeningSessionDetailSerializer(instance, context={'request': request})
                return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
            except ScreeningSession.DoesNotExist:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        return super().get_(request)

    @extend_schema(summary='Delete a screening session')
    @permission_required([DELETE_SCREENING])
    def delete(self, request):
        try:
            session_id = request.query_params.get('id')
            if not session_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra    = _scope_sessions(request.user)
            instance = ScreeningSession.objects.filter(id=session_id, **extra).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            if instance.status == ScreeningStatus.PROCESSING:
                return Response(
                    create_response('Cannot delete a session that is currently processing.'),
                    status=status.HTTP_409_CONFLICT,
                )

            instance.delete()
            return Response(
                create_response(SUCCESSFUL, {'id': str(session_id), 'message': 'Session deleted.'}),
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception('ScreeningSessionView.delete error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Start Screening   →   /api/screening/v1/session/start/
#  POST
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class StartScreeningView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = StartScreeningSerializer

    @extend_schema(summary='Start a new AI screening session')
    @permission_required([CREATE_SCREENING])
    def post(self, request):
        try:
            serializer = StartScreeningSerializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

            job     = serializer.job
            resumes = serializer.resumes
            company = getattr(request.user, 'company', None)

            if not company and getattr(request.user, 'role', None) != 1:
                return Response(
                    create_response('Your account has no company assigned.'),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            session = ScreeningSession.objects.create(
                job              = job,
                company          = company,
                initiated_by     = request.user,
                total_resumes    = resumes.count(),
                pass_threshold   = serializer.validated_data['pass_threshold'],
                top_n_candidates = serializer.validated_data['top_n_candidates'],
                status           = ScreeningStatus.PENDING,
            )

            ScreeningResult.objects.bulk_create([
                ScreeningResult(session=session, resume=r, job=job)
                for r in resumes
            ])

            try:
                from apps.core.tasks import run_screening_session_task
                task = run_screening_session_task.delay(str(session.id))
                session.task_id = task.id
                session.save(update_fields=['task_id'])
                task_id = task.id
            except ImportError:
                logger.warning('run_screening_session_task not available')
                task_id = None

            job.screening_count += 1
            job.save(update_fields=['screening_count'])

            logger.info(
                'Screening session %s started by %s for job "%s" with %d resumes.',
                session.id, request.user.email, job.title, resumes.count(),
            )

            return Response(
                create_response(SUCCESSFUL, {
                    'session_id':    str(session.id),
                    'task_id':       task_id,
                    'total_resumes': resumes.count(),
                    'message':       f'Screening started for {resumes.count()} resume(s).',
                }),
                status=status.HTTP_202_ACCEPTED,
            )

        except Exception as e:
            logger.exception('StartScreeningView.post error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Results   →   /api/screening/v1/result/
#  GET              → paginated list
#  GET  ?id=<uuid>  → full detail
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class ScreeningResultView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ScreeningResultListSerializer
    filterset_class    = ScreeningResultFilter

    @extend_schema(summary='List or retrieve screening results')
    @permission_required([READ_SCREENING])
    def get(self, request):
        result_id = request.query_params.get('id')
        self.extra_filters = _scope_results(request.user)

        if result_id:
            try:
                instance = ScreeningResult.objects.filter(
                    **self.extra_filters
                ).select_related('resume', 'job', 'session', 'reviewed_by').prefetch_related('agent_logs').get(id=result_id)
                serializer = ScreeningResultDetailSerializer(instance, context={'request': request})
                return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
            except ScreeningResult.DoesNotExist:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        return super().get_(request)


# ─────────────────────────────────────────────────────────
#  Human Decision   →   /api/screening/v1/result/decision/
#  PATCH ?id=<uuid>
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class HumanDecisionView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = HumanDecisionSerializer

    @extend_schema(summary='Submit HR decision on a candidate result')
    @permission_required([DECIDE_SCREENING])
    def patch(self, request):
        try:
            result_id = request.query_params.get('id')
            if not result_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra  = _scope_results(request.user)
            result = ScreeningResult.objects.filter(id=result_id, **extra).first()
            if not result:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            serializer = HumanDecisionSerializer(result, data=request.data, partial=True, context={'request': request})
            if not serializer.is_valid():
                return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

            serializer.save()
            return Response(
                create_response(SUCCESSFUL, ScreeningResultListSerializer(result).data),
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception('HumanDecisionView.patch error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Agent Logs   →   /api/screening/v1/result/agent-logs/
#  GET ?id=<result_uuid>
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class AgentLogsView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = AgentLogSerializer

    @extend_schema(summary='Get agent execution logs for a screening result')
    @permission_required([READ_SCREENING])
    def get(self, request):
        try:
            result_id = request.query_params.get('id')
            if not result_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra  = _scope_results(request.user)
            result = ScreeningResult.objects.filter(id=result_id, **extra).first()
            if not result:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            logs = AgentExecutionLog.objects.filter(screening_result=result).order_by('created_at')
            data = AgentLogSerializer(logs, many=True).data
            return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('AgentLogsView.get error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Compare Candidates   →   /api/screening/v1/compare/
#  POST  body: {"result_ids": [...]}
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class CompareCandidatesView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = CompareCandidatesSerializer

    @extend_schema(summary='Side-by-side comparison of 2–5 candidates')
    @permission_required([COMPARE_SCREENING])
    def post(self, request):
        try:
            serializer = CompareCandidatesSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

            ids     = serializer.validated_data['result_ids']
            extra   = _scope_results(request.user)
            results = ScreeningResult.objects.filter(
                id__in=ids,
                status=ScreeningStatus.COMPLETED,
                **extra,
            ).select_related('resume', 'job')

            if results.count() < 2:
                return Response(
                    create_response('Need at least 2 completed results to compare.'),
                    status=status.HTTP_400_BAD_REQUEST,
                )

            candidates = sorted(
                [
                    {
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
                    }
                    for r in results
                ],
                key=lambda x: x['overall_score'],
                reverse=True,
            )

            job = results.first().job
            return Response(
                create_response(SUCCESSFUL, {
                    'job':        {'id': str(job.id), 'title': job.title},
                    'winner':     candidates[0]['candidate_name'],
                    'candidates': candidates,
                }),
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception('CompareCandidatesView.post error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Analytics   →   /api/screening/v1/analytics/
#  GET
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class ScreeningAnalyticsView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ScreeningSessionListSerializer

    @extend_schema(summary='Screening analytics dashboard for the company')
    @permission_required([ANALYTICS_SCREENING])
    def get(self, request):
        try:
            from django.db.models import Count, Sum
            session_filters = _scope_sessions(request.user)
            result_filters  = _scope_results(request.user)

            sessions          = ScreeningSession.objects.filter(**session_filters)
            results           = ScreeningResult.objects.filter(**result_filters)
            completed_results = results.filter(status=ScreeningStatus.COMPLETED)

            data = {
                'sessions': {
                    'total':       sessions.count(),
                    'completed':   sessions.filter(status=ScreeningStatus.COMPLETED).count(),
                    'in_progress': sessions.filter(status=ScreeningStatus.PROCESSING).count(),
                    'pending':     sessions.filter(status=ScreeningStatus.PENDING).count(),
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
                    'total_tokens_used': sessions.aggregate(t=Sum('total_tokens_used'))['t'] or 0,
                    'total_cost_usd':    str(sessions.aggregate(c=Sum('total_cost_usd'))['c'] or 0),
                },
                'top_jobs_by_screenings': list(
                    sessions.values('job__title')
                            .annotate(count=Count('id'))
                            .order_by('-count')[:10]
                ),
            }
            return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('ScreeningAnalyticsView.get error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─────────────────────────────────────────────────────────
#  Stats   →   /api/screening/v1/stats/
#  GET  (lighter summary — mirrors JobStatsView / ResumeStatsView)
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class ScreeningStatsView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ScreeningSessionListSerializer

    @extend_schema(summary='Screening statistics for the company')
    @permission_required([STATS_SCREENING])
    def get(self, request):
        try:
            session_filters = _scope_sessions(request.user)
            sessions        = ScreeningSession.objects.filter(**session_filters)
            results         = ScreeningResult.objects.filter(**_scope_results(request.user))

            data = {
                'total_sessions':   sessions.count(),
                'total_results':    results.count(),
                'by_session_status': {s: sessions.filter(status=s).count() for s in ScreeningStatus.values},
                'by_result_status':  {s: results.filter(status=s).count()  for s in ScreeningStatus.values},
            }
            return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('ScreeningStatsView.get error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)