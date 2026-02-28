from django.urls import path
from .views import (
    start_screening_view,
    ScreeningSessionListView,
    ScreeningSessionDetailView,
    ScreeningResultListView,
    ScreeningResultDetailView,
    human_decision_view,
    compare_candidates_view,
    agent_logs_view,
    analytics_view,
)

urlpatterns = [
    # ── Sessions ───────────────────────────────────────
    path('sessions/',               ScreeningSessionListView.as_view(),   name='session-list'),
    path('sessions/start/',         start_screening_view,                 name='session-start'),
    path('sessions/<uuid:id>/',     ScreeningSessionDetailView.as_view(), name='session-detail'),

    # ── Results ────────────────────────────────────────
    path('results/',                              ScreeningResultListView.as_view(),   name='result-list'),
    path('results/<uuid:id>/',                    ScreeningResultDetailView.as_view(), name='result-detail'),
    path('results/<uuid:id>/decision/',           human_decision_view,                name='result-decision'),
    path('results/<uuid:result_id>/agent-logs/',  agent_logs_view,                    name='result-agent-logs'),

    # ── Actions ────────────────────────────────────────
    path('compare/',    compare_candidates_view, name='candidates-compare'),
    path('analytics/',  analytics_view,          name='screening-analytics'),
]