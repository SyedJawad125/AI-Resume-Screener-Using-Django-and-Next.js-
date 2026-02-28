"""
core/utils/exception_handler.py
────────────────────────────────
Custom DRF exception handler.
Referenced in settings.py:
    REST_FRAMEWORK = {
        'EXCEPTION_HANDLER': 'core.utils.exception_handler.custom_exception_handler',
    }

All API errors across jobs / resumes / screening now return:
{
    "error": true,
    "message": "Human-readable string",
    "details": { ...original DRF error dict... },
    "status_code": 400
}
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    # Let DRF handle it first
    response = exception_handler(exc, context)

    if response is not None:
        # Wrap the standard DRF error in our envelope
        response.data = {
            'error':       True,
            'message':     _extract_message(response.data),
            'details':     response.data,
            'status_code': response.status_code,
        }
    else:
        # Unhandled server error
        view = context.get('view', '')
        logger.exception(f'Unhandled exception in {view}: {exc}')
        response = Response(
            {
                'error':       True,
                'message':     'An unexpected server error occurred. Please try again.',
                'details':     {},
                'status_code': 500,
            },
            status=500,
        )

    return response


def _extract_message(data) -> str:
    """Pull a readable string out of DRF's error dict/list."""
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        if 'non_field_errors' in data:
            errors = data['non_field_errors']
            return str(errors[0]) if errors else 'Validation error'
        # First field error
        for key, val in data.items():
            if isinstance(val, list) and val:
                return f'{key}: {val[0]}'
            if isinstance(val, str):
                return f'{key}: {val}'
    elif isinstance(data, list) and data:
        return str(data[0])
    return 'An error occurred.'