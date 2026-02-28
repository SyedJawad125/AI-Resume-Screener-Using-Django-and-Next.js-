import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ExperienceLevel(models.TextChoices):
    INTERN     = 'intern',     'Intern'
    JUNIOR     = 'junior',     'Junior (0-2 yrs)'
    MID        = 'mid',        'Mid-Level (2-5 yrs)'
    SENIOR     = 'senior',     'Senior (5-8 yrs)'
    LEAD       = 'lead',       'Lead (8+ yrs)'
    EXECUTIVE  = 'executive',  'Executive'


class EmploymentType(models.TextChoices):
    FULL_TIME   = 'full_time',   'Full Time'
    PART_TIME   = 'part_time',   'Part Time'
    CONTRACT    = 'contract',    'Contract'
    FREELANCE   = 'freelance',   'Freelance'
    INTERNSHIP  = 'internship',  'Internship'


class JobStatus(models.TextChoices):
    DRAFT    = 'draft',    'Draft'
    ACTIVE   = 'active',   'Active'
    PAUSED   = 'paused',   'Paused'
    CLOSED   = 'closed',   'Closed'
    ARCHIVED = 'archived', 'Archived'


class SkillImportance(models.TextChoices):
    NICE_TO_HAVE = 'nice_to_have', 'Nice to Have'
    PREFERRED    = 'preferred',    'Preferred'
    REQUIRED     = 'required',     'Required'
    MUST_HAVE    = 'must_have',    'Must Have'


class JobDescription(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title      = models.CharField(max_length=255, db_index=True)
    department = models.CharField(max_length=100, blank=True)
    location   = models.CharField(max_length=200, blank=True)
    is_remote  = models.BooleanField(default=False)

    # --- Full text fields ---
    description      = models.TextField()
    responsibilities = models.TextField(blank=True)
    requirements     = models.TextField(blank=True)
    nice_to_have     = models.TextField(blank=True)
    benefits         = models.TextField(blank=True)

    # --- Classification ---
    experience_level     = models.CharField(max_length=20, choices=ExperienceLevel.choices, default=ExperienceLevel.MID)
    employment_type      = models.CharField(max_length=20, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    min_experience_years = models.FloatField(default=0)
    max_experience_years = models.FloatField(null=True, blank=True)
    education_requirement = models.CharField(max_length=100, blank=True, help_text='e.g. bachelor, master, any')

    # --- Salary ---
    salary_min      = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max      = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_currency = models.CharField(max_length=5, default='USD')

    # --- AI-extracted (auto-populated by JD Analyzer Agent) ---
    extracted_skills   = models.JSONField(default=list, blank=True)
    extracted_keywords = models.JSONField(default=list, blank=True)
    embedding_id       = models.CharField(max_length=255, blank=True)

    # --- Custom scoring weights (must sum to 1.0) ---
    weight_skills     = models.FloatField(default=0.35)
    weight_experience = models.FloatField(default=0.30)
    weight_education  = models.FloatField(default=0.20)
    weight_fit        = models.FloatField(default=0.15)

    # --- Management ---
    status     = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.DRAFT)
    company    = models.ForeignKey('users.Company', on_delete=models.CASCADE, related_name='job_descriptions')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_jobs')
    screening_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_descriptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'company']),
            models.Index(fields=['title']),
        ]

    def __str__(self):
        return f'{self.title} @ {self.company.name}'

    @property
    def score_weights(self):
        return {
            'skills':     self.weight_skills,
            'experience': self.weight_experience,
            'education':  self.weight_education,
            'fit':        self.weight_fit,
        }

    def get_full_text(self):
        """Concatenated text used for embedding."""
        parts = [self.title, self.description, self.responsibilities, self.requirements, self.nice_to_have]
        return '\n\n'.join(p for p in parts if p)


class JobSkill(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job            = models.ForeignKey(JobDescription, on_delete=models.CASCADE, related_name='skills')
    name           = models.CharField(max_length=100, db_index=True)
    category       = models.CharField(max_length=50, blank=True)   # technical / soft / domain
    importance     = models.CharField(max_length=20, choices=SkillImportance.choices, default=SkillImportance.REQUIRED)
    years_required = models.FloatField(default=0)

    class Meta:
        db_table = 'job_skills'
        unique_together = [['job', 'name']]

    def __str__(self):
        return f'{self.name} [{self.importance}] → {self.job.title}'


class JobAnalysis(models.Model):
    """AI-generated deep analysis of a job description."""
    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job                     = models.OneToOneField(JobDescription, on_delete=models.CASCADE, related_name='analysis')
    summary                 = models.TextField(blank=True)
    key_requirements        = models.TextField(blank=True)
    ideal_candidate_profile = models.TextField(blank=True)
    technical_stack         = models.JSONField(default=list)
    soft_skills             = models.JSONField(default=list)
    domain_knowledge        = models.JSONField(default=list)
    red_flags               = models.JSONField(default=list)
    seniority_level         = models.CharField(max_length=30, blank=True)
    model_used              = models.CharField(max_length=100, blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_analyses'

    def __str__(self):
        return f'Analysis → {self.job.title}'