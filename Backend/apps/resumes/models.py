import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ResumeStatus(models.TextChoices):
    UPLOADED = 'uploaded', 'Uploaded'
    PARSING  = 'parsing',  'Parsing'
    PARSED   = 'parsed',   'Parsed'
    INDEXED  = 'indexed',  'Indexed in Vector Store'
    FAILED   = 'failed',   'Parsing Failed'


class EducationLevel(models.TextChoices):
    HIGH_SCHOOL = 'high_school', 'High School'
    ASSOCIATE   = 'associate',   'Associate Degree'
    BACHELOR    = 'bachelor',    "Bachelor's Degree"
    MASTER      = 'master',      "Master's Degree"
    MBA         = 'mba',         'MBA'
    PHD         = 'phd',         'PhD / Doctorate'
    OTHER       = 'other',       'Other'


def resume_upload_path(instance, filename):
    return f'resumes/{instance.company_id}/{uuid.uuid4()}/{filename}'


class Resume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Candidate Info ──────────────────────────────────
    candidate_name     = models.CharField(max_length=255, blank=True, db_index=True)
    candidate_email    = models.EmailField(blank=True, db_index=True)
    candidate_phone    = models.CharField(max_length=30, blank=True)
    candidate_location = models.CharField(max_length=255, blank=True)
    candidate_linkedin = models.URLField(blank=True)
    candidate_github   = models.URLField(blank=True)
    candidate_website  = models.URLField(blank=True)

    # ── File ────────────────────────────────────────────
    file              = models.FileField(upload_to=resume_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type         = models.CharField(max_length=10)      # pdf | docx | doc
    file_size_kb      = models.PositiveIntegerField(default=0)

    # ── Parsed Content ──────────────────────────────────
    raw_text        = models.TextField(blank=True)
    parsed_data     = models.JSONField(default=dict, blank=True)   # full LLM output

    # ── Education ───────────────────────────────────────
    highest_education  = models.CharField(max_length=20, choices=EducationLevel.choices, blank=True)
    education_details  = models.JSONField(default=list, blank=True)

    # ── Experience ──────────────────────────────────────
    total_experience_years = models.FloatField(default=0)
    experience_details     = models.JSONField(default=list, blank=True)

    # ── Skills / Certs (AI-extracted) ───────────────────
    extracted_skills  = models.JSONField(default=list, blank=True)
    certifications    = models.JSONField(default=list, blank=True)
    languages         = models.JSONField(default=list, blank=True)

    # ── Vector Store ────────────────────────────────────
    embedding_id = models.CharField(max_length=255, blank=True, db_index=True)
    is_indexed   = models.BooleanField(default=False)

    # ── Status ──────────────────────────────────────────
    status      = models.CharField(max_length=20, choices=ResumeStatus.choices, default=ResumeStatus.UPLOADED)
    parse_error = models.TextField(blank=True)

    # ── Management ──────────────────────────────────────
    company     = models.ForeignKey('users.Company', on_delete=models.CASCADE, related_name='resumes')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_resumes')
    is_active   = models.BooleanField(default=True)
    tags        = models.JSONField(default=list, blank=True)
    notes       = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parsed_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'resumes'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['candidate_email']),
            models.Index(fields=['is_active', 'company']),
        ]

    def __str__(self):
        return f'{self.candidate_name or self.original_filename} ({self.status})'

    @property
    def skills_list(self):
        """Flat list of skill names."""
        result = []
        for s in self.extracted_skills:
            if isinstance(s, dict):
                result.append(s.get('name', ''))
            elif isinstance(s, str):
                result.append(s)
        return [s for s in result if s]

    def get_text_for_embedding(self):
        """Compact text blob sent to the embedding model."""
        parts = [
            f'Name: {self.candidate_name}',
            f'Email: {self.candidate_email}',
            f'Location: {self.candidate_location}',
            f'Total Experience: {self.total_experience_years} years',
            f'Highest Education: {self.highest_education}',
            f'Skills: {", ".join(self.skills_list[:50])}',
            self.raw_text[:4000],
        ]
        return '\n'.join(p for p in parts if p)


class ResumeSkill(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume      = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='skills')
    name        = models.CharField(max_length=100, db_index=True)
    category    = models.CharField(max_length=50, blank=True)     # technical / soft / domain
    proficiency = models.CharField(max_length=50, blank=True)     # beginner / intermediate / expert
    years_used  = models.FloatField(default=0)

    class Meta:
        db_table        = 'resume_skills'
        unique_together = [['resume', 'name']]

    def __str__(self):
        return f'{self.name} ({self.resume.candidate_name})'


class ResumeParseLog(models.Model):
    """Audit trail for each parsing attempt."""
    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume             = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='parse_logs')
    agent              = models.CharField(max_length=100)
    status             = models.CharField(max_length=20)   # success | error | warning
    message            = models.TextField(blank=True)
    processing_time_ms = models.IntegerField(default=0)
    tokens_used        = models.IntegerField(default=0)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'resume_parse_logs'
        ordering = ['-created_at']


class BulkResumeUpload(models.Model):
    """Tracks a bulk-upload session."""
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company         = models.ForeignKey('users.Company', on_delete=models.CASCADE, related_name='bulk_uploads')
    uploaded_by     = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    total_files     = models.PositiveIntegerField(default=0)
    processed_files = models.PositiveIntegerField(default=0)
    failed_files    = models.PositiveIntegerField(default=0)
    status          = models.CharField(max_length=20, default='pending')  # pending | processing | completed | failed
    task_id         = models.CharField(max_length=255, blank=True)
    tags            = models.JSONField(default=list, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    completed_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bulk_resume_uploads'
        ordering = ['-created_at']

    @property
    def progress_pct(self):
        if self.total_files == 0:
            return 0
        return round(self.processed_files / self.total_files * 100, 1)