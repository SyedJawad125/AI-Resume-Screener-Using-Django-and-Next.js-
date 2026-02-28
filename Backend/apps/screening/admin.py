from django.contrib import admin
from .models import ScreeningSession, ScreeningResult, AgentExecutionLog


class ScreeningResultInline(admin.TabularInline):
    model   = ScreeningResult
    extra   = 0
    fields  = ['resume', 'overall_score', 'skill_score', 'ai_decision', 'human_decision', 'rank', 'status']
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ScreeningSession)
class ScreeningSessionAdmin(admin.ModelAdmin):
    list_display    = ['job', 'company', 'status', 'total_resumes', 'processed_count',
                       'pass_threshold', 'total_cost_usd', 'created_at']
    list_filter     = ['status', 'company']
    search_fields   = ['job__title', 'company__name']
    readonly_fields = ['task_id', 'total_tokens_used', 'total_cost_usd',
                       'started_at', 'completed_at', 'progress_pct']
    inlines         = [ScreeningResultInline]


class AgentLogInline(admin.TabularInline):
    model      = AgentExecutionLog
    extra      = 0
    readonly_fields = ['agent_type', 'status', 'tokens_used', 'processing_time_ms', 'model_used',
                       'error_message', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ScreeningResult)
class ScreeningResultAdmin(admin.ModelAdmin):
    list_display    = ['resume', 'job', 'overall_score', 'skill_score', 'experience_score',
                       'ai_decision', 'human_decision', 'rank', 'status']
    list_filter     = ['status', 'ai_decision', 'human_decision', 'must_have_skills_met', 'education_match']
    search_fields   = ['resume__candidate_name', 'resume__candidate_email', 'job__title']
    readonly_fields = [
        'overall_score', 'skill_score', 'experience_score', 'education_score',
        'fit_score', 'semantic_similarity',
        'matched_skills', 'missing_skills', 'bonus_skills', 'must_have_skills_met',
        'years_of_experience', 'experience_gap_years',
        'strengths', 'weaknesses', 'explanation', 'recommendation',
        'interview_questions', 'red_flags', 'growth_potential',
        'ai_decision', 'model_used', 'tokens_used', 'processing_time_ms', 'error_message',
    ]
    inlines = [AgentLogInline]
    fieldsets = (
        ('Identifiers',  {'fields': ('session', 'resume', 'job', 'rank')}),
        ('Scores',       {'fields': ('overall_score', 'skill_score', 'experience_score',
                                      'education_score', 'fit_score', 'semantic_similarity')}),
        ('Skills',       {'fields': ('matched_skills', 'missing_skills', 'bonus_skills', 'must_have_skills_met')}),
        ('AI Output',    {'fields': ('strengths', 'weaknesses', 'explanation', 'recommendation',
                                      'interview_questions', 'red_flags', 'growth_potential')}),
        ('Decisions',    {'fields': ('ai_decision', 'human_decision', 'human_notes', 'reviewed_by', 'reviewed_at')}),
        ('Meta',         {'fields': ('status', 'model_used', 'tokens_used', 'processing_time_ms', 'error_message')}),
    )


@admin.register(AgentExecutionLog)
class AgentExecutionLogAdmin(admin.ModelAdmin):
    list_display    = ['agent_type', 'status', 'tokens_used', 'processing_time_ms', 'model_used', 'created_at']
    list_filter     = ['agent_type', 'status']
    readonly_fields = [f.name for f in AgentExecutionLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False