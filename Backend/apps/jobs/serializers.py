from rest_framework import serializers
from .models import JobDescription, JobSkill, JobAnalysis


# ─────────────────────────────────────────────
#  JobSkill
# ─────────────────────────────────────────────
class JobSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model  = JobSkill
        fields = ['id', 'name', 'category', 'importance', 'years_required']
        read_only_fields = ['id']


# ─────────────────────────────────────────────
#  JobAnalysis  (read-only — AI-generated)
# ─────────────────────────────────────────────
class JobAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model  = JobAnalysis
        fields = [
            'id', 'summary', 'key_requirements', 'ideal_candidate_profile',
            'technical_stack', 'soft_skills', 'domain_knowledge', 'red_flags',
            'seniority_level', 'model_used', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────
#  List serializer (lightweight)
# ─────────────────────────────────────────────
class JobDescriptionListSerializer(serializers.ModelSerializer):
    company_name  = serializers.CharField(source='company.name', read_only=True)
    skills_count  = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = JobDescription
        fields = [
            'id', 'title', 'department', 'location', 'is_remote',
            'experience_level', 'employment_type', 'status',
            'company_name', 'created_by_name', 'screening_count',
            'skills_count', 'created_at', 'updated_at',
        ]

    def get_skills_count(self, obj):
        return obj.skills.count()

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


# ─────────────────────────────────────────────
#  Detail serializer (full)
# ─────────────────────────────────────────────
class JobDescriptionDetailSerializer(serializers.ModelSerializer):
    skills          = JobSkillSerializer(many=True, read_only=True)
    analysis        = JobAnalysisSerializer(read_only=True)
    company_name    = serializers.CharField(source='company.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
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
            'score_weights', 'status',
            'company', 'company_name', 'created_by', 'created_by_name',
            'screening_count', 'skills', 'analysis',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'company', 'created_by', 'screening_count',
            'extracted_skills', 'extracted_keywords', 'embedding_id',
            'created_at', 'updated_at',
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


# ─────────────────────────────────────────────
#  Create / Update serializer
# ─────────────────────────────────────────────
class JobDescriptionWriteSerializer(serializers.ModelSerializer):
    skills = JobSkillSerializer(many=True, required=False)

    class Meta:
        model  = JobDescription
        fields = [
            'title', 'department', 'location', 'is_remote',
            'description', 'responsibilities', 'requirements', 'nice_to_have', 'benefits',
            'experience_level', 'employment_type',
            'min_experience_years', 'max_experience_years', 'education_requirement',
            'salary_min', 'salary_max', 'salary_currency',
            'weight_skills', 'weight_experience', 'weight_education', 'weight_fit',
            'status', 'skills',
        ]

    def validate(self, attrs):
        weights = [
            attrs.get('weight_skills',     self.instance.weight_skills     if self.instance else 0.35),
            attrs.get('weight_experience', self.instance.weight_experience if self.instance else 0.30),
            attrs.get('weight_education',  self.instance.weight_education  if self.instance else 0.20),
            attrs.get('weight_fit',        self.instance.weight_fit        if self.instance else 0.15),
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
        validated_data['company']    = request.user.company
        validated_data['created_by'] = request.user
        job = JobDescription.objects.create(**validated_data)
        self._save_skills(job, skills_data)
        return job

    def update(self, instance, validated_data):
        skills_data = validated_data.pop('skills', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if skills_data is not None:
            instance.skills.all().delete()
            self._save_skills(instance, skills_data)
        return instance

    @staticmethod
    def _save_skills(job, skills_data):
        JobSkill.objects.bulk_create([
            JobSkill(job=job, **s)
            for s in skills_data
            if s.get('name')
        ], ignore_conflicts=True)