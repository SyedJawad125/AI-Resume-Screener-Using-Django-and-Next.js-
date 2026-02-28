from django.contrib import admin
from .models import JobDescription, JobSkill, JobAnalysis


class JobSkillInline(admin.TabularInline):
    model  = JobSkill
    extra  = 1
    fields = ['name', 'category', 'importance', 'years_required']


class JobAnalysisInline(admin.StackedInline):
    model      = JobAnalysis
    can_delete = False
    extra      = 0
    readonly_fields = [
        'summary', 'key_requirements', 'ideal_candidate_profile',
        'technical_stack', 'soft_skills', 'domain_knowledge',
        'red_flags', 'seniority_level', 'model_used',
    ]


@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display    = ['title', 'company', 'status', 'experience_level', 'employment_type',
                       'screening_count', 'created_at']
    list_filter     = ['status', 'experience_level', 'employment_type', 'is_remote']
    search_fields   = ['title', 'description', 'requirements']
    readonly_fields = ['screening_count', 'extracted_skills', 'extracted_keywords', 'embedding_id']
    inlines         = [JobSkillInline, JobAnalysisInline]
    ordering        = ['-created_at']
    fieldsets = (
        ('Basic Info',    {'fields': ('title', 'department', 'location', 'is_remote', 'status', 'company', 'created_by')}),
        ('Content',       {'fields': ('description', 'responsibilities', 'requirements', 'nice_to_have', 'benefits')}),
        ('Classification',{'fields': ('experience_level', 'employment_type', 'min_experience_years',
                                       'max_experience_years', 'education_requirement')}),
        ('Salary',        {'fields': ('salary_min', 'salary_max', 'salary_currency')}),
        ('AI Data',       {'fields': ('extracted_skills', 'extracted_keywords', 'embedding_id'), 'classes': ('collapse',)}),
        ('Score Weights', {'fields': ('weight_skills', 'weight_experience', 'weight_education', 'weight_fit')}),
        ('Stats',         {'fields': ('screening_count',)}),
    )