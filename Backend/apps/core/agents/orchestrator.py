"""
Screening Orchestrator
──────────────────────
Coordinates the full multi-agent pipeline:

  RESUME PARSING (called once after upload)
  ─────────────────────────────────────────
  File → ResumeFileExtractor → raw_text
        → ResumeParserAgent  → structured JSON
        → DB update          → ResumeSkill rows
        → VectorStoreService → indexed

  JD ANALYSIS (called once per JD, before screening)
  ────────────────────────────────────────────────────
  JD text → JDAnalyzerAgent → extracted skills / keywords
           → DB update      → JobSkill rows + JobAnalysis
           → VectorStoreService → indexed

  SCREENING (called once per resume–JD pair)
  ──────────────────────────────────────────
  1. Load resume + job from DB
  2. RAG: VectorStore.resume_similarity() → semantic_similarity
  3. SkillMatcherAgent    → skill_score, matched/missing skills
  4. ExperienceScorerAgent → experience_score
  5. EducationScorerAgent  → education_score
  6. Weighted aggregation  → overall_score
  7. ExplanationAgent      → LLM explanation + decision
  8. Save ScreeningResult  + rank within session
"""
import logging
import time
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

# Decision mapping from LLM output → our enum
DECISION_MAP = {
    'shortlisted': 'shortlisted',
    'shortlist':   'shortlisted',
    'interview':   'interview',
    'maybe':       'maybe',
    'hold':        'hold',
    'reject':      'rejected',
    'rejected':    'rejected',
}


class ScreeningOrchestrator:
    """Central coordinator for all agent pipelines."""

    def __init__(self):
        from core.agents.resume_parser_agent import ResumeParserAgent, ResumeFileExtractor
        from core.agents.jd_analyzer_agent   import JDAnalyzerAgent
        from core.agents.scoring_agents      import (
            SkillMatcherAgent, ExperienceScorerAgent, EducationScorerAgent
        )
        from core.agents.explanation_agent   import ExplanationAgent
        from core.rag.vector_store           import VectorStoreService

        self.file_extractor   = ResumeFileExtractor()
        self.resume_parser    = ResumeParserAgent()
        self.jd_analyzer      = JDAnalyzerAgent()
        self.skill_matcher    = SkillMatcherAgent()
        self.exp_scorer       = ExperienceScorerAgent()
        self.edu_scorer       = EducationScorerAgent()
        self.explanation      = ExplanationAgent()
        self.vector_store     = VectorStoreService()

    # ══════════════════════════════════════════════════════════════
    #  1. PARSE RESUME
    # ══════════════════════════════════════════════════════════════

    def parse_resume(self, resume_id: str) -> bool:
        """
        Full resume parsing pipeline.
        Returns True on success, False on failure.
        """
        from apps.resumes.models import Resume, ResumeStatus, ResumeSkill, ResumeParseLog
        t0 = time.time()

        try:
            resume = Resume.objects.get(id=resume_id)
            resume.status = ResumeStatus.PARSING
            resume.save(update_fields=['status'])

            # ── Step 1: Extract raw text ──────────────────────
            raw_text = self.file_extractor.extract(resume.file.path, resume.file_type)
            if not raw_text.strip():
                raise ValueError('Text extraction returned empty result.')
            resume.raw_text = raw_text
            resume.save(update_fields=['raw_text'])

            # ── Step 2: LLM parse ─────────────────────────────
            result = self.resume_parser.parse(raw_text, str(resume_id))
            if not result['success']:
                raise ValueError(f"LLM parse failed: {result.get('error')}")
            d = result['data']

            # ── Step 3: Update Resume fields ──────────────────
            resume.candidate_name          = d.get('candidate_name')     or resume.candidate_name
            resume.candidate_email         = d.get('candidate_email')    or resume.candidate_email
            resume.candidate_phone         = d.get('candidate_phone',    '')
            resume.candidate_location      = d.get('candidate_location', '')
            resume.candidate_linkedin      = d.get('candidate_linkedin', '')
            resume.candidate_github        = d.get('candidate_github',   '')
            resume.candidate_website       = d.get('candidate_website',  '')
            resume.total_experience_years  = float(d.get('total_experience_years') or 0)
            resume.highest_education       = d.get('highest_education', '') or ''
            resume.education_details       = d.get('education_details',  [])
            resume.experience_details      = d.get('experience_details', [])
            resume.extracted_skills        = d.get('skills',             [])
            resume.certifications          = d.get('certifications',     [])
            resume.languages               = d.get('languages',          [])
            resume.parsed_data             = d
            resume.status                  = ResumeStatus.PARSED
            resume.parsed_at               = timezone.now()
            resume.save()

            # ── Step 4: Create ResumeSkill rows ───────────────
            ResumeSkill.objects.filter(resume=resume).delete()
            skill_objs = []
            for s in d.get('skills', [])[:60]:
                name = (s.get('name', '') if isinstance(s, dict) else str(s)).strip()[:100]
                if name:
                    skill_objs.append(ResumeSkill(
                        resume      = resume,
                        name        = name,
                        category    = s.get('category', '')[:50]    if isinstance(s, dict) else '',
                        proficiency = s.get('proficiency', '')[:50] if isinstance(s, dict) else '',
                        years_used  = float(s.get('years_used') or 0) if isinstance(s, dict) else 0,
                    ))
            if skill_objs:
                ResumeSkill.objects.bulk_create(skill_objs, ignore_conflicts=True)

            # ── Step 5: Index in vector store ─────────────────
            self.vector_store.index_resume(
                resume_id = str(resume.id),
                text      = resume.get_text_for_embedding(),
                metadata  = {
                    'candidate_name':       resume.candidate_name,
                    'candidate_email':      resume.candidate_email,
                    'company_id':           str(resume.company_id),
                    'total_experience_years': resume.total_experience_years,
                    'highest_education':    resume.highest_education,
                },
            )
            resume.is_indexed = True
            resume.status     = ResumeStatus.INDEXED
            resume.save(update_fields=['is_indexed', 'status'])

            # ── Log ───────────────────────────────────────────
            ms = int((time.time() - t0) * 1000)
            ResumeParseLog.objects.create(
                resume             = resume,
                agent              = 'orchestrator',
                status             = 'success',
                message            = 'Parsed and indexed successfully.',
                processing_time_ms = ms,
                tokens_used        = result.get('tokens_used', 0),
            )
            logger.info(f'[Orchestrator] Resume {resume_id} parsed + indexed in {ms} ms')
            return True

        except Exception as exc:
            ms = int((time.time() - t0) * 1000)
            logger.error(f'[Orchestrator] parse_resume {resume_id} FAILED: {exc}')
            try:
                resume = Resume.objects.get(id=resume_id)
                resume.status      = Resume.status.field.choices  # keep enum reference clean
                resume.status      = 'failed'
                resume.parse_error = str(exc)
                resume.save(update_fields=['status', 'parse_error'])
                from apps.resumes.models import ResumeParseLog
                ResumeParseLog.objects.create(
                    resume             = resume,
                    agent              = 'orchestrator',
                    status             = 'error',
                    message            = str(exc),
                    processing_time_ms = ms,
                )
            except Exception:
                pass
            return False

    # ══════════════════════════════════════════════════════════════
    #  2. ANALYZE JOB DESCRIPTION
    # ══════════════════════════════════════════════════════════════

    def analyze_job(self, job_id: str) -> bool:
        """
        Analyze a JD and populate skills + analysis record.
        Returns True on success.
        """
        from apps.jobs.models import JobDescription, JobSkill, JobAnalysis, SkillImportance
        try:
            job     = JobDescription.objects.get(id=job_id)
            jd_text = job.get_full_text()

            result = self.jd_analyzer.analyze(str(job_id), job.title, jd_text)
            if not result['success']:
                return False
            d = result['data']

            # Update job fields
            job.extracted_skills   = d.get('extracted_skills', [])
            job.extracted_keywords = d.get('extracted_keywords', [])
            job.save(update_fields=['extracted_skills', 'extracted_keywords'])

            # Recreate JobSkill rows
            JobSkill.objects.filter(job=job).delete()
            skill_objs = []
            for s in d.get('extracted_skills', [])[:60]:
                if not isinstance(s, dict) or not s.get('name'):
                    continue
                importance = s.get('importance', 'required')
                if importance not in SkillImportance.values:
                    importance = 'required'
                skill_objs.append(JobSkill(
                    job            = job,
                    name           = s['name'][:100],
                    category       = s.get('category', '')[:50],
                    importance     = importance,
                    years_required = float(s.get('years_required') or 0),
                ))
            if skill_objs:
                JobSkill.objects.bulk_create(skill_objs, ignore_conflicts=True)

            # Create/update JobAnalysis
            tech = d.get('technical_stack', {})
            if isinstance(tech, dict):
                all_tech = []
                for v in tech.values():
                    all_tech.extend(v if isinstance(v, list) else [])
            else:
                all_tech = tech if isinstance(tech, list) else []

            JobAnalysis.objects.update_or_create(
                job=job,
                defaults={
                    'summary':                 d.get('experience_summary', ''),
                    'key_requirements':        d.get('key_requirements', ''),
                    'ideal_candidate_profile': d.get('ideal_candidate_profile', ''),
                    'technical_stack':         all_tech,
                    'soft_skills':             d.get('soft_skills', []),
                    'domain_knowledge':        d.get('domain_knowledge', []),
                    'red_flags':               d.get('red_flags', []),
                    'seniority_level':         d.get('seniority_level', ''),
                    'model_used':              settings.OPENAI_MODEL,
                },
            )

            # Index JD in vector store
            self.vector_store.index_job(
                job_id   = str(job.id),
                text     = jd_text,
                metadata = {
                    'title':            job.title,
                    'company_id':       str(job.company_id),
                    'experience_level': job.experience_level,
                },
            )
            job.embedding_id = str(job.id)
            job.save(update_fields=['embedding_id'])

            logger.info(f'[Orchestrator] Job {job_id} analyzed + indexed.')
            return True

        except Exception as exc:
            logger.error(f'[Orchestrator] analyze_job {job_id} FAILED: {exc}')
            return False

    # ══════════════════════════════════════════════════════════════
    #  3. SCREEN CANDIDATE
    # ══════════════════════════════════════════════════════════════

    def screen_candidate(self, result_id: str) -> bool:
        """
        Full screening pipeline for one ScreeningResult row.
        Returns True on success.
        """
        from apps.screening.models import ScreeningResult, ScreeningStatus
        from apps.jobs.models import JobSkill
        t0 = time.time()

        try:
            result = ScreeningResult.objects.select_related(
                'resume', 'job', 'session'
            ).get(id=result_id)

            result.status = ScreeningStatus.PROCESSING
            result.save(update_fields=['status'])

            resume  = result.resume
            job     = result.job
            session = result.session

            if not resume.raw_text:
                raise ValueError(f'Resume {resume.id} has not been parsed yet.')

            jd_text   = job.get_full_text()
            job_skills = list(JobSkill.objects.filter(job=job).values(
                'name', 'importance', 'years_required', 'category'
            ))

            # ── Step 1: RAG — semantic similarity ─────────────
            semantic_sim = self.vector_store.resume_similarity(str(resume.id), jd_text)

            # ── Step 2: Skill matching ─────────────────────────
            skill_res = self.skill_matcher.score(
                candidate_skills = resume.extracted_skills or [],
                job_skills       = job_skills,
            )

            # ── Step 3: Experience scoring ────────────────────
            exp_res = self.exp_scorer.score(
                candidate_years    = resume.total_experience_years or 0,
                experience_details = resume.experience_details or [],
                min_years_required = job.min_experience_years or 0,
                max_years_required = job.max_experience_years,
                jd_text            = jd_text,
            )

            # ── Step 4: Education scoring ─────────────────────
            edu_res = self.edu_scorer.score(
                candidate_education = resume.highest_education or '',
                jd_education_req    = job.education_requirement or 'any',
            )

            # ── Step 5: Weighted overall score ────────────────
            w            = job.score_weights
            skill_score  = skill_res['skill_score']
            exp_score    = exp_res['experience_score']
            edu_score    = edu_res['education_score']

            # fit_score blends RAG similarity with rule-based signals
            fit_score = (semantic_sim * 100 * 0.6) + (
                (skill_score * 0.3 + exp_score * 0.5 + edu_score * 0.2) * 0.4
            )

            overall_score = (
                skill_score * w['skills'] +
                exp_score   * w['experience'] +
                edu_score   * w['education'] +
                fit_score   * w['fit']
            )

            # ── Step 6: LLM explanation ────────────────────────
            exp_data = {
                'name':           resume.candidate_name,
                'exp_years':      resume.total_experience_years or 0,
                'education':      resume.highest_education or 'unknown',
                'overall_score':  overall_score,
                'skill_score':    skill_score,
                'exp_score':      exp_score,
                'edu_score':      edu_score,
                'similarity':     semantic_sim,
                'must_have_met':  skill_res['must_have_skills_met'],
                'matched_skills': skill_res['matched_skills'],
                'missing_skills': skill_res['missing_skills'],
                'bonus_skills':   skill_res['bonus_skills'],
                'job_title':      job.title,
                'min_exp_years':  job.min_experience_years or 0,
                'jd_requirements': job.requirements,
            }
            expl_result  = self.explanation.generate(exp_data, str(result_id))
            expl_data    = expl_result.get('data', {})
            tokens_used  = expl_result.get('tokens_used', 0)

            raw_decision = expl_data.get('decision', 'maybe').lower()
            ai_decision  = DECISION_MAP.get(raw_decision, 'maybe')

            # ── Step 7: Save ──────────────────────────────────
            ms = int((time.time() - t0) * 1000)
            result.overall_score       = round(overall_score, 2)
            result.skill_score         = round(skill_score, 2)
            result.experience_score    = round(exp_score, 2)
            result.education_score     = round(edu_score, 2)
            result.fit_score           = round(fit_score, 2)
            result.semantic_similarity = round(semantic_sim, 4)

            result.matched_skills       = skill_res['matched_skills']
            result.missing_skills       = skill_res['missing_skills']
            result.bonus_skills         = skill_res['bonus_skills']
            result.must_have_skills_met = skill_res['must_have_skills_met']

            result.years_of_experience     = resume.total_experience_years or 0
            result.experience_gap_years    = exp_res['experience_gap_years']
            result.relevant_experience_pct = exp_res['relevant_experience_pct']

            result.education_match = edu_res['education_match']
            result.education_level = resume.highest_education or ''

            result.strengths           = expl_data.get('strengths',           [])
            result.weaknesses          = expl_data.get('weaknesses',          [])
            result.explanation         = expl_data.get('explanation',         '')
            result.recommendation      = expl_data.get('recommendation',      '')
            result.interview_questions = expl_data.get('interview_questions', [])
            result.red_flags           = expl_data.get('red_flags',           [])
            result.growth_potential    = expl_data.get('growth_potential',    '')

            result.ai_decision         = ai_decision
            result.model_used          = settings.OPENAI_MODEL
            result.tokens_used         = tokens_used
            result.processing_time_ms  = ms
            result.status              = ScreeningStatus.COMPLETED
            result.save()

            logger.info(
                f'[Orchestrator] Screened {resume.candidate_name} → {job.title}: '
                f'{overall_score:.1f}/100 ({ai_decision}) in {ms} ms'
            )
            return True

        except Exception as exc:
            ms = int((time.time() - t0) * 1000)
            logger.error(f'[Orchestrator] screen_candidate {result_id} FAILED: {exc}')
            try:
                result = ScreeningResult.objects.get(id=result_id)
                result.status        = ScreeningStatus.FAILED
                result.error_message = str(exc)
                result.save(update_fields=['status', 'error_message'])
            except Exception:
                pass
            return False