# from django.urls import path
# from .views import (
#     start_screening_view,
#     ScreeningSessionListView,
#     ScreeningSessionDetailView,
#     ScreeningResultListView,
#     ScreeningResultDetailView,
#     human_decision_view,
#     compare_candidates_view,
#     agent_logs_view,
#     analytics_view,
# )

# urlpatterns = [
#     # ── Sessions ───────────────────────────────────────
#     path('sessions/',               ScreeningSessionListView.as_view(),   name='session-list'),
#     path('sessions/start/',         start_screening_view,                 name='session-start'),
#     path('sessions/<uuid:id>/',     ScreeningSessionDetailView.as_view(), name='session-detail'),

#     # ── Results ────────────────────────────────────────
#     path('results/',                              ScreeningResultListView.as_view(),   name='result-list'),
#     path('results/<uuid:id>/',                    ScreeningResultDetailView.as_view(), name='result-detail'),
#     path('results/<uuid:id>/decision/',           human_decision_view,                name='result-decision'),
#     path('results/<uuid:result_id>/agent-logs/',  agent_logs_view,                    name='result-agent-logs'),

#     # ── Actions ────────────────────────────────────────
#     path('compare/',    compare_candidates_view, name='candidates-compare'),
#     path('analytics/',  analytics_view,          name='screening-analytics'),
# ]



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