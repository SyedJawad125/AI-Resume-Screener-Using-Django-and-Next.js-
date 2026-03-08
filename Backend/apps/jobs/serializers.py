# from rest_framework import serializers
# from .models import JobDescription, JobSkill, JobAnalysis


# # ─────────────────────────────────────────────────────────
# #  JobSkill
# # ─────────────────────────────────────────────────────────
# class JobSkillSerializer(serializers.ModelSerializer):
#     class Meta:
#         model  = JobSkill
#         fields = ['id', 'name', 'category', 'importance', 'years_required']
#         read_only_fields = ['id']


# # ─────────────────────────────────────────────────────────
# #  JobAnalysis  (read-only — AI-generated)
# # ─────────────────────────────────────────────────────────
# class JobAnalysisSerializer(serializers.ModelSerializer):
#     class Meta:
#         model  = JobAnalysis
#         fields = [
#             'id', 'summary', 'key_requirements', 'ideal_candidate_profile',
#             'technical_stack', 'soft_skills', 'domain_knowledge', 'red_flags',
#             'seniority_level', 'model_used', 'created_at', 'updated_at',
#         ]
#         read_only_fields = fields


# # ─────────────────────────────────────────────────────────
# #  List serializer  (lightweight — dropdowns / cards)
# # ─────────────────────────────────────────────────────────
# class JobDescriptionListSerializer(serializers.ModelSerializer):
#     company_name    = serializers.CharField(source='company.name', read_only=True)
#     skills_count    = serializers.SerializerMethodField()
#     created_by_name = serializers.SerializerMethodField()
#     updated_by_name = serializers.SerializerMethodField()

#     class Meta:
#         model  = JobDescription
#         fields = [
#             'id', 'title', 'department', 'location', 'is_remote',
#             'experience_level', 'employment_type', 'status',
#             'company_name', 'skills_count', 'screening_count',
#             'created_by_name', 'updated_by_name',
#             'created_at', 'updated_at',
#         ]

#     def get_skills_count(self, obj):
#         return obj.skills.filter(deleted=False).count()

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


# # ─────────────────────────────────────────────────────────
# #  Detail serializer  (full — single job retrieve)
# # ─────────────────────────────────────────────────────────
# class JobDescriptionDetailSerializer(serializers.ModelSerializer):
#     skills          = serializers.SerializerMethodField()
#     analysis        = JobAnalysisSerializer(read_only=True)
#     company_name    = serializers.CharField(source='company.name', read_only=True)
#     created_by_name = serializers.SerializerMethodField()
#     updated_by_name = serializers.SerializerMethodField()
#     score_weights   = serializers.ReadOnlyField()

#     class Meta:
#         model  = JobDescription
#         fields = [
#             'id', 'title', 'department', 'location', 'is_remote',
#             'description', 'responsibilities', 'requirements', 'nice_to_have', 'benefits',
#             'experience_level', 'employment_type',
#             'min_experience_years', 'max_experience_years', 'education_requirement',
#             'salary_min', 'salary_max', 'salary_currency',
#             'extracted_skills', 'extracted_keywords', 'embedding_id',
#             'weight_skills', 'weight_experience', 'weight_education', 'weight_fit',
#             'score_weights', 'status', 'screening_count',
#             'company', 'company_name',
#             'created_by_name', 'updated_by_name',
#             'skills', 'analysis',
#             'created_at', 'updated_at',
#         ]
#         read_only_fields = [
#             'id', 'company', 'screening_count',
#             'extracted_skills', 'extracted_keywords', 'embedding_id',
#             'created_at', 'updated_at',
#         ]

#     def get_skills(self, obj):
#         return JobSkillSerializer(
#             obj.skills.filter(deleted=False), many=True
#         ).data

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

#     def to_representation(self, instance):
#         """Show archived/deleted message on soft-delete response."""
#         if instance.deleted:
#             return {
#                 'id':      str(instance.id),
#                 'title':   instance.title,
#                 'message': f'Job "{instance.title}" has been archived successfully.',
#             }
#         return super().to_representation(instance)


# # ─────────────────────────────────────────────────────────
# #  Write serializer  (create / update)
# # ─────────────────────────────────────────────────────────
# class JobDescriptionWriteSerializer(serializers.ModelSerializer):
#     skills          = JobSkillSerializer(many=True, required=False)
#     created_by_name = serializers.SerializerMethodField(read_only=True)
#     updated_by_name = serializers.SerializerMethodField(read_only=True)
#     company_name    = serializers.CharField(source='company.name', read_only=True)

#     class Meta:
#         model  = JobDescription
#         fields = [
#             'id', 'title', 'department', 'location', 'is_remote',
#             'description', 'responsibilities', 'requirements', 'nice_to_have', 'benefits',
#             'experience_level', 'employment_type',
#             'min_experience_years', 'max_experience_years', 'education_requirement',
#             'salary_min', 'salary_max', 'salary_currency',
#             'weight_skills', 'weight_experience', 'weight_education', 'weight_fit',
#             'status', 'skills',
#             'company',                                   # writable — required for superuser
#             'company_name', 'created_by_name', 'updated_by_name',
#             'created_at', 'updated_at',
#         ]
#         read_only_fields = ['id', 'created_at', 'updated_at', 'company_name']

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

#     # ── Validation ────────────────────────────────────────

#     def validate(self, attrs):
#         weights = [
#             attrs.get('weight_skills',     getattr(self.instance, 'weight_skills',     0.35)),
#             attrs.get('weight_experience', getattr(self.instance, 'weight_experience', 0.30)),
#             attrs.get('weight_education',  getattr(self.instance, 'weight_education',  0.20)),
#             attrs.get('weight_fit',        getattr(self.instance, 'weight_fit',        0.15)),
#         ]
#         total = sum(weights)
#         if abs(total - 1.0) > 0.01:
#             raise serializers.ValidationError(
#                 {'weights': f'Score weights must sum to 1.0. Current sum: {round(total, 3)}'}
#             )
#         return attrs

#     # ── Create ────────────────────────────────────────────

#     def create(self, validated_data):
#         skills_data = validated_data.pop('skills', [])
#         request     = self.context['request']
#         user        = request.user

#         # Superusers must pass company_id in payload
#         # Regular users get company from their profile
#         if 'company' not in validated_data:
#             company = getattr(user, 'company', None)
#             if not company:
#                 raise serializers.ValidationError(
#                     {'company': 'Your account has no company assigned. Pass company_id in the request or contact admin.'}
#                 )
#             validated_data['company'] = company

#         job = JobDescription.objects.create(**validated_data)
#         self._save_skills(job, skills_data)
#         return job

#     # ── Update ────────────────────────────────────────────

#     def update(self, instance, validated_data):
#         skills_data = validated_data.pop('skills', None)
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
#         instance.save()
#         if skills_data is not None:
#             # Soft-delete old skills and replace
#             instance.skills.all().update(deleted=True)
#             self._save_skills(instance, skills_data)
#         return instance

#     # ── Helpers ───────────────────────────────────────────

#     @staticmethod
#     def _save_skills(job, skills_data):
#         JobSkill.objects.bulk_create(
#             [JobSkill(job=job, **s) for s in skills_data if s.get('name')],
#             ignore_conflicts=True,
#         )

#     def to_representation(self, instance):
#         """Show clean archived message on soft-delete response."""
#         if instance.deleted:
#             return {
#                 'id':      str(instance.id),
#                 'title':   instance.title,
#                 'message': f'Job "{instance.title}" has been archived successfully.',
#             }
#         return super().to_representation(instance)





from rest_framework import serializers
from .models import JobDescription, JobSkill, JobAnalysis


# ─────────────────────────────────────────────────────────
#  JobSkill
# ─────────────────────────────────────────────────────────
class JobSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model  = JobSkill
        fields = ['id', 'name', 'category', 'importance', 'years_required']
        read_only_fields = ['id']


# ─────────────────────────────────────────────────────────
#  JobAnalysis  (read-only — AI-generated)
# ─────────────────────────────────────────────────────────
class JobAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model  = JobAnalysis
        fields = [
            'id', 'summary', 'key_requirements', 'ideal_candidate_profile',
            'technical_stack', 'soft_skills', 'domain_knowledge', 'red_flags',
            'seniority_level', 'model_used', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────
#  List serializer  (lightweight — dropdowns / cards)
# ─────────────────────────────────────────────────────────
class JobDescriptionListSerializer(serializers.ModelSerializer):
    company_name    = serializers.CharField(source='company.name', read_only=True)
    skills_count    = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = JobDescription
        fields = [
            'id', 'title', 'department', 'location', 'is_remote',
            'experience_level', 'employment_type', 'status',
            'company_name', 'skills_count', 'screening_count',
            'created_by_name', 'updated_by_name',
            'created_at', 'updated_at',
        ]

    def get_skills_count(self, obj):
        return obj.skills.filter(deleted=False).count()

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = obj.created_by.get_full_name()
            return name.strip() if name and name.strip() else obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            name = obj.updated_by.get_full_name()
            return name.strip() if name and name.strip() else obj.updated_by.username
        return None


# ─────────────────────────────────────────────────────────
#  Detail serializer  (full — single job retrieve)
# ─────────────────────────────────────────────────────────
class JobDescriptionDetailSerializer(serializers.ModelSerializer):
    skills          = serializers.SerializerMethodField()
    analysis        = JobAnalysisSerializer(read_only=True)
    company_name    = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()
    score_weights   = serializers.ReadOnlyField()

    class Meta:
        model  = JobDescription
        fields = [
            'id', 'title', 'department', 'location', 'is_remote',
            'description', 'responsibilities', 'requirements', 'nice_to_have', 'benefits',
            'experience_level', 'employment_type',
            'min_experience_years', 'max_experience_years', 'education_requirement',
            'salary_min', 'salary_max', 'salary_currency',
            'extracted_skills', 'extracted_keywords', 'embedding_id',
            'weight_skills', 'weight_experience', 'weight_education', 'weight_fit',
            'score_weights', 'status', 'screening_count',
            'company', 'company_name',
            'created_by_name', 'updated_by_name',
            'skills', 'analysis',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'company', 'screening_count',
            'extracted_skills', 'extracted_keywords', 'embedding_id',
            'created_at', 'updated_at',
        ]

    def get_skills(self, obj):
        return JobSkillSerializer(
            obj.skills.filter(deleted=False), many=True
        ).data

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = obj.created_by.get_full_name()
            return name.strip() if name and name.strip() else obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            name = obj.updated_by.get_full_name()
            return name.strip() if name and name.strip() else obj.updated_by.username
        return None

    def to_representation(self, instance):
        if instance.deleted:
            return {
                'id':      str(instance.id),
                'title':   instance.title,
                'message': f'Job "{instance.title}" has been archived successfully.',
            }
        return super().to_representation(instance)


# ─────────────────────────────────────────────────────────
#  Write serializer  (create / update)
# ─────────────────────────────────────────────────────────
class JobDescriptionWriteSerializer(serializers.ModelSerializer):
    skills          = JobSkillSerializer(many=True, required=False)
    created_by_name = serializers.SerializerMethodField(read_only=True)
    updated_by_name = serializers.SerializerMethodField(read_only=True)
    company_name    = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model  = JobDescription
        fields = [
            'id', 'title', 'department', 'location', 'is_remote',
            'description', 'responsibilities', 'requirements', 'nice_to_have', 'benefits',
            'experience_level', 'employment_type',
            'min_experience_years', 'max_experience_years', 'education_requirement',
            'salary_min', 'salary_max', 'salary_currency',
            'weight_skills', 'weight_experience', 'weight_education', 'weight_fit',
            'status', 'skills',
            'company',
            'company_name', 'created_by_name', 'updated_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'company_name']

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = obj.created_by.get_full_name()
            return name.strip() if name and name.strip() else obj.created_by.username
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            name = obj.updated_by.get_full_name()
            return name.strip() if name and name.strip() else obj.updated_by.username
        return None

    def validate(self, attrs):
        weights = [
            attrs.get('weight_skills',     getattr(self.instance, 'weight_skills',     0.35)),
            attrs.get('weight_experience', getattr(self.instance, 'weight_experience', 0.30)),
            attrs.get('weight_education',  getattr(self.instance, 'weight_education',  0.20)),
            attrs.get('weight_fit',        getattr(self.instance, 'weight_fit',        0.15)),
        ]
        total = sum(weights)
        if abs(total - 1.0) > 0.01:
            raise serializers.ValidationError(
                {'weights': f'Score weights must sum to 1.0. Current sum: {round(total, 3)}'}
            )
        return attrs

    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        request     = self.context['request']
        user        = request.user

        if 'company' not in validated_data:
            company = getattr(user, 'company', None)
            if not company:
                raise serializers.ValidationError(
                    {'company': 'Your account has no company assigned.'}
                )
            validated_data['company'] = company

        job = JobDescription.objects.create(**validated_data)
        self._save_skills(job, skills_data)
        return job

    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if skills_data is not None:
            instance.skills.all().update(deleted=True)
            self._save_skills(instance, skills_data)
        return instance

    @staticmethod
    def _save_skills(job, skills_data):
        JobSkill.objects.bulk_create(
            [JobSkill(job=job, **s) for s in skills_data if s.get('name')],
            ignore_conflicts=True,
        )

    def to_representation(self, instance):
        if instance.deleted:
            return {
                'id':      str(instance.id),
                'title':   instance.title,
                'message': f'Job "{instance.title}" has been archived successfully.',
            }
        return super().to_representation(instance)