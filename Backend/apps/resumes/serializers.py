from django.conf import settings
from rest_framework import serializers
from .models import Resume, ResumeSkill, BulkResumeUpload, ResumeStatus


# ─────────────────────────────────────────────
#  Skill
# ─────────────────────────────────────────────
class ResumeSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ResumeSkill
        fields = ['id', 'name', 'category', 'proficiency', 'years_used']
        read_only_fields = ['id']


# ─────────────────────────────────────────────
#  Upload (single)
# ─────────────────────────────────────────────
class ResumeUploadSerializer(serializers.Serializer):
    file  = serializers.FileField()
    tags  = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_file(self, value):
        max_bytes = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
        if value.size > max_bytes:
            raise serializers.ValidationError(
                f'File too large ({value.size // 1024} KB). Maximum: {max_bytes // 1024 // 1024} MB.'
            )
        ext = value.name.rsplit('.', 1)[-1].lower()
        if ext not in ['pdf', 'docx', 'doc']:
            raise serializers.ValidationError(f'Unsupported type ".{ext}". Allowed: pdf, docx, doc.')
        return value

    def create(self, validated_data):
        request = self.context['request']
        f = validated_data['file']
        return Resume.objects.create(
            file              = f,
            original_filename = f.name,
            file_type         = f.name.rsplit('.', 1)[-1].lower(),
            file_size_kb      = f.size // 1024,
            company           = request.user.company,
            uploaded_by       = request.user,
            tags              = validated_data.get('tags', []),
            notes             = validated_data.get('notes', ''),
            status            = ResumeStatus.UPLOADED,
        )


# ─────────────────────────────────────────────
#  Bulk Upload
# ─────────────────────────────────────────────
class BulkUploadSerializer(serializers.Serializer):
    files = serializers.ListField(child=serializers.FileField(), min_length=1, max_length=100)
    tags  = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)

    def validate_files(self, value):
        max_bytes = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
        for f in value:
            ext = f.name.rsplit('.', 1)[-1].lower()
            if ext not in ['pdf', 'docx', 'doc']:
                raise serializers.ValidationError(f'"{f.name}": unsupported type.')
            if f.size > max_bytes:
                raise serializers.ValidationError(f'"{f.name}": exceeds size limit.')
        return value


class BulkUploadStatusSerializer(serializers.ModelSerializer):
    progress_pct = serializers.ReadOnlyField()

    class Meta:
        model  = BulkResumeUpload
        fields = [
            'id', 'total_files', 'processed_files', 'failed_files',
            'status', 'task_id', 'progress_pct', 'tags', 'created_at', 'completed_at',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────
#  List (lightweight)
# ─────────────────────────────────────────────
class ResumeListSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    skills_count     = serializers.SerializerMethodField()

    class Meta:
        model  = Resume
        fields = [
            'id', 'candidate_name', 'candidate_email', 'candidate_location',
            'original_filename', 'file_type', 'file_size_kb',
            'highest_education', 'total_experience_years',
            'status', 'is_indexed', 'is_active',
            'skills_count', 'uploaded_by_name', 'tags',
            'created_at', 'updated_at',
        ]

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None

    def get_skills_count(self, obj):
        return len(obj.skills_list)


# ─────────────────────────────────────────────
#  Detail (full)
# ─────────────────────────────────────────────
class ResumeDetailSerializer(serializers.ModelSerializer):
    skills           = ResumeSkillSerializer(many=True, read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    skills_list      = serializers.ReadOnlyField()

    class Meta:
        model  = Resume
        fields = [
            'id',
            'candidate_name', 'candidate_email', 'candidate_phone',
            'candidate_location', 'candidate_linkedin', 'candidate_github', 'candidate_website',
            'file', 'original_filename', 'file_type', 'file_size_kb',
            'raw_text', 'parsed_data',
            'highest_education', 'education_details',
            'total_experience_years', 'experience_details',
            'extracted_skills', 'certifications', 'languages', 'skills_list',
            'skills',
            'embedding_id', 'is_indexed',
            'status', 'parse_error',
            'company', 'uploaded_by_name', 'is_active', 'tags', 'notes',
            'created_at', 'updated_at', 'parsed_at',
        ]
        read_only_fields = [
            'id', 'file', 'original_filename', 'file_type', 'file_size_kb',
            'raw_text', 'parsed_data', 'highest_education', 'education_details',
            'total_experience_years', 'experience_details', 'extracted_skills',
            'certifications', 'languages', 'embedding_id', 'is_indexed',
            'status', 'parse_error', 'company',
            'created_at', 'updated_at', 'parsed_at',
        ]


# ─────────────────────────────────────────────
#  Update (metadata only)
# ─────────────────────────────────────────────
class ResumeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Resume
        fields = ['candidate_name', 'candidate_email', 'candidate_phone',
                  'candidate_location', 'tags', 'notes', 'is_active']


# ─────────────────────────────────────────────
#  Retry parse
# ─────────────────────────────────────────────
class ResumeRetryParseSerializer(serializers.Serializer):
    resume_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1, max_length=50)