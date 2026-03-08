# from django.conf import settings
# from rest_framework import serializers
# from .models import Resume, ResumeSkill, BulkResumeUpload, ResumeStatus


# # ─────────────────────────────────────────────────────────
# #  ResumeSkill
# # ─────────────────────────────────────────────────────────
# class ResumeSkillSerializer(serializers.ModelSerializer):
#     class Meta:
#         model  = ResumeSkill
#         fields = ['id', 'name', 'category', 'proficiency', 'years_used']
#         read_only_fields = ['id']


# # ─────────────────────────────────────────────────────────
# #  Bulk Upload
# # ─────────────────────────────────────────────────────────
# class BulkUploadSerializer(serializers.Serializer):
#     files = serializers.ListField(child=serializers.FileField(), min_length=1, max_length=100)
#     tags  = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)

#     def validate_files(self, value):
#         max_bytes = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
#         for f in value:
#             ext = f.name.rsplit('.', 1)[-1].lower()
#             if ext not in ['pdf', 'docx', 'doc']:
#                 raise serializers.ValidationError(f'"{f.name}": unsupported file type.')
#             if f.size > max_bytes:
#                 raise serializers.ValidationError(
#                     f'"{f.name}": exceeds size limit of {max_bytes // 1024 // 1024} MB.'
#                 )
#         return value


# class BulkUploadStatusSerializer(serializers.ModelSerializer):
#     progress_pct = serializers.ReadOnlyField()

#     class Meta:
#         model  = BulkResumeUpload
#         fields = [
#             'id', 'total_files', 'processed_files', 'failed_files',
#             'status', 'task_id', 'progress_pct', 'tags', 'created_at', 'completed_at',
#         ]
#         read_only_fields = fields


# # ─────────────────────────────────────────────────────────
# #  List serializer  (lightweight — cards / tables)
# # ─────────────────────────────────────────────────────────
# class ResumeListSerializer(serializers.ModelSerializer):
#     uploaded_by_name = serializers.SerializerMethodField()
#     created_by_name  = serializers.SerializerMethodField()
#     updated_by_name  = serializers.SerializerMethodField()
#     skills_count     = serializers.SerializerMethodField()

#     class Meta:
#         model  = Resume
#         fields = [
#             'id', 'candidate_name', 'candidate_email', 'candidate_location',
#             'original_filename', 'file_type', 'file_size_kb',
#             'highest_education', 'total_experience_years',
#             'status', 'is_indexed', 'is_active',
#             'skills_count', 'tags',
#             'uploaded_by_name', 'created_by_name', 'updated_by_name',
#             'created_at', 'updated_at',
#         ]

#     def get_skills_count(self, obj):
#         return len(obj.skills_list)

#     def get_uploaded_by_name(self, obj):
#         # created_by is the uploader (set in write serializer)
#         if obj.created_by:
#             name = obj.created_by.get_full_name()
#             return name.strip() if name and name.strip() else obj.created_by.username
#         return None

#     def get_created_by_name(self, obj):
#         return self.get_uploaded_by_name(obj)

#     def get_updated_by_name(self, obj):
#         if obj.updated_by:
#             name = obj.updated_by.get_full_name()
#             return name.strip() if name and name.strip() else obj.updated_by.username
#         return None


# # ─────────────────────────────────────────────────────────
# #  Detail serializer  (full — single resume retrieve)
# # ─────────────────────────────────────────────────────────
# class ResumeDetailSerializer(serializers.ModelSerializer):
#     skills           = serializers.SerializerMethodField()
#     skills_list      = serializers.ReadOnlyField()
#     uploaded_by_name = serializers.SerializerMethodField()
#     created_by_name  = serializers.SerializerMethodField()
#     updated_by_name  = serializers.SerializerMethodField()

#     class Meta:
#         model  = Resume
#         fields = [
#             'id',
#             'candidate_name', 'candidate_email', 'candidate_phone',
#             'candidate_location', 'candidate_linkedin', 'candidate_github', 'candidate_website',
#             'file', 'original_filename', 'file_type', 'file_size_kb',
#             'raw_text', 'parsed_data',
#             'highest_education', 'education_details',
#             'total_experience_years', 'experience_details',
#             'extracted_skills', 'certifications', 'languages', 'skills_list',
#             'skills',
#             'embedding_id', 'is_indexed',
#             'status', 'parse_error',
#             'company', 'is_active', 'tags', 'notes',
#             'uploaded_by_name', 'created_by_name', 'updated_by_name',
#             'created_at', 'updated_at', 'parsed_at',
#         ]
#         read_only_fields = [
#             'id', 'file', 'original_filename', 'file_type', 'file_size_kb',
#             'raw_text', 'parsed_data', 'highest_education', 'education_details',
#             'total_experience_years', 'experience_details', 'extracted_skills',
#             'certifications', 'languages', 'embedding_id', 'is_indexed',
#             'status', 'parse_error', 'company',
#             'created_at', 'updated_at', 'parsed_at',
#         ]

#     def get_skills(self, obj):
#         return ResumeSkillSerializer(
#             obj.skills.filter(deleted=False), many=True
#         ).data

#     def get_uploaded_by_name(self, obj):
#         if obj.created_by:
#             name = obj.created_by.get_full_name()
#             return name.strip() if name and name.strip() else obj.created_by.username
#         return None

#     def get_created_by_name(self, obj):
#         return self.get_uploaded_by_name(obj)

#     def get_updated_by_name(self, obj):
#         if obj.updated_by:
#             name = obj.updated_by.get_full_name()
#             return name.strip() if name and name.strip() else obj.updated_by.username
#         return None

#     def to_representation(self, instance):
#         """Show archived/deleted message on soft-delete response."""
#         if instance.deleted:
#             return {
#                 'id':      str(instance.id),
#                 'name':    instance.candidate_name or instance.original_filename,
#                 'message': f'Resume "{instance.candidate_name or instance.original_filename}" has been removed successfully.',
#             }
#         return super().to_representation(instance)


# # ─────────────────────────────────────────────────────────
# #  Write serializer  (upload / update)
# # ─────────────────────────────────────────────────────────
# class ResumeWriteSerializer(serializers.ModelSerializer):
#     """
#     Used for single resume upload (POST) and metadata updates (PATCH).
#     File validation is handled here; AI-populated fields are read-only.
#     """
#     file             = serializers.FileField(required=True)
#     created_by_name  = serializers.SerializerMethodField(read_only=True)
#     updated_by_name  = serializers.SerializerMethodField(read_only=True)

#     class Meta:
#         model  = Resume
#         fields = [
#             'id',
#             'candidate_name', 'candidate_email', 'candidate_phone',
#             'candidate_location', 'candidate_linkedin', 'candidate_github', 'candidate_website',
#             'file', 'original_filename', 'file_type', 'file_size_kb',
#             'is_active', 'tags', 'notes',
#             'company',                          # writable — required for superuser
#             'created_by_name', 'updated_by_name',
#             'created_at', 'updated_at',
#         ]
#         read_only_fields = [
#             'id', 'original_filename', 'file_type', 'file_size_kb',
#             'created_at', 'updated_at',
#         ]

#     def get_created_by_name(self, obj):
#         if obj.created_by:
#             name = obj.created_by.get_full_name()
#             return name.strip() if name and name.strip() else obj.created_by.username
#         return None

#     def get_updated_by_name(self, obj):
#         if obj.updated_by:
#             name = obj.updated_by.get_full_name()
#             return name.strip() if name and name.strip() else obj.updated_by.username
#         return None

#     def validate_file(self, value):
#         max_bytes = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
#         if value.size > max_bytes:
#             raise serializers.ValidationError(
#                 f'File too large ({value.size // 1024} KB). Maximum: {max_bytes // 1024 // 1024} MB.'
#             )
#         ext = value.name.rsplit('.', 1)[-1].lower()
#         if ext not in ['pdf', 'docx', 'doc']:
#             raise serializers.ValidationError(
#                 f'Unsupported type ".{ext}". Allowed: pdf, docx, doc.'
#             )
#         return value

#     def create(self, validated_data):
#         request = self.context['request']
#         user    = request.user
#         f       = validated_data['file']

#         if 'company' not in validated_data:
#             company = getattr(user, 'company', None)
#             if not company:
#                 raise serializers.ValidationError(
#                     {'company': 'Your account has no company assigned. Pass company in the request or contact admin.'}
#                 )
#             validated_data['company'] = company

#         return Resume.objects.create(
#             **validated_data,
#             original_filename = f.name,
#             file_type         = f.name.rsplit('.', 1)[-1].lower(),
#             file_size_kb      = f.size // 1024,
#             created_by        = user,
#             status            = ResumeStatus.UPLOADED,
#         )

#     def update(self, instance, validated_data):
#         # Only metadata fields are updatable; file re-upload is not allowed on PATCH
#         validated_data.pop('file', None)
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         return instance

#     def to_representation(self, instance):
#         """Show archived/deleted message on soft-delete response."""
#         if instance.deleted:
#             return {
#                 'id':      str(instance.id),
#                 'name':    instance.candidate_name or instance.original_filename,
#                 'message': f'Resume "{instance.candidate_name or instance.original_filename}" has been removed successfully.',
#             }
#         return super().to_representation(instance)


# # ─────────────────────────────────────────────────────────
# #  Retry parse
# # ─────────────────────────────────────────────────────────
# class ResumeRetryParseSerializer(serializers.Serializer):
#     resume_ids = serializers.ListField(
#         child=serializers.UUIDField(), min_length=1, max_length=50
#     )






from django.conf import settings
from rest_framework import serializers
from .models import Resume, ResumeSkill, BulkResumeUpload, ResumeStatus


# ─────────────────────────────────────────────────────────
#  ResumeSkill
# ─────────────────────────────────────────────────────────
class ResumeSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ResumeSkill
        fields = ['id', 'name', 'category', 'proficiency', 'years_used']
        read_only_fields = ['id']


# ─────────────────────────────────────────────────────────
#  Bulk Upload
# ─────────────────────────────────────────────────────────
class BulkUploadSerializer(serializers.Serializer):
    files = serializers.ListField(child=serializers.FileField(), min_length=1, max_length=100)
    tags  = serializers.ListField(child=serializers.CharField(max_length=50), required=False, default=list)

    def validate_files(self, value):
        max_bytes = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
        for f in value:
            ext = f.name.rsplit('.', 1)[-1].lower()
            if ext not in ['pdf', 'docx', 'doc']:
                raise serializers.ValidationError(f'"{f.name}": unsupported file type.')
            if f.size > max_bytes:
                raise serializers.ValidationError(
                    f'"{f.name}": exceeds size limit of {max_bytes // 1024 // 1024} MB.'
                )
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


# ─────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────
def _resolve_user_name(user):
    if not user:
        return None
    name = user.get_full_name()
    return name.strip() if name and name.strip() else user.username


# ─────────────────────────────────────────────────────────
#  List serializer  (lightweight — cards / tables)
# ─────────────────────────────────────────────────────────
class ResumeListSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    created_by_name  = serializers.SerializerMethodField()
    updated_by_name  = serializers.SerializerMethodField()
    skills_count     = serializers.SerializerMethodField()

    class Meta:
        model  = Resume
        fields = [
            'id', 'candidate_name', 'candidate_email', 'candidate_location',
            'original_filename', 'file_type', 'file_size_kb',
            'highest_education', 'total_experience_years',
            'status', 'is_indexed', 'is_active',
            'skills_count', 'tags',
            'uploaded_by_name', 'created_by_name', 'updated_by_name',
            'created_at', 'updated_at',
        ]

    def get_skills_count(self, obj):
        return len(obj.skills_list)

    def get_uploaded_by_name(self, obj):
        return _resolve_user_name(obj.created_by)

    def get_created_by_name(self, obj):
        return _resolve_user_name(obj.created_by)

    def get_updated_by_name(self, obj):
        return _resolve_user_name(obj.updated_by)


# ─────────────────────────────────────────────────────────
#  Detail serializer  (full — single resume retrieve)
# ─────────────────────────────────────────────────────────
class ResumeDetailSerializer(serializers.ModelSerializer):
    skills           = serializers.SerializerMethodField()
    skills_list      = serializers.ReadOnlyField()
    uploaded_by_name = serializers.SerializerMethodField()
    created_by_name  = serializers.SerializerMethodField()
    updated_by_name  = serializers.SerializerMethodField()

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
            'company', 'is_active', 'tags', 'notes',
            'uploaded_by_name', 'created_by_name', 'updated_by_name',
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

    def get_skills(self, obj):
        return ResumeSkillSerializer(obj.skills.filter(deleted=False), many=True).data

    def get_uploaded_by_name(self, obj):
        return _resolve_user_name(obj.created_by)

    def get_created_by_name(self, obj):
        return _resolve_user_name(obj.created_by)

    def get_updated_by_name(self, obj):
        return _resolve_user_name(obj.updated_by)

    def to_representation(self, instance):
        if instance.deleted:
            label = instance.candidate_name or instance.original_filename
            return {
                'id':      str(instance.id),
                'name':    label,
                'message': f'Resume "{label}" has been removed successfully.',
            }
        return super().to_representation(instance)


# ─────────────────────────────────────────────────────────
#  Write serializer  (upload / update)
# ─────────────────────────────────────────────────────────
class ResumeWriteSerializer(serializers.ModelSerializer):
    """
    POST  → single resume upload.
    PATCH → metadata-only update (file field is ignored / not required).
    """
    file            = serializers.FileField(required=False)   # made optional; validated in validate_file
    created_by_name = serializers.SerializerMethodField(read_only=True)
    updated_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = Resume
        fields = [
            'id',
            'candidate_name', 'candidate_email', 'candidate_phone',
            'candidate_location', 'candidate_linkedin', 'candidate_github', 'candidate_website',
            'file', 'original_filename', 'file_type', 'file_size_kb',
            'is_active', 'tags', 'notes',
            'company',
            'created_by_name', 'updated_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'original_filename', 'file_type', 'file_size_kb',
            'created_at', 'updated_at',
        ]

    # ── On POST, file is mandatory ──────────────────────
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance:  # create
            self.fields['file'].required = True

    def get_created_by_name(self, obj):
        return _resolve_user_name(obj.created_by)

    def get_updated_by_name(self, obj):
        return _resolve_user_name(obj.updated_by)

    def validate_file(self, value):
        max_bytes = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)
        if value.size > max_bytes:
            raise serializers.ValidationError(
                f'File too large ({value.size // 1024} KB). Maximum: {max_bytes // 1024 // 1024} MB.'
            )
        ext = value.name.rsplit('.', 1)[-1].lower()
        if ext not in ['pdf', 'docx', 'doc']:
            raise serializers.ValidationError(
                f'Unsupported type ".{ext}". Allowed: pdf, docx, doc.'
            )
        return value

    def create(self, validated_data):
        request = self.context['request']
        user    = request.user
        f       = validated_data['file']

        if 'company' not in validated_data:
            company = getattr(user, 'company', None)
            if not company:
                raise serializers.ValidationError(
                    {'company': 'Your account has no company assigned.'}
                )
            validated_data['company'] = company

        return Resume.objects.create(
            **validated_data,
            original_filename = f.name,
            file_type         = f.name.rsplit('.', 1)[-1].lower(),
            file_size_kb      = f.size // 1024,
            created_by        = user,
            status            = ResumeStatus.UPLOADED,
        )

    def update(self, instance, validated_data):
        validated_data.pop('file', None)   # file re-upload not allowed on PATCH
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        if instance.deleted:
            label = instance.candidate_name or instance.original_filename
            return {
                'id':      str(instance.id),
                'name':    label,
                'message': f'Resume "{label}" has been removed successfully.',
            }
        return super().to_representation(instance)


# ─────────────────────────────────────────────────────────
#  Retry parse
# ─────────────────────────────────────────────────────────
class ResumeRetryParseSerializer(serializers.Serializer):
    resume_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=1, max_length=50
    )