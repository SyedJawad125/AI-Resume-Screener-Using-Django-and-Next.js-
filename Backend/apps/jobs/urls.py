from django.urls import path
from .views import (
    JobDescriptionListCreateView,
    JobDescriptionDetailView,
    analyze_job_view,
    job_stats_view,
)

urlpatterns = [
    path('',                    JobDescriptionListCreateView.as_view(), name='job-list-create'),
    path('stats/',              job_stats_view,                         name='job-stats'),
    path('<uuid:id>/',          JobDescriptionDetailView.as_view(),     name='job-detail'),
    path('<uuid:id>/analyze/',  analyze_job_view,                       name='job-analyze'),
]