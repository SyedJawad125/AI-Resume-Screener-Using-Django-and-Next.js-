import django_filters
from .models import Resume, ResumeStatus, EducationLevel


class ResumeFilter(django_filters.FilterSet):
    candidate_name     = django_filters.CharFilter(lookup_expr='icontains')
    candidate_email    = django_filters.CharFilter(lookup_expr='icontains')
    candidate_location = django_filters.CharFilter(lookup_expr='icontains')
    status             = django_filters.MultipleChoiceFilter(choices=ResumeStatus.choices)
    highest_education  = django_filters.MultipleChoiceFilter(choices=EducationLevel.choices)
    file_type          = django_filters.ChoiceFilter(choices=[('pdf', 'PDF'), ('docx', 'DOCX'), ('doc', 'DOC')])
    is_active          = django_filters.BooleanFilter()
    is_indexed         = django_filters.BooleanFilter()
    uploaded_by        = django_filters.UUIDFilter(field_name='created_by__id')
    min_experience     = django_filters.NumberFilter(field_name='total_experience_years', lookup_expr='gte')
    max_experience     = django_filters.NumberFilter(field_name='total_experience_years', lookup_expr='lte')
    uploaded_after     = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    uploaded_before    = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    has_skill          = django_filters.CharFilter(method='filter_by_skill')
    tag                = django_filters.CharFilter(method='filter_by_tag')
    has_parse_error    = django_filters.BooleanFilter(method='filter_has_parse_error')

    class Meta:
        model  = Resume
        fields = [
            'candidate_name', 'candidate_email', 'status', 'highest_education',
            'file_type', 'is_active', 'is_indexed', 'uploaded_by',
        ]

    def filter_by_skill(self, queryset, name, value):
        """Filter resumes that contain a specific skill name (active skills only)."""
        return queryset.filter(skills__name__icontains=value, skills__deleted=False).distinct()

    def filter_by_tag(self, queryset, name, value):
        """Filter by a tag value inside the JSON array."""
        return queryset.filter(tags__icontains=value)

    def filter_has_parse_error(self, queryset, name, value):
        """Filter resumes that have (True) or have not (False) encountered a parse error."""
        return queryset.exclude(parse_error='') if value else queryset.filter(parse_error='')