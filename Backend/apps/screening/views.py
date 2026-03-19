# import logging
# from django.db.models import Avg
# from django.utils import timezone
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from drf_spectacular.utils import extend_schema

# from utils.base_api import BaseView
# from utils.reusable_functions import create_response
# from utils.response_messages import SUCCESSFUL, NOT_FOUND, ID_NOT_PROVIDED
# from utils.decorator import permission_required
# from utils.permission_enums import *

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


# # ─────────────────────────────────────────────────────────
# #  Scope helpers
# # ─────────────────────────────────────────────────────────
# def _scope_sessions(user):
#     if getattr(user, 'role', None) == 1:
#         return {}
#     company = getattr(user, 'company', None)
#     if not company:
#         return {'initiated_by': user}
#     filters = {'company': company}
#     if not user.has_perm(SHOW_ALL_SCREENINGS):
#         filters['initiated_by'] = user
#     return filters


# def _scope_results(user):
#     if getattr(user, 'role', None) == 1:
#         return {}
#     company = getattr(user, 'company', None)
#     if not company:
#         return {'session__initiated_by': user}
#     filters = {'session__company': company}
#     if not user.has_perm(SHOW_ALL_SCREENINGS):
#         filters['session__initiated_by'] = user
#     return filters


# # ─────────────────────────────────────────────────────────
# #  Sessions   →   /api/screening/v1/session/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class ScreeningSessionView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = ScreeningSessionListSerializer
#     filterset_class    = ScreeningSessionFilter
#     # ↓ Explicit queryset prevents BaseView from injecting deleted=False
#     queryset = ScreeningSession.objects.select_related(
#         'job', 'initiated_by', 'company'
#     ).prefetch_related('results')

#     @extend_schema(summary='List screening sessions')
#     @permission_required([SHOW_SCREENING])
#     def get(self, request):
#         session_id = request.query_params.get('id')
#         self.extra_filters = _scope_sessions(request.user)

#         if session_id:
#             try:
#                 instance = self.queryset.filter(
#                     **self.extra_filters
#                 ).get(id=session_id)
#                 serializer = ScreeningSessionDetailSerializer(instance, context={'request': request})
#                 return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
#             except ScreeningSession.DoesNotExist:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         return super().get_(request)

#     @extend_schema(summary='Delete a screening session')
#     @permission_required([DELETE_SCREENING])
#     def delete(self, request):
#         try:
#             session_id = request.query_params.get('id')
#             if not session_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             extra    = _scope_sessions(request.user)
#             instance = ScreeningSession.objects.filter(id=session_id, **extra).first()
#             if not instance:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             if instance.status == ScreeningStatus.PROCESSING:
#                 return Response(
#                     create_response('Cannot delete a session that is currently processing.'),
#                     status=status.HTTP_409_CONFLICT,
#                 )

#             instance.delete()
#             return Response(
#                 create_response(SUCCESSFUL, {'id': str(session_id), 'message': 'Session deleted.'}),
#                 status=status.HTTP_200_OK,
#             )

#         except Exception as e:
#             logger.exception('ScreeningSessionView.delete error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Start Screening   →   /api/screening/v1/session/start/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class StartScreeningView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = StartScreeningSerializer

#     @extend_schema(summary='Start a new AI screening session')
#     @permission_required([CREATE_SCREENING])
#     def post(self, request):
#         try:
#             serializer = StartScreeningSerializer(data=request.data, context={'request': request})
#             if not serializer.is_valid():
#                 return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#             job     = serializer.job
#             resumes = serializer.resumes
#             company = getattr(request.user, 'company', None)

#             if not company and getattr(request.user, 'role', None) != 1:
#                 return Response(
#                     create_response('Your account has no company assigned.'),
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             session = ScreeningSession.objects.create(
#                 job              = job,
#                 company          = company,
#                 initiated_by     = request.user,
#                 total_resumes    = resumes.count(),
#                 pass_threshold   = serializer.validated_data['pass_threshold'],
#                 top_n_candidates = serializer.validated_data['top_n_candidates'],
#                 status           = ScreeningStatus.PENDING,
#             )

#             ScreeningResult.objects.bulk_create([
#                 ScreeningResult(session=session, resume=r, job=job)
#                 for r in resumes
#             ])

#             task_id = None
#             try:
#                 from apps.core.tasks import run_screening_session_task
#                 task = run_screening_session_task.delay(str(session.id))
#                 session.task_id = task.id
#                 session.save(update_fields=['task_id'])
#                 task_id = task.id
#             except ImportError:
#                 logger.warning('run_screening_session_task not available')

#             job.screening_count += 1
#             job.save(update_fields=['screening_count'])

#             logger.info(
#                 'Screening session %s started by %s for job "%s" with %d resumes.',
#                 session.id, request.user.email, job.title, resumes.count(),
#             )

#             return Response(
#                 create_response(SUCCESSFUL, {
#                     'session_id':    str(session.id),
#                     'task_id':       task_id,
#                     'total_resumes': resumes.count(),
#                     'message':       f'Screening started for {resumes.count()} resume(s).',
#                 }),
#                 status=status.HTTP_202_ACCEPTED,
#             )

#         except Exception as e:
#             logger.exception('StartScreeningView.post error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Results   →   /api/screening/v1/result/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class ScreeningResultView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = ScreeningResultListSerializer
#     filterset_class    = ScreeningResultFilter
#     # ↓ Explicit queryset prevents BaseView from injecting deleted=False
#     queryset = ScreeningResult.objects.select_related(
#         'resume', 'job', 'session', 'reviewed_by'
#     ).prefetch_related('agent_logs')

#     @extend_schema(summary='List or retrieve screening results')
#     @permission_required([READ_SCREENING])
#     def get(self, request):
#         result_id = request.query_params.get('id')
#         self.extra_filters = _scope_results(request.user)

#         if result_id:
#             try:
#                 instance = self.queryset.filter(
#                     **self.extra_filters
#                 ).get(id=result_id)
#                 serializer = ScreeningResultDetailSerializer(instance, context={'request': request})
#                 return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
#             except ScreeningResult.DoesNotExist:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#         return super().get_(request)


# # ─────────────────────────────────────────────────────────
# #  Human Decision   →   /api/screening/v1/result/decision/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class HumanDecisionView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = HumanDecisionSerializer

#     @extend_schema(summary='Submit HR decision on a candidate result')
#     @permission_required([DECIDE_SCREENING])
#     def patch(self, request):
#         try:
#             result_id = request.query_params.get('id')
#             if not result_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             extra  = _scope_results(request.user)
#             result = ScreeningResult.objects.filter(id=result_id, **extra).first()
#             if not result:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             serializer = HumanDecisionSerializer(result, data=request.data, partial=True, context={'request': request})
#             if not serializer.is_valid():
#                 return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#             serializer.save()
#             # Re-fetch to get fresh data after save
#             result.refresh_from_db()
#             return Response(
#                 create_response(SUCCESSFUL, ScreeningResultListSerializer(result).data),
#                 status=status.HTTP_200_OK,
#             )

#         except Exception as e:
#             logger.exception('HumanDecisionView.patch error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Agent Logs   →   /api/screening/v1/result/agent-logs/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class AgentLogsView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = AgentLogSerializer

#     @extend_schema(summary='Get agent execution logs for a screening result')
#     @permission_required([READ_SCREENING])
#     def get(self, request):
#         try:
#             result_id = request.query_params.get('id')
#             if not result_id:
#                 return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

#             extra  = _scope_results(request.user)
#             result = ScreeningResult.objects.filter(id=result_id, **extra).first()
#             if not result:
#                 return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

#             logs = AgentExecutionLog.objects.filter(
#                 screening_result=result
#             ).order_by('created_at')
#             data = AgentLogSerializer(logs, many=True).data
#             return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception('AgentLogsView.get error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Compare Candidates   →   /api/screening/v1/compare/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class CompareCandidatesView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = CompareCandidatesSerializer

#     @extend_schema(summary='Side-by-side comparison of 2–5 candidates')
#     @permission_required([COMPARE_SCREENING])
#     def post(self, request):
#         try:
#             serializer = CompareCandidatesSerializer(data=request.data)
#             if not serializer.is_valid():
#                 return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

#             ids     = serializer.validated_data['result_ids']
#             extra   = _scope_results(request.user)
#             results = ScreeningResult.objects.filter(
#                 id__in=ids,
#                 status=ScreeningStatus.COMPLETED,
#                 **extra,
#             ).select_related('resume', 'job')

#             if results.count() < 2:
#                 return Response(
#                     create_response('Need at least 2 completed results to compare.'),
#                     status=status.HTTP_400_BAD_REQUEST,
#                 )

#             candidates = sorted(
#                 [
#                     {
#                         'result_id':           str(r.id),
#                         'candidate_name':      r.resume.candidate_name,
#                         'candidate_email':     r.resume.candidate_email,
#                         'overall_score':       r.overall_score,
#                         'score_breakdown':     r.score_breakdown,
#                         'years_of_experience': r.years_of_experience,
#                         'education_level':     r.education_level,
#                         'matched_skills':      r.matched_skills[:10],
#                         'missing_skills':      r.missing_skills[:10],
#                         'strengths':           r.strengths[:3],
#                         'weaknesses':          r.weaknesses[:3],
#                         'ai_decision':         r.ai_decision,
#                         'human_decision':      r.human_decision,
#                         'recommendation':      r.recommendation,
#                         'rank':                r.rank,
#                     }
#                     for r in results
#                 ],
#                 key=lambda x: x['overall_score'],
#                 reverse=True,
#             )

#             job = results.first().job
#             return Response(
#                 create_response(SUCCESSFUL, {
#                     'job':        {'id': str(job.id), 'title': job.title},
#                     'winner':     candidates[0]['candidate_name'],
#                     'candidates': candidates,
#                 }),
#                 status=status.HTTP_200_OK,
#             )

#         except Exception as e:
#             logger.exception('CompareCandidatesView.post error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Analytics   →   /api/screening/v1/analytics/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class ScreeningAnalyticsView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = ScreeningSessionListSerializer

#     @extend_schema(summary='Screening analytics dashboard for the company')
#     @permission_required([ANALYTICS_SCREENING])
#     def get(self, request):
#         try:
#             from django.db.models import Count, Sum

#             session_filters   = _scope_sessions(request.user)
#             result_filters    = _scope_results(request.user)
#             sessions          = ScreeningSession.objects.filter(**session_filters)
#             results           = ScreeningResult.objects.filter(**result_filters)
#             completed_results = results.filter(status=ScreeningStatus.COMPLETED)

#             data = {
#                 'sessions': {
#                     'total':       sessions.count(),
#                     'completed':   sessions.filter(status=ScreeningStatus.COMPLETED).count(),
#                     'in_progress': sessions.filter(status=ScreeningStatus.PROCESSING).count(),
#                     'pending':     sessions.filter(status=ScreeningStatus.PENDING).count(),
#                     'failed':      sessions.filter(status=ScreeningStatus.FAILED).count(),
#                 },
#                 'candidates': {
#                     'total_screened':  results.count(),
#                     'avg_score':       round(completed_results.aggregate(a=Avg('overall_score'))['a'] or 0, 2),
#                     'avg_skill_score': round(completed_results.aggregate(a=Avg('skill_score'))['a'] or 0, 2),
#                     'avg_exp_score':   round(completed_results.aggregate(a=Avg('experience_score'))['a'] or 0, 2),
#                     'by_ai_decision': {
#                         d: completed_results.filter(ai_decision=d).count()
#                         for d in ['shortlisted', 'interview', 'maybe', 'hold', 'rejected']
#                     },
#                 },
#                 'human_decisions': {
#                     'total_reviewed': results.exclude(human_decision='').count(),
#                     'by_decision': {
#                         d: results.filter(human_decision=d).count()
#                         for d in ['shortlisted', 'interview', 'maybe', 'hold', 'rejected']
#                     },
#                 },
#                 'cost': {
#                     'total_tokens_used': sessions.aggregate(t=Sum('total_tokens_used'))['t'] or 0,
#                     'total_cost_usd':    str(sessions.aggregate(c=Sum('total_cost_usd'))['c'] or 0),
#                 },
#                 'top_jobs_by_screenings': list(
#                     sessions.values('job__title')
#                             .annotate(count=Count('id'))
#                             .order_by('-count')[:10]
#                 ),
#             }
#             return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception('ScreeningAnalyticsView.get error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# # ─────────────────────────────────────────────────────────
# #  Stats   →   /api/screening/v1/stats/
# # ─────────────────────────────────────────────────────────
# @extend_schema(tags=['screening'])
# class ScreeningStatsView(BaseView):
#     permission_classes = (IsAuthenticated,)
#     serializer_class   = ScreeningSessionListSerializer

#     @extend_schema(summary='Screening statistics for the company')
#     @permission_required([STATS_SCREENING])
#     def get(self, request):
#         try:
#             session_filters = _scope_sessions(request.user)
#             sessions        = ScreeningSession.objects.filter(**session_filters)
#             results         = ScreeningResult.objects.filter(**_scope_results(request.user))

#             data = {
#                 'total_sessions':    sessions.count(),
#                 'total_results':     results.count(),
#                 'by_session_status': {s: sessions.filter(status=s).count() for s in ScreeningStatus.values},
#                 'by_result_status':  {s: results.filter(status=s).count()  for s in ScreeningStatus.values},
#             }
#             return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

#         except Exception as e:
#             logger.exception('ScreeningStatsView.get error: %s', e)
#             return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)







import logging
from django.db.models import Avg, Count, Sum
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

from .models import CandidateDecision, ScreeningSession, ScreeningResult, AgentExecutionLog, ScreeningStatus
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
#  Scope helpers  (mirrors _scope_filters from jobs)
# ─────────────────────────────────────────────────────────
def _scope_sessions(user):
    """Returns queryset keyword filters scoped to the user's company."""
    if getattr(user, 'role', None) == 1:   # Super Admin sees all
        return {}
    company = getattr(user, 'company', None)
    if not company:
        return {'initiated_by': user}
    filters = {'company': company}
    if not user.has_perm(SHOW_ALL_SCREENINGS):
        filters['initiated_by'] = user
    return filters


def _scope_results(user):
    """Returns queryset keyword filters for ScreeningResult scoped to the user's company."""
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
#  GET list / GET detail ?id= / DELETE ?id=
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class ScreeningSessionView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ScreeningSessionListSerializer
    filterset_class    = ScreeningSessionFilter

    @extend_schema(summary='List or retrieve screening sessions')
    @permission_required([SHOW_SCREENING])
    def get(self, request):
        session_id = request.query_params.get('id')
        self.extra_filters = _scope_sessions(request.user)

        if session_id:
            try:
                instance = ScreeningSession.objects.filter(
                    deleted=False, id=session_id, **self.extra_filters
                ).select_related('job', 'initiated_by', 'company').prefetch_related('results').get()
                serializer = ScreeningSessionDetailSerializer(instance, context={'request': request})
                return Response(create_response(SUCCESSFUL, serializer.data), status=status.HTTP_200_OK)
            except ScreeningSession.DoesNotExist:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

        return super().get_(request)

    @extend_schema(summary='Soft-delete a screening session')
    @permission_required([DELETE_SCREENING])
    def delete(self, request):
        try:
            session_id = request.query_params.get('id')
            if not session_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra    = _scope_sessions(request.user)
            instance = ScreeningSession.objects.filter(deleted=False, id=session_id, **extra).first()
            if not instance:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            if instance.status == ScreeningStatus.PROCESSING:
                return Response(
                    create_response('Cannot delete a session that is currently processing.'),
                    status=status.HTTP_409_CONFLICT,
                )

            instance.soft_delete(user=request.user)
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
                created_by       = request.user,
                total_resumes    = resumes.count(),
                pass_threshold   = serializer.validated_data['pass_threshold'],
                top_n_candidates = serializer.validated_data['top_n_candidates'],
                status           = ScreeningStatus.PENDING,
            )

            ScreeningResult.objects.bulk_create([
                ScreeningResult(session=session, resume=r, job=job)
                for r in resumes
            ])

            task_id = None
            try:
                from apps.core.tasks import run_screening_session_task
                task = run_screening_session_task.delay(str(session.id))
                session.task_id = task.id
                session.save(update_fields=['task_id'])
                task_id = task.id
            except ImportError:
                logger.warning('run_screening_session_task not available — running synchronously skipped.')

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
#  GET list / GET detail ?id=
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
                    deleted=False, id=result_id, **self.extra_filters
                ).select_related('resume', 'job', 'session', 'reviewed_by').prefetch_related('agent_logs').get()
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

    @extend_schema(summary='Submit HR decision on a screening result')
    @permission_required([DECIDE_SCREENING])
    def patch(self, request):
        try:
            result_id = request.query_params.get('id')
            if not result_id:
                return Response(create_response(ID_NOT_PROVIDED), status=status.HTTP_400_BAD_REQUEST)

            extra  = _scope_results(request.user)
            result = ScreeningResult.objects.filter(deleted=False, id=result_id, **extra).first()
            if not result:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            serializer = HumanDecisionSerializer(result, data=request.data, partial=True, context={'request': request})
            if not serializer.is_valid():
                return Response(create_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

            serializer.save()
            result.refresh_from_db()
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
            result = ScreeningResult.objects.filter(deleted=False, id=result_id, **extra).first()
            if not result:
                return Response(create_response(NOT_FOUND), status=status.HTTP_404_NOT_FOUND)

            logs = AgentExecutionLog.objects.filter(
                deleted=False, screening_result=result
            ).order_by('created_at')
            return Response(
                create_response(SUCCESSFUL, AgentLogSerializer(logs, many=True).data),
                status=status.HTTP_200_OK,
            )

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
                deleted=False,
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

    @extend_schema(summary='Screening analytics dashboard')
    @permission_required([ANALYTICS_SCREENING])
    def get(self, request):
        try:
            sessions          = ScreeningSession.objects.filter(deleted=False, **_scope_sessions(request.user))
            results           = ScreeningResult.objects.filter(deleted=False, **_scope_results(request.user))
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
                        for d in CandidateDecision.values
                    },
                },
                'human_decisions': {
                    'total_reviewed': results.exclude(human_decision='').count(),
                    'by_decision': {
                        d: results.filter(human_decision=d).count()
                        for d in CandidateDecision.values
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
#  GET  — mirrors JobStatsView
# ─────────────────────────────────────────────────────────
@extend_schema(tags=['screening'])
class ScreeningStatsView(BaseView):
    permission_classes = (IsAuthenticated,)
    serializer_class   = ScreeningSessionListSerializer

    @extend_schema(summary='Screening statistics for the company')
    @permission_required([STATS_SCREENING])
    def get(self, request):
        try:
            sessions = ScreeningSession.objects.filter(deleted=False, **_scope_sessions(request.user))
            results  = ScreeningResult.objects.filter(deleted=False, **_scope_results(request.user))

            data = {
                'total_sessions':    sessions.count(),
                'total_results':     results.count(),
                'by_session_status': {s: sessions.filter(status=s).count() for s in ScreeningStatus.values},
                'by_result_status':  {s: results.filter(status=s).count()  for s in ScreeningStatus.values},
            }
            return Response(create_response(SUCCESSFUL, data), status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception('ScreeningStatsView.get error: %s', e)
            return Response(create_response(str(e)), status=status.HTTP_500_INTERNAL_SERVER_ERROR)