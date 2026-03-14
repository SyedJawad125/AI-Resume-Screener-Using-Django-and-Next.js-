# from django.utils import timezone
# from rest_framework import serializers
# from .models import ScreeningSession, ScreeningResult, AgentExecutionLog, CandidateDecision, ScreeningStatus


# # ─────────────────────────────────────────────────────────
# #  Helper
# # ─────────────────────────────────────────────────────────
# def _resolve_user_name(user):
#     if not user:
#         return None
#     name = user.get_full_name()
#     return name.strip() if name and name.strip() else user.username


# # ─────────────────────────────────────────────────────────
# #  Start Screening  (request body)
# # ─────────────────────────────────────────────────────────
# class StartScreeningSerializer(serializers.Serializer):
#     job_id           = serializers.UUIDField()
#     resume_ids       = serializers.ListField(child=serializers.UUIDField(), min_length=1, max_length=500)
#     pass_threshold   = serializers.FloatField(default=70.0, min_value=0, max_value=100)
#     top_n_candidates = serializers.IntegerField(default=10, min_value=1, max_value=200)

#     def validate_job_id(self, value):
#         from apps.jobs.models import JobDescription, JobStatus
#         company = getattr(self.context['request'].user, 'company', None)
#         filters = {'id': value, 'status__in': [JobStatus.ACTIVE, JobStatus.DRAFT]}
#         if company:
#             filters['company'] = company
#         try:
#             self.job = JobDescription.objects.get(**filters)
#         except JobDescription.DoesNotExist:
#             raise serializers.ValidationError('Job not found or not in active/draft status.')
#         return value

#     def validate_resume_ids(self, value):
#         from apps.resumes.models import Resume, ResumeStatus
#         company = getattr(self.context['request'].user, 'company', None)
#         ids     = [str(v) for v in value]

#         filters = {'id__in': ids, 'is_active': True}
#         if company:
#             filters['company'] = company

#         resumes = Resume.objects.filter(**filters)
#         if resumes.count() != len(ids):
#             found   = {str(r.id) for r in resumes}
#             missing = [i for i in ids if i not in found]
#             raise serializers.ValidationError(f'Resumes not found or inactive: {missing}')

#         not_ready = resumes.exclude(status__in=[ResumeStatus.PARSED, ResumeStatus.INDEXED])
#         if not_ready.exists():
#             names = list(not_ready.values_list('original_filename', flat=True)[:5])
#             raise serializers.ValidationError(
#                 f'{not_ready.count()} resume(s) are not yet parsed: {names}'
#             )

#         self.resumes = resumes
#         return value


# # ─────────────────────────────────────────────────────────
# #  Agent Execution Log  (read-only)
# # ─────────────────────────────────────────────────────────
# class AgentLogSerializer(serializers.ModelSerializer):
#     class Meta:
#         model  = AgentExecutionLog
#         fields = [
#             'id', 'agent_type', 'agent_version', 'status',
#             'tokens_used', 'processing_time_ms', 'model_used',
#             'error_message', 'created_at',
#         ]
#         read_only_fields = fields


# # ─────────────────────────────────────────────────────────
# #  Screening Result — list  (lightweight)
# # ─────────────────────────────────────────────────────────
# class ScreeningResultListSerializer(serializers.ModelSerializer):
#     candidate_name  = serializers.CharField(source='resume.candidate_name',  read_only=True)
#     candidate_email = serializers.CharField(source='resume.candidate_email', read_only=True)
#     job_title       = serializers.CharField(source='job.title',              read_only=True)
#     score_breakdown = serializers.ReadOnlyField()
#     passed          = serializers.ReadOnlyField()

#     class Meta:
#         model  = ScreeningResult
#         fields = [
#             'id', 'session', 'resume', 'job',
#             'candidate_name', 'candidate_email', 'job_title',
#             'overall_score', 'skill_score', 'experience_score', 'education_score',
#             'score_breakdown', 'passed',
#             'ai_decision', 'human_decision',
#             'rank', 'must_have_skills_met', 'status',
#             'created_at',
#         ]
#         read_only_fields = fields


# # ─────────────────────────────────────────────────────────
# #  Screening Result — detail  (full AI explanation)
# # ─────────────────────────────────────────────────────────
# class ScreeningResultDetailSerializer(serializers.ModelSerializer):
#     candidate_name     = serializers.CharField(source='resume.candidate_name',     read_only=True)
#     candidate_email    = serializers.CharField(source='resume.candidate_email',    read_only=True)
#     candidate_location = serializers.CharField(source='resume.candidate_location', read_only=True)
#     candidate_phone    = serializers.CharField(source='resume.candidate_phone',    read_only=True)
#     job_title          = serializers.CharField(source='job.title',                 read_only=True)
#     score_breakdown    = serializers.ReadOnlyField()
#     passed             = serializers.ReadOnlyField()
#     reviewed_by_name   = serializers.SerializerMethodField()
#     agent_logs         = AgentLogSerializer(many=True, read_only=True)

#     class Meta:
#         model  = ScreeningResult
#         fields = [
#             'id', 'session', 'resume', 'job',
#             'candidate_name', 'candidate_email', 'candidate_location', 'candidate_phone',
#             'job_title',

#             # Scores
#             'overall_score', 'skill_score', 'experience_score',
#             'education_score', 'fit_score', 'semantic_similarity',
#             'score_breakdown',

#             # Skill breakdown
#             'matched_skills', 'missing_skills', 'bonus_skills', 'must_have_skills_met',

#             # Experience
#             'years_of_experience', 'experience_gap_years', 'relevant_experience_pct',

#             # Education
#             'education_match', 'education_level',

#             # AI explanation
#             'strengths', 'weaknesses', 'explanation', 'recommendation',
#             'interview_questions', 'red_flags', 'growth_potential',

#             # Decisions
#             'ai_decision', 'human_decision', 'human_notes',
#             'reviewed_by_name', 'reviewed_at',
#             'rank', 'passed',

#             # Meta
#             'model_used', 'tokens_used', 'processing_time_ms',
#             'status', 'error_message',
#             'agent_logs',
#             'created_at', 'updated_at',
#         ]
#         read_only_fields = [
#             f for f in fields
#             if f not in ['human_decision', 'human_notes']
#         ]

#     def get_reviewed_by_name(self, obj):
#         return _resolve_user_name(obj.reviewed_by)


# # ─────────────────────────────────────────────────────────
# #  Human Decision  (PATCH only)
# # ─────────────────────────────────────────────────────────
# class HumanDecisionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model  = ScreeningResult
#         fields = ['human_decision', 'human_notes']

#     def validate_human_decision(self, value):
#         if value not in CandidateDecision.values:
#             raise serializers.ValidationError(
#                 f'Invalid decision. Choices: {list(CandidateDecision.values)}'
#             )
#         return value

#     def update(self, instance, validated_data):
#         instance.human_decision = validated_data.get('human_decision', instance.human_decision)
#         instance.human_notes    = validated_data.get('human_notes',    instance.human_notes)
#         instance.reviewed_by    = self.context['request'].user
#         instance.reviewed_at    = timezone.now()
#         instance.save(update_fields=['human_decision', 'human_notes', 'reviewed_by', 'reviewed_at', 'updated_at'])
#         return instance


# # ─────────────────────────────────────────────────────────
# #  Screening Session — list  (lightweight)
# # ─────────────────────────────────────────────────────────
# class ScreeningSessionListSerializer(serializers.ModelSerializer):
#     job_title         = serializers.CharField(source='job.title', read_only=True)
#     initiated_by_name = serializers.SerializerMethodField()
#     progress_pct      = serializers.ReadOnlyField()

#     class Meta:
#         model  = ScreeningSession
#         fields = [
#             'id', 'job', 'job_title', 'initiated_by_name',
#             'status', 'total_resumes', 'processed_count', 'failed_count',
#             'progress_pct', 'pass_threshold', 'top_n_candidates',
#             'created_at', 'completed_at',
#         ]
#         read_only_fields = fields

#     def get_initiated_by_name(self, obj):
#         return _resolve_user_name(obj.initiated_by)


# # ─────────────────────────────────────────────────────────
# #  Screening Session — detail
# # ─────────────────────────────────────────────────────────
# class ScreeningSessionDetailSerializer(serializers.ModelSerializer):
#     job_title         = serializers.CharField(source='job.title', read_only=True)
#     initiated_by_name = serializers.SerializerMethodField()
#     progress_pct      = serializers.ReadOnlyField()
#     duration_seconds  = serializers.ReadOnlyField()
#     top_candidates    = serializers.SerializerMethodField()
#     pass_rate_pct     = serializers.SerializerMethodField()

#     class Meta:
#         model  = ScreeningSession
#         fields = [
#             'id', 'job', 'job_title', 'company',
#             'initiated_by', 'initiated_by_name',
#             'status', 'total_resumes', 'processed_count', 'failed_count',
#             'progress_pct', 'task_id',
#             'pass_threshold', 'top_n_candidates',
#             'total_tokens_used', 'total_cost_usd',
#             'duration_seconds', 'pass_rate_pct',
#             'created_at', 'started_at', 'completed_at',
#             'top_candidates',
#         ]
#         read_only_fields = fields

#     def get_initiated_by_name(self, obj):
#         return _resolve_user_name(obj.initiated_by)

#     def get_top_candidates(self, obj):
#         if obj.status != ScreeningStatus.COMPLETED:
#             return []
#         top = obj.results.filter(status=ScreeningStatus.COMPLETED).order_by('-overall_score')[:5]
#         return ScreeningResultListSerializer(top, many=True).data

#     def get_pass_rate_pct(self, obj):
#         if obj.status != ScreeningStatus.COMPLETED or obj.total_resumes == 0:
#             return None
#         passed = obj.results.filter(
#             overall_score__gte=obj.pass_threshold,
#             status=ScreeningStatus.COMPLETED,
#         ).count()
#         return round(passed / obj.total_resumes * 100, 1)


# # ─────────────────────────────────────────────────────────
# #  Compare Candidates  (request body)
# # ─────────────────────────────────────────────────────────
# class CompareCandidatesSerializer(serializers.Serializer):
#     result_ids = serializers.ListField(
#         child=serializers.UUIDField(), min_length=2, max_length=5
#     )







from django.utils import timezone
from rest_framework import serializers
from .models import ScreeningSession, ScreeningResult, AgentExecutionLog, CandidateDecision, ScreeningStatus


def _resolve_user_name(user):
    if not user:
        return None
    name = user.get_full_name()
    return name.strip() if name and name.strip() else user.username


# ─────────────────────────────────────────────────────────
#  Start Screening  (request body)
# ─────────────────────────────────────────────────────────
class StartScreeningSerializer(serializers.Serializer):
    job_id           = serializers.UUIDField()
    resume_ids       = serializers.ListField(child=serializers.UUIDField(), min_length=1, max_length=500)
    pass_threshold   = serializers.FloatField(default=70.0, min_value=0, max_value=100)
    top_n_candidates = serializers.IntegerField(default=10, min_value=1, max_value=200)

    def validate_job_id(self, value):
        from apps.jobs.models import JobDescription, JobStatus
        company = getattr(self.context['request'].user, 'company', None)
        filters = {'id': value, 'deleted': False, 'status__in': [JobStatus.ACTIVE, JobStatus.DRAFT]}
        if company:
            filters['company'] = company
        try:
            self.job = JobDescription.objects.get(**filters)
        except JobDescription.DoesNotExist:
            raise serializers.ValidationError('Job not found or not in active/draft status.')
        return value

    def validate_resume_ids(self, value):
        from apps.resumes.models import Resume, ResumeStatus
        company = getattr(self.context['request'].user, 'company', None)
        ids     = [str(v) for v in value]

        filters = {'id__in': ids, 'is_active': True}
        if company:
            filters['company'] = company

        resumes = Resume.objects.filter(**filters)
        if resumes.count() != len(ids):
            found   = {str(r.id) for r in resumes}
            missing = [i for i in ids if i not in found]
            raise serializers.ValidationError(f'Resumes not found or inactive: {missing}')

        not_ready = resumes.exclude(status__in=[ResumeStatus.PARSED, ResumeStatus.INDEXED])
        if not_ready.exists():
            names = list(not_ready.values_list('original_filename', flat=True)[:5])
            raise serializers.ValidationError(
                f'{not_ready.count()} resume(s) are not yet parsed/indexed: {names}'
            )

        self.resumes = resumes
        return value


# ─────────────────────────────────────────────────────────
#  Agent Log  (read-only)
# ─────────────────────────────────────────────────────────
class AgentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AgentExecutionLog
        fields = [
            'id', 'agent_type', 'agent_version', 'status',
            'tokens_used', 'processing_time_ms', 'model_used',
            'error_message', 'created_at',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────
#  Screening Result — list  (lightweight)
# ─────────────────────────────────────────────────────────
class ScreeningResultListSerializer(serializers.ModelSerializer):
    candidate_name  = serializers.CharField(source='resume.candidate_name',  read_only=True)
    candidate_email = serializers.CharField(source='resume.candidate_email', read_only=True)
    job_title       = serializers.CharField(source='job.title',              read_only=True)
    score_breakdown = serializers.ReadOnlyField()
    passed          = serializers.ReadOnlyField()

    class Meta:
        model  = ScreeningResult
        fields = [
            'id', 'session', 'resume', 'job',
            'candidate_name', 'candidate_email', 'job_title',
            'overall_score', 'skill_score', 'experience_score', 'education_score',
            'score_breakdown', 'passed',
            'ai_decision', 'human_decision',
            'rank', 'must_have_skills_met', 'status',
            'created_at',
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────────────────
#  Screening Result — detail  (full AI explanation)
# ─────────────────────────────────────────────────────────
class ScreeningResultDetailSerializer(serializers.ModelSerializer):
    candidate_name     = serializers.CharField(source='resume.candidate_name',     read_only=True)
    candidate_email    = serializers.CharField(source='resume.candidate_email',    read_only=True)
    candidate_location = serializers.CharField(source='resume.candidate_location', read_only=True)
    candidate_phone    = serializers.CharField(source='resume.candidate_phone',    read_only=True)
    job_title          = serializers.CharField(source='job.title',                 read_only=True)
    score_breakdown    = serializers.ReadOnlyField()
    passed             = serializers.ReadOnlyField()
    reviewed_by_name   = serializers.SerializerMethodField()
    agent_logs         = AgentLogSerializer(many=True, read_only=True)

    class Meta:
        model  = ScreeningResult
        fields = [
            'id', 'session', 'resume', 'job',
            'candidate_name', 'candidate_email', 'candidate_location', 'candidate_phone',
            'job_title',
            'overall_score', 'skill_score', 'experience_score',
            'education_score', 'fit_score', 'semantic_similarity',
            'score_breakdown',
            'matched_skills', 'missing_skills', 'bonus_skills', 'must_have_skills_met',
            'years_of_experience', 'experience_gap_years', 'relevant_experience_pct',
            'education_match', 'education_level',
            'strengths', 'weaknesses', 'explanation', 'recommendation',
            'interview_questions', 'red_flags', 'growth_potential',
            'ai_decision', 'human_decision', 'human_notes',
            'reviewed_by_name', 'reviewed_at',
            'rank', 'passed',
            'model_used', 'tokens_used', 'processing_time_ms',
            'status', 'error_message',
            'agent_logs',
            'created_at', 'updated_at',
        ]
        read_only_fields = [f for f in fields if f not in ['human_decision', 'human_notes']]

    def get_reviewed_by_name(self, obj):
        return _resolve_user_name(obj.reviewed_by)


# ─────────────────────────────────────────────────────────
#  Human Decision  (PATCH only)
# ─────────────────────────────────────────────────────────
class HumanDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ScreeningResult
        fields = ['human_decision', 'human_notes']

    def validate_human_decision(self, value):
        if value not in CandidateDecision.values:
            raise serializers.ValidationError(
                f'Invalid decision. Choices: {list(CandidateDecision.values)}'
            )
        return value

    def update(self, instance, validated_data):
        instance.human_decision = validated_data.get('human_decision', instance.human_decision)
        instance.human_notes    = validated_data.get('human_notes',    instance.human_notes)
        instance.reviewed_by    = self.context['request'].user
        instance.reviewed_at    = timezone.now()
        instance.save(update_fields=['human_decision', 'human_notes', 'reviewed_by', 'reviewed_at', 'updated_at'])
        return instance


# ─────────────────────────────────────────────────────────
#  Screening Session — list  (lightweight)
# ─────────────────────────────────────────────────────────
class ScreeningSessionListSerializer(serializers.ModelSerializer):
    job_title         = serializers.CharField(source='job.title', read_only=True)
    initiated_by_name = serializers.SerializerMethodField()
    created_by_name   = serializers.SerializerMethodField()
    progress_pct      = serializers.ReadOnlyField()

    class Meta:
        model  = ScreeningSession
        fields = [
            'id', 'job', 'job_title',
            'initiated_by_name', 'created_by_name',
            'status', 'total_resumes', 'processed_count', 'failed_count',
            'progress_pct', 'pass_threshold', 'top_n_candidates',
            'created_at', 'completed_at',
        ]
        read_only_fields = fields

    def get_initiated_by_name(self, obj):
        return _resolve_user_name(obj.initiated_by)

    def get_created_by_name(self, obj):
        return _resolve_user_name(getattr(obj, 'created_by', None))


# ─────────────────────────────────────────────────────────
#  Screening Session — detail
# ─────────────────────────────────────────────────────────
class ScreeningSessionDetailSerializer(serializers.ModelSerializer):
    job_title         = serializers.CharField(source='job.title', read_only=True)
    initiated_by_name = serializers.SerializerMethodField()
    created_by_name   = serializers.SerializerMethodField()
    progress_pct      = serializers.ReadOnlyField()
    duration_seconds  = serializers.ReadOnlyField()
    top_candidates    = serializers.SerializerMethodField()
    pass_rate_pct     = serializers.SerializerMethodField()

    class Meta:
        model  = ScreeningSession
        fields = [
            'id', 'job', 'job_title', 'company',
            'initiated_by', 'initiated_by_name',
            'created_by_name',
            'status', 'total_resumes', 'processed_count', 'failed_count',
            'progress_pct', 'task_id',
            'pass_threshold', 'top_n_candidates',
            'total_tokens_used', 'total_cost_usd',
            'duration_seconds', 'pass_rate_pct',
            'created_at', 'started_at', 'completed_at',
            'top_candidates',
        ]
        read_only_fields = fields

    def get_initiated_by_name(self, obj):
        return _resolve_user_name(obj.initiated_by)

    def get_created_by_name(self, obj):
        return _resolve_user_name(getattr(obj, 'created_by', None))

    def get_top_candidates(self, obj):
        if obj.status != ScreeningStatus.COMPLETED:
            return []
        top = obj.results.filter(
            deleted=False, status=ScreeningStatus.COMPLETED
        ).order_by('-overall_score')[:5]
        return ScreeningResultListSerializer(top, many=True).data

    def get_pass_rate_pct(self, obj):
        if obj.status != ScreeningStatus.COMPLETED or obj.total_resumes == 0:
            return None
        passed = obj.results.filter(
            deleted=False,
            overall_score__gte=obj.pass_threshold,
            status=ScreeningStatus.COMPLETED,
        ).count()
        return round(passed / obj.total_resumes * 100, 1)


# ─────────────────────────────────────────────────────────
#  Compare Candidates  (request body)
# ─────────────────────────────────────────────────────────
class CompareCandidatesSerializer(serializers.Serializer):
    result_ids = serializers.ListField(
        child=serializers.UUIDField(), min_length=2, max_length=5
    )