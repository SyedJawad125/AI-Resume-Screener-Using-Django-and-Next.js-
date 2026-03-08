from django.urls import path
from .views import (
    JobView,
    JobListView,
    JobToggleView,
    JobAnalyzeView,
    JobStatsView,
    JobSkillView,      # ← new
)

urlpatterns = [
    # ─── Main CRUD (GET list, GET detail ?id=, POST, PATCH ?id=, DELETE ?id=)
    path('v1/job/',          JobView.as_view(),       name='job'),

    # ─── Lightweight list for dropdowns/cards
    path('v1/job/list/',     JobListView.as_view(),    name='job-list'),

    # ─── Toggle status  PATCH ?id=<uuid>  body: {"status": "active"}
    path('v1/job/toggle/',   JobToggleView.as_view(),  name='job-toggle'),

    # ─── Trigger AI analysis  POST ?id=<uuid>
    path('v1/job/analyze/',  JobAnalyzeView.as_view(), name='job-analyze'),

    # ─── Company job statistics  GET
    path('v1/job/stats/',    JobStatsView.as_view(),   name='job-stats'),

    # ─── Job Skills  ?job_id=<uuid>  &id=<skill_uuid>
    path('v1/job/skills/',   JobSkillView.as_view(),   name='job-skills'),
]