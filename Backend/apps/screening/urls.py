from django.urls import path
from .views import (
    ScreeningSessionView,
    StartScreeningView,
    ScreeningResultView,
    HumanDecisionView,
    AgentLogsView,
    CompareCandidatesView,
    ScreeningAnalyticsView,
    ScreeningStatsView,
)

urlpatterns = [
    # ── Sessions ────────────────────────────────────────────
    # GET list, GET detail ?id=<uuid>, DELETE ?id=<uuid>
    path('v1/session/',           ScreeningSessionView.as_view(),  name='screening-session'),

    # POST  body: {job_id, resume_ids, pass_threshold, top_n_candidates}
    path('v1/session/start/',     StartScreeningView.as_view(),    name='screening-session-start'),

    # ── Results ─────────────────────────────────────────────
    # GET list, GET detail ?id=<uuid>
    path('v1/result/',            ScreeningResultView.as_view(),   name='screening-result'),

    # PATCH ?id=<uuid>  body: {human_decision, human_notes}
    path('v1/result/decision/',   HumanDecisionView.as_view(),     name='screening-result-decision'),

    # GET ?id=<result_uuid>
    path('v1/result/agent-logs/', AgentLogsView.as_view(),         name='screening-result-agent-logs'),

    # ── Actions ─────────────────────────────────────────────
    # POST  body: {result_ids: [...]}
    path('v1/compare/',           CompareCandidatesView.as_view(), name='screening-compare'),

    # GET  — full analytics dashboard
    path('v1/analytics/',         ScreeningAnalyticsView.as_view(), name='screening-analytics'),

    # GET  — lightweight counts summary
    path('v1/stats/',             ScreeningStatsView.as_view(),    name='screening-stats'),
]