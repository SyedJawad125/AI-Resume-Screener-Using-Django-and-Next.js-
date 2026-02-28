from django.urls import path
from .views import (
    ResumeListView,
    ResumeUploadView,
    ResumeDetailView,
    bulk_upload_view,
    bulk_upload_status_view,
    retry_parse_view,
    resume_stats_view,
)

urlpatterns = [
    path('',                                            ResumeListView.as_view(),         name='resume-list'),
    path('upload/',                                     ResumeUploadView.as_view(),        name='resume-upload'),
    path('bulk-upload/',                                bulk_upload_view,                  name='resume-bulk-upload'),
    path('bulk-upload/<uuid:session_id>/status/',       bulk_upload_status_view,           name='bulk-upload-status'),
    path('retry-parse/',                                retry_parse_view,                  name='resume-retry-parse'),
    path('stats/',                                      resume_stats_view,                 name='resume-stats'),
    path('<uuid:id>/',                                  ResumeDetailView.as_view(),        name='resume-detail'),
]