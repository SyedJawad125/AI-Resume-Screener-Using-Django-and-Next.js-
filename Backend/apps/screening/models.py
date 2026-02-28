import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ScreeningStatus(models.TextChoices):
    PENDING    = 'pending',    'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED  = 'completed',  'Completed'
    FAILED     = 'failed',     'Failed'


class CandidateDecision(models.TextChoices):
    SHORTLISTED = 'shortlisted', 'Shortlisted'
    INTERVIEW   = 'interview',   'Invite to Interview'
    MAYBE       = 'maybe',       'Maybe'
    HOLD        = 'hold',        'On Hold'
    REJECTED    = 'rejected',    'Rejected'


class ScreeningSession(models.Model):
    """
    One screening session = one JD screened against N resumes.
    Spawns a ScreeningResult for each resume.
    """
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job          = models.ForeignKey('jobs.JobDescription',  on_delete=models.CASCADE,   related_name='screening_sessions')
    company      = models.ForeignKey('users.Company',        on_delete=models.CASCADE,   related_name='screening_sessions')
    initiated_by = models.ForeignKey(User,                   on_delete=models.SET_NULL,  null=True,  related_name='initiated_screenings')

    # Progress
    status           = models.CharField(max_length=20, choices=ScreeningStatus.choices, default=ScreeningStatus.PENDING)
    total_resumes    = models.PositiveIntegerField(default=0)
    processed_count  = models.PositiveIntegerField(default=0)
    failed_count     = models.PositiveIntegerField(default=0)
    task_id          = models.CharField(max_length=255, blank=True)

    # Config
    pass_threshold    = models.FloatField(default=70.0)   # Score above which = pass
    top_n_candidates  = models.PositiveIntegerField(default=10)

    # Cost tracking
    total_tokens_used = models.PositiveIntegerField(default=0)
    total_cost_usd    = models.DecimalField(max_digits=10, decimal_places=6, default=0)

    created_at   = models.DateTimeField(auto_now_add=True)
    started_at   = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'screening_sessions'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['job', 'status']),
            models.Index(fields=['company', 'status']),
        ]

    def __str__(self):
        return f'Session: {self.job.title} [{self.status}] ({self.total_resumes} resumes)'

    @property
    def progress_pct(self):
        if self.total_resumes == 0:
            return 0
        return round(self.processed_count / self.total_resumes * 100, 1)

    @property
    def duration_seconds(self):
        if self.started_at and self.completed_at:
            return round((self.completed_at - self.started_at).total_seconds(), 1)
        return None


class ScreeningResult(models.Model):
    """
    The AI-generated evaluation of one resume against one JD.
    Created as PENDING, updated to COMPLETED once the agent pipeline runs.
    """
    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ScreeningSession,         on_delete=models.CASCADE, related_name='results')
    resume  = models.ForeignKey('resumes.Resume',          on_delete=models.CASCADE, related_name='screening_results')
    job     = models.ForeignKey('jobs.JobDescription',     on_delete=models.CASCADE, related_name='screening_results')

    # ── Scores (0–100) ──────────────────────────────────
    overall_score       = models.FloatField(default=0)
    skill_score         = models.FloatField(default=0)
    experience_score    = models.FloatField(default=0)
    education_score     = models.FloatField(default=0)
    fit_score           = models.FloatField(default=0)       # RAG + rule-based overall fit
    semantic_similarity = models.FloatField(default=0)       # raw cosine sim from ChromaDB

    # ── Skill Breakdown ─────────────────────────────────
    matched_skills       = models.JSONField(default=list, blank=True)
    missing_skills       = models.JSONField(default=list, blank=True)
    bonus_skills         = models.JSONField(default=list, blank=True)
    must_have_skills_met = models.BooleanField(default=False)

    # ── Experience Breakdown ─────────────────────────────
    years_of_experience      = models.FloatField(default=0)
    experience_gap_years     = models.FloatField(default=0)
    relevant_experience_pct  = models.FloatField(default=0)

    # ── Education Breakdown ──────────────────────────────
    education_match = models.BooleanField(default=False)
    education_level = models.CharField(max_length=30, blank=True)

    # ── AI Explanation (LLM output) ─────────────────────
    strengths           = models.JSONField(default=list, blank=True)
    weaknesses          = models.JSONField(default=list, blank=True)
    explanation         = models.TextField(blank=True)
    recommendation      = models.TextField(blank=True)
    interview_questions = models.JSONField(default=list, blank=True)
    red_flags           = models.JSONField(default=list, blank=True)
    growth_potential    = models.TextField(blank=True)

    # ── Decisions ───────────────────────────────────────
    ai_decision    = models.CharField(max_length=20, choices=CandidateDecision.choices, blank=True)
    human_decision = models.CharField(max_length=20, choices=CandidateDecision.choices, blank=True)
    human_notes    = models.TextField(blank=True)
    reviewed_by    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_results')
    reviewed_at    = models.DateTimeField(null=True, blank=True)

    # ── Ranking ─────────────────────────────────────────
    rank = models.PositiveIntegerField(null=True, blank=True)

    # ── Pipeline Meta ───────────────────────────────────
    status             = models.CharField(max_length=20, choices=ScreeningStatus.choices, default=ScreeningStatus.PENDING)
    model_used         = models.CharField(max_length=100, blank=True)
    tokens_used        = models.PositiveIntegerField(default=0)
    processing_time_ms = models.PositiveIntegerField(default=0)
    error_message      = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'screening_results'
        unique_together = [['session', 'resume']]
        ordering        = ['-overall_score']
        indexes         = [
            models.Index(fields=['session', 'overall_score']),
            models.Index(fields=['job', 'overall_score']),
            models.Index(fields=['ai_decision']),
        ]

    def __str__(self):
        return f'{self.resume.candidate_name} → {self.job.title}: {self.overall_score:.1f}'

    @property
    def passed(self):
        return self.overall_score >= self.session.pass_threshold

    @property
    def score_breakdown(self):
        return {
            'skill_score':         round(self.skill_score, 2),
            'experience_score':    round(self.experience_score, 2),
            'education_score':     round(self.education_score, 2),
            'fit_score':           round(self.fit_score, 2),
            'semantic_similarity': round(self.semantic_similarity, 4),
            'overall_score':       round(self.overall_score, 2),
        }


class AgentExecutionLog(models.Model):
    """Detailed log of each agent step — useful for debugging and transparency."""
    AGENT_CHOICES = [
        ('resume_parser',     'Resume Parser Agent'),
        ('jd_analyzer',       'JD Analyzer Agent'),
        ('skill_matcher',     'Skill Matcher Agent'),
        ('experience_scorer', 'Experience Scorer Agent'),
        ('education_scorer',  'Education Scorer Agent'),
        ('rag_retriever',     'RAG Retriever Agent'),
        ('explanation',       'Explanation Agent'),
        ('orchestrator',      'Orchestrator'),
    ]
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    screening_result = models.ForeignKey(ScreeningResult,  on_delete=models.CASCADE, null=True, blank=True, related_name='agent_logs')
    session          = models.ForeignKey(ScreeningSession, on_delete=models.CASCADE, null=True, blank=True, related_name='agent_logs')
    agent_type       = models.CharField(max_length=30, choices=AGENT_CHOICES)
    agent_version    = models.CharField(max_length=10, default='1.0')
    input_summary    = models.JSONField(default=dict, blank=True)
    output_summary   = models.JSONField(default=dict, blank=True)
    status           = models.CharField(max_length=20)           # success | error | warning
    error_message    = models.TextField(blank=True)
    tokens_used      = models.PositiveIntegerField(default=0)
    processing_time_ms = models.PositiveIntegerField(default=0)
    model_used       = models.CharField(max_length=100, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'agent_execution_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.agent_type}] {self.status} @ {self.created_at:%Y-%m-%d %H:%M}'