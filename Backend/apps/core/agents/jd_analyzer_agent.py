"""
JD Analyzer Agent
─────────────────
Analyzes a job description with the LLM to produce:
  • Extracted skills (with importance levels)
  • Keywords for search
  • Ideal candidate profile
  • Tech stack categorization
"""
import json
import logging
import time
from django.conf import settings
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

ANALYZE_SYSTEM = (
    'You are a senior talent acquisition specialist. '
    'Analyze job descriptions with expert precision. '
    'Always respond with valid JSON only — no markdown, no explanation.'
)

ANALYZE_PROMPT = """\
Analyze the job description below and return a JSON object with EXACTLY this structure:

{{
  "extracted_skills": [
    {{
      "name":           "Python",
      "category":       "technical",
      "importance":     "must_have",
      "years_required": 3.0
    }}
  ],

  "extracted_keywords": ["Python", "REST API", "microservices"],

  "technical_stack": {{
    "languages":   ["Python", "SQL"],
    "frameworks":  ["Django", "FastAPI"],
    "databases":   ["PostgreSQL", "Redis"],
    "cloud":       ["AWS"],
    "tools":       ["Docker", "Git"],
    "other":       []
  }},

  "soft_skills":      ["Leadership", "Communication"],
  "domain_knowledge": ["Fintech", "Agile", "REST"],

  "education_requirement": "bachelor",
  "seniority_level":       "senior",

  "experience_summary":         "5+ years of backend development",
  "key_requirements":           "Top 3-5 must-have requirements in one short paragraph",
  "ideal_candidate_profile":    "Description of the perfect candidate in 2-3 sentences",

  "red_flags": ["Requires 10+ years with a 3-year-old technology"]
}}

importance must be one of: must_have | required | preferred | nice_to_have
education_requirement must be one of: high_school | associate | bachelor | master | mba | phd | any
seniority_level must be one of: intern | junior | mid | senior | lead | executive

Job Title: {title}

Job Description:
{jd_text}
"""


class JDAnalyzerAgent:
    """Analyzes a job description and extracts structured requirements."""

    def __init__(self):
        from openai import OpenAI
        self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self._model  = settings.OPENAI_MODEL

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    def analyze(self, job_id: str, title: str, jd_text: str) -> dict:
        """
        Returns:
            {'success': True, 'data': {...}, 'tokens_used': N}
            {'success': False, 'error': '...'}
        """
        t0 = time.time()
        tokens_used = 0
        try:
            resp = self._client.chat.completions.create(
                model           = self._model,
                messages        = [
                    {'role': 'system', 'content': ANALYZE_SYSTEM},
                    {'role': 'user',   'content': ANALYZE_PROMPT.format(
                        title   = title,
                        jd_text = jd_text[:8000],
                    )},
                ],
                temperature     = 0.1,
                max_tokens      = 2500,
                response_format = {'type': 'json_object'},
            )
            tokens_used = resp.usage.total_tokens
            data        = json.loads(resp.choices[0].message.content)
            ms          = int((time.time() - t0) * 1000)
            logger.info(f'[JDAnalyzer] {job_id} analyzed — {tokens_used} tokens, {ms} ms')
            self._log(job_id, 'success', data, tokens_used, ms)
            return {'success': True, 'data': data, 'tokens_used': tokens_used, 'ms': ms}

        except Exception as e:
            ms = int((time.time() - t0) * 1000)
            logger.error(f'[JDAnalyzer] Error for {job_id}: {e}')
            self._log(job_id, 'error', {}, tokens_used, ms, str(e))
            raise

    def _log(self, job_id, status, output, tokens, ms, error=''):
        try:
            from apps.screening.models import AgentExecutionLog
            AgentExecutionLog.objects.create(
                agent_type         = 'jd_analyzer',
                input_summary      = {'job_id': job_id},
                output_summary     = {
                    'skills_count':   len(output.get('extracted_skills', [])),
                    'keywords_count': len(output.get('extracted_keywords', [])),
                    'seniority':      output.get('seniority_level', ''),
                },
                status             = status,
                error_message      = error,
                tokens_used        = tokens,
                processing_time_ms = ms,
                model_used         = self._model,
            )
        except Exception as e:
            logger.warning(f'Failed to write AgentExecutionLog: {e}')