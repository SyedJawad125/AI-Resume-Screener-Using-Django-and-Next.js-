import django_filters
from .models import JobDescription, JobStatus, ExperienceLevel, EmploymentType


class JobDescriptionFilter(django_filters.FilterSet):
    title              = django_filters.CharFilter(lookup_expr='icontains')
    department         = django_filters.CharFilter(lookup_expr='icontains')
    location           = django_filters.CharFilter(lookup_expr='icontains')
    status             = django_filters.MultipleChoiceFilter(choices=JobStatus.choices)
    experience_level   = django_filters.MultipleChoiceFilter(choices=ExperienceLevel.choices)
    employment_type    = django_filters.MultipleChoiceFilter(choices=EmploymentType.choices)
    is_remote          = django_filters.BooleanFilter()
    min_exp_gte        = django_filters.NumberFilter(field_name='min_experience_years', lookup_expr='gte')
    min_exp_lte        = django_filters.NumberFilter(field_name='min_experience_years', lookup_expr='lte')
    created_after      = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before     = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    created_by         = django_filters.UUIDFilter(field_name='created_by__id')
    has_analysis       = django_filters.BooleanFilter(method='filter_has_analysis')
    has_screenings     = django_filters.BooleanFilter(method='filter_has_screenings')
    skill_name         = django_filters.CharFilter(method='filter_by_skill')

    class Meta:
        model  = JobDescription
        fields = ['title', 'department', 'status', 'experience_level',
                  'employment_type', 'is_remote', 'created_by']

    def filter_has_analysis(self, queryset, name, value):
        return queryset.filter(analysis__isnull=not value)

    def filter_has_screenings(self, queryset, name, value):
        return queryset.filter(screening_count__gt=0) if value else queryset.filter(screening_count=0)

    def filter_by_skill(self, queryset, name, value):
        return queryset.filter(skills__name__icontains=value).distinct()