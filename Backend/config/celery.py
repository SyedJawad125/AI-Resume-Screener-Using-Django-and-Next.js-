import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")
app.config_from_object("django.conf:settings", namespace="CELERY")

# ← Explicitly list all apps so core/tasks.py is discovered
app.autodiscover_tasks([
    'apps.users',
    'apps.myapp',
    'apps.notification',
    'apps.jobs',
    'apps.resumes',
    'apps.screening',
    'core',           # ← This discovers core/tasks.py
])