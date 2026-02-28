"""
Explanation Agent
─────────────────
Generates the human-readable AI explanation for a screening result:
  • Strengths & weaknesses
  • Detailed explanation paragraph
  • Final recommendation
  • Suggested interview questions
  • Red flags
  • Growth potential
"""
import json
import logging
import time
from django.conf import settings
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

EXPLANATION_SYSTEM = (
    'You are a senior HR director with 20 years of talent acquisition experience. '
    'Write objective, evidence-based assessments. '
    'Always respond with valid JSON only — no markdown, no extra text.'
)

EXPLANATION_PROMPT = """\
Generate a professional screening assessment based on the data below.

=== CANDIDATE DATA ===
Name:               {name}
Total Experience:   {exp_years} years
Education:          {education}
Overall Score:      {overall_score}/100
Skill Score:        {skill_score}/100
Experience Score:   {exp_score}/100
Education Score:    {edu_score}/100
Semantic Similarity:{similarity} (0-1, RAG score)
Must-Have Met:      {must_have_met}

Matched Skills  ({n_matched}): {matched}
Missing Skills  ({n_missing}): {missing}
Bonus Skills    ({n_bonus}):   {bonus}

=== JOB DATA ===
Title:          {job_title}
Experience Req: {min_exp}+ years
Requirements:
{requirements}

Return EXACTLY this JSON:
{{
  "strengths": [
    "Specific, evidence-backed strength 1",
    "Specific, evidence-backed strength 2",
    "Specific, evidence-backed strength 3"
  ],
  "weaknesses": [
    "Specific gap or concern 1",
    "Specific gap or concern 2"
  ],
  "explanation": "Two to three paragraph professional assessment: score rationale, key factors, cultural/role fit.",
  "recommendation": "One sentence: SHORTLIST / MAYBE / REJECT — with justification.",
  "decision": "shortlisted|maybe|rejected",
  "interview_questions": [
    "Deep-dive question on a key claimed skill",
    "Behavioral question relevant to a requirement",
    "Question to probe the biggest gap"
  ],
  "red_flags": [
    "Concern that needs verification (empty list if none)"
  ],
  "growth_potential": "One sentence assessment of growth trajectory."
}}

decision must be one of: shortlisted | maybe | rejected
"""


class ExplanationAgent:
    """Calls the LLM to generate a human-readable screening explanation."""

    def __init__(self):
        from openai import OpenAI
        self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self._model  = settings.OPENAI_MODEL

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=10))
    def generate(self, data: dict, result_id: str) -> dict:
        """
        data keys (all required):
            name, exp_years, education, overall_score, skill_score,
            exp_score, edu_score, similarity, must_have_met,
            matched_skills, missing_skills, bonus_skills,
            job_title, min_exp_years, jd_requirements

        Returns:
            {'success': True, 'data': {...}, 'tokens_used': N}
        """
        t0 = time.time()
        tokens_used = 0
        try:
            matched = ', '.join(s.get('name', '') for s in data.get('matched_skills', [])[:10])
            missing = ', '.join(s.get('name', '') for s in data.get('missing_skills', [])[:10])
            bonus   = ', '.join(str(s) for s in data.get('bonus_skills', [])[:8])

            prompt = EXPLANATION_PROMPT.format(
                name          = data.get('name', 'Unknown'),
                exp_years     = data.get('exp_years', 0),
                education     = data.get('education', 'unknown'),
                overall_score = round(data.get('overall_score', 0), 1),
                skill_score   = round(data.get('skill_score', 0), 1),
                exp_score     = round(data.get('exp_score', 0), 1),
                edu_score     = round(data.get('edu_score', 0), 1),
                similarity    = round(data.get('similarity', 0), 3),
                must_have_met = data.get('must_have_met', False),
                n_matched     = len(data.get('matched_skills', [])),
                matched       = matched or 'None',
                n_missing     = len(data.get('missing_skills', [])),
                missing       = missing or 'None',
                n_bonus       = len(data.get('bonus_skills', [])),
                bonus         = bonus or 'None',
                job_title     = data.get('job_title', 'Unknown'),
                min_exp       = data.get('min_exp_years', 0),
                requirements  = data.get('jd_requirements', 'Not provided')[:1000],
            )

            resp = self._client.chat.completions.create(
                model           = self._model,
                messages        = [
                    {'role': 'system', 'content': EXPLANATION_SYSTEM},
                    {'role': 'user',   'content': prompt},
                ],
                temperature     = 0.3,
                max_tokens      = 2000,
                response_format = {'type': 'json_object'},
            )
            tokens_used = resp.usage.total_tokens
            parsed      = json.loads(resp.choices[0].message.content)
            ms          = int((time.time() - t0) * 1000)
            logger.info(f'[ExplanationAgent] {result_id} — {tokens_used} tokens, {ms} ms')
            self._log(result_id, 'success', parsed, tokens_used, ms)
            return {'success': True, 'data': parsed, 'tokens_used': tokens_used, 'ms': ms}

        except Exception as e:
            ms = int((time.time() - t0) * 1000)
            logger.error(f'[ExplanationAgent] Error for {result_id}: {e}')
            self._log(result_id, 'error', {}, tokens_used, ms, str(e))
            raise

    def _log(self, result_id, status, output, tokens, ms, error=''):
        try:
            from apps.screening.models import AgentExecutionLog, ScreeningResult
            result = ScreeningResult.objects.get(id=result_id)
            AgentExecutionLog.objects.create(
                screening_result   = result,
                agent_type         = 'explanation',
                input_summary      = {'result_id': result_id},
                output_summary     = {
                    'decision':  output.get('decision', ''),
                    'strengths': len(output.get('strengths', [])),
                    'questions': len(output.get('interview_questions', [])),
                },
                status             = status,
                error_message      = error,
                tokens_used        = tokens,
                processing_time_ms = ms,
                model_used         = self._model,
            )
        except Exception as e:
            logger.warning(f'Failed to write AgentExecutionLog: {e}')