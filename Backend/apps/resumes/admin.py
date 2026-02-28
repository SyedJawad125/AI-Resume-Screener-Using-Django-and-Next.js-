from django.contrib import admin
from .models import Resume, ResumeSkill, ResumeParseLog, BulkResumeUpload


class ResumeSkillInline(admin.TabularInline):
    model  = ResumeSkill
    extra  = 0
    fields = ['name', 'category', 'proficiency', 'years_used']


class ResumeParseLogInline(admin.TabularInline):
    model     = ResumeParseLog
    extra     = 0
    readonly_fields = ['agent', 'status', 'message', 'processing_time_ms', 'tokens_used', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display    = ['candidate_name', 'candidate_email', 'company', 'total_experience_years',
                       'highest_education', 'status', 'is_indexed', 'created_at']
    list_filter     = ['status', 'is_indexed', 'highest_education', 'file_type', 'is_active']
    search_fields   = ['candidate_name', 'candidate_email', 'candidate_location']
    readonly_fields = ['raw_text', 'parsed_data', 'embedding_id', 'extracted_skills',
                       'certifications', 'languages', 'parsed_at', 'created_at', 'updated_at']
    inlines         = [ResumeSkillInline, ResumeParseLogInline]
    ordering        = ['-created_at']
    fieldsets = (
        ('Candidate',   {'fields': ('candidate_name', 'candidate_email', 'candidate_phone',
                                     'candidate_location', 'candidate_linkedin', 'candidate_github')}),
        ('File',        {'fields': ('file', 'original_filename', 'file_type', 'file_size_kb')}),
        ('Experience',  {'fields': ('total_experience_years', 'highest_education')}),
        ('AI Data',     {'fields': ('extracted_skills', 'certifications', 'languages', 'embedding_id'),
                          'classes': ('collapse',)}),
        ('Status',      {'fields': ('status', 'parse_error', 'is_indexed', 'is_active')}),
        ('Management',  {'fields': ('company', 'uploaded_by', 'tags', 'notes')}),
        ('Timestamps',  {'fields': ('parsed_at', 'created_at', 'updated_at')}),
    )


@admin.register(BulkResumeUpload)
class BulkResumeUploadAdmin(admin.ModelAdmin):
    list_display    = ['uploaded_by', 'company', 'total_files', 'processed_files',
                       'failed_files', 'status', 'created_at']
    list_filter     = ['status', 'company']
    readonly_fields = ['task_id', 'created_at', 'completed_at']