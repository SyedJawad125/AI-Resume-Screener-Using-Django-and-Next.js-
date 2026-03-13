from django.urls import path
from .views import (
    ResumeView,
    ResumeListView,
    ResumeSkillView,
    ResumeBulkUploadView,
    ResumeBulkUploadStatusView,
    ResumeRetryParseView,
    ResumeStatsView,
)

urlpatterns = [
    # ─── Main CRUD (GET list, GET detail ?id=, POST upload, PATCH ?id=, DELETE ?id=)
    path('v1/resume/',                      ResumeView.as_view(),                 name='resume'),

    # ─── Lightweight list for tables / dropdowns
    path('v1/resume/list/',                 ResumeListView.as_view(),             name='resume-list'),

    # ─── Resume Skills  ?resume_id=<uuid>  &id=<skill_uuid>
    path('v1/resume/skills/',               ResumeSkillView.as_view(),            name='resume-skills'),

    # ─── Bulk upload  POST  (multipart, up to 100 files)
    path('v1/resume/bulk/upload/',          ResumeBulkUploadView.as_view(),       name='resume-bulk-upload'),

    # ─── Bulk upload session status  GET  ?session_id=<uuid>
    path('v1/resume/bulk-upload/status/',   ResumeBulkUploadStatusView.as_view(), name='resume-bulk-upload-status'),

    # ─── Re-trigger parsing for failed resumes  POST  body: {"resume_ids": [...]}
    path('v1/resume/retry-parse/',          ResumeRetryParseView.as_view(),       name='resume-retry-parse'),

    # ─── Company resume statistics  GET
    path('v1/resume/stats/',                ResumeStatsView.as_view(),            name='resume-stats'),
]