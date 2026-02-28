import django_filters
from django.db.models import F
from .models import ScreeningSession, ScreeningResult, ScreeningStatus, CandidateDecision


class ScreeningSessionFilter(django_filters.FilterSet):
    job            = django_filters.UUIDFilter(field_name='job__id')
    status         = django_filters.MultipleChoiceFilter(choices=ScreeningStatus.choices)
    initiated_by   = django_filters.UUIDFilter(field_name='initiated_by__id')
    created_after  = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    min_resumes    = django_filters.NumberFilter(field_name='total_resumes', lookup_expr='gte')

    class Meta:
        model  = ScreeningSession
        fields = ['job', 'status', 'initiated_by']


class ScreeningResultFilter(django_filters.FilterSet):
    session        = django_filters.UUIDFilter(field_name='session__id')
    job            = django_filters.UUIDFilter(field_name='job__id')
    resume         = django_filters.UUIDFilter(field_name='resume__id')
    ai_decision    = django_filters.MultipleChoiceFilter(choices=CandidateDecision.choices)
    human_decision = django_filters.MultipleChoiceFilter(choices=CandidateDecision.choices)
    status         = django_filters.MultipleChoiceFilter(choices=ScreeningStatus.choices)
    min_score      = django_filters.NumberFilter(field_name='overall_score', lookup_expr='gte')
    max_score      = django_filters.NumberFilter(field_name='overall_score', lookup_expr='lte')
    min_skill      = django_filters.NumberFilter(field_name='skill_score',   lookup_expr='gte')
    min_exp        = django_filters.NumberFilter(field_name='experience_score', lookup_expr='gte')
    must_have_met  = django_filters.BooleanFilter(field_name='must_have_skills_met')
    edu_match      = django_filters.BooleanFilter(field_name='education_match')

    candidate_name  = django_filters.CharFilter(field_name='resume__candidate_name', lookup_expr='icontains')
    candidate_email = django_filters.CharFilter(field_name='resume__candidate_email', lookup_expr='icontains')

    has_human_decision = django_filters.BooleanFilter(method='filter_has_human_decision')
    passed             = django_filters.BooleanFilter(method='filter_passed')
    ranked_top_n       = django_filters.NumberFilter(method='filter_top_n')

    class Meta:
        model  = ScreeningResult
        fields = ['session', 'job', 'resume', 'ai_decision', 'human_decision', 'status', 'must_have_met']

    def filter_has_human_decision(self, queryset, name, value):
        return queryset.exclude(human_decision='') if value else queryset.filter(human_decision='')

    def filter_passed(self, queryset, name, value):
        """Filter by whether candidate passed session threshold."""
        if value:
            return queryset.filter(overall_score__gte=F('session__pass_threshold'))
        return queryset.exclude(overall_score__gte=F('session__pass_threshold'))

    def filter_top_n(self, queryset, name, value):
        """Filter to top N ranked candidates within their session."""
        return queryset.filter(rank__lte=value)