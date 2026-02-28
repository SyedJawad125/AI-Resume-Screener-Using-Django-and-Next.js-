"""
Scoring Agents (rule-based, no LLM calls — fast & deterministic)
────────────────────────────────────────────────────────────────
  • SkillMatcherAgent      → skill_score (0-100)
  • ExperienceScorerAgent  → experience_score (0-100)
  • EducationScorerAgent   → education_score (0-100)
"""
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════
#  1. Skill Matcher
# ══════════════════════════════════════════════════════════════════

class SkillMatcherAgent:
    """
    Weighted fuzzy skill matching.

    Weights by importance:
        must_have    → 3.0
        required     → 2.0
        preferred    → 1.0
        nice_to_have → 0.5

    Scoring:
        base_score = matched_weight / total_weight * 100
        bonus      = min(5, len(bonus_skills) * 0.5)
        penalty    = 30 % reduction if any must_have is missing
    """

    IMPORTANCE_WEIGHT = {
        'must_have':    3.0,
        'required':     2.0,
        'preferred':    1.0,
        'nice_to_have': 0.5,
    }

    # Common abbreviations → full names
    ALIASES = {
        'js': 'javascript', 'ts': 'typescript', 'py': 'python',
        'ml': 'machine learning', 'ai': 'artificial intelligence',
        'nlp': 'natural language processing', 'dl': 'deep learning',
        'k8s': 'kubernetes', 'dbs': 'databases', 'oop': 'object oriented',
    }

    def score(self, candidate_skills: list, job_skills: list) -> dict:
        """
        candidate_skills: list of dicts {'name': ..., ...} or plain strings
        job_skills:       list of dicts {'name', 'importance', 'years_required'}
        """
        t0 = time.time()

        # Build flat set of candidate skill names (lower-cased)
        cand_set = set()
        for s in candidate_skills:
            name = (s.get('name', '') if isinstance(s, dict) else str(s)).lower().strip()
            if name:
                cand_set.add(name)
                cand_set.add(self.ALIASES.get(name, name))  # also add alias expansion

        matched_skills  = []
        missing_skills  = []
        total_weight    = 0.0
        matched_weight  = 0.0
        must_have_total = 0
        must_have_met   = 0

        for js in job_skills:
            jname      = js.get('name', '').lower().strip()
            importance = js.get('importance', 'required')
            weight     = self.IMPORTANCE_WEIGHT.get(importance, 1.0)
            total_weight += weight

            if importance == 'must_have':
                must_have_total += 1

            is_match = self._matches(jname, cand_set)

            if is_match:
                matched_weight += weight
                matched_skills.append({'name': js['name'], 'importance': importance})
                if importance == 'must_have':
                    must_have_met += 1
            else:
                missing_skills.append({
                    'name':        js['name'],
                    'importance':  importance,
                    'is_critical': importance in ('must_have', 'required'),
                })

        # Bonus skills (candidate has extra skills not in JD)
        jd_names   = {js.get('name', '').lower().strip() for js in job_skills}
        bonus_list = [n for n in cand_set if n and not self._matches(n, jd_names)][:15]

        # Calculate score
        if total_weight > 0:
            base = matched_weight / total_weight * 100
        else:
            base = 85.0  # no specific requirements → assume decent fit

        bonus         = min(5.0, len(bonus_list) * 0.5)
        skill_score   = min(100.0, base + bonus)
        all_must_met  = (must_have_total == 0) or (must_have_met == must_have_total)

        if not all_must_met:
            skill_score *= 0.7   # 30 % penalty for missing must-have skills

        return {
            'skill_score':           round(skill_score, 2),
            'matched_skills':        matched_skills,
            'missing_skills':        missing_skills,
            'bonus_skills':          bonus_list,
            'must_have_skills_met':  all_must_met,
            'processing_time_ms':    int((time.time() - t0) * 1000),
        }

    def _matches(self, skill_name: str, skill_set: set) -> bool:
        """Exact match, alias match, or substring match (length > 3)."""
        if skill_name in skill_set:
            return True
        expanded = self.ALIASES.get(skill_name, skill_name)
        if expanded in skill_set:
            return True
        # Substring match (e.g. 'react' matches 'react.js')
        if len(skill_name) > 3:
            return any(
                (skill_name in cs or cs in skill_name)
                for cs in skill_set
                if len(cs) > 3
            )
        return False


# ══════════════════════════════════════════════════════════════════
#  2. Experience Scorer
# ══════════════════════════════════════════════════════════════════

class ExperienceScorerAgent:
    """
    Scores experience in two parts:
        years_score     (60%) — how candidate's years compare to JD's requirement
        relevance_score (40%) — keyword overlap between their work history and JD text
    """

    def score(
        self,
        candidate_years:     float,
        experience_details:  list,
        min_years_required:  float,
        max_years_required:  Optional[float],
        jd_text:             str,
    ) -> dict:
        t0 = time.time()

        # ── Years score ──────────────────────────────────────
        if min_years_required <= 0:
            years_score    = 100.0
            experience_gap = 0.0
        elif candidate_years >= min_years_required:
            overqualified  = max_years_required and candidate_years > max_years_required * 1.5
            years_score    = 85.0 if overqualified else 100.0
            experience_gap = 0.0
        else:
            experience_gap = min_years_required - candidate_years
            years_score    = max(0.0, candidate_years / min_years_required * 100)

        # ── Relevance score ──────────────────────────────────
        relevance = self._relevance(experience_details, jd_text)

        experience_score = years_score * 0.6 + relevance * 0.4

        return {
            'experience_score':       round(experience_score, 2),
            'years_of_experience':    candidate_years,
            'experience_gap_years':   round(experience_gap, 1),
            'relevant_experience_pct': round(relevance, 2),
            'processing_time_ms':     int((time.time() - t0) * 1000),
        }

    def _relevance(self, experience_details: list, jd_text: str) -> float:
        if not experience_details or not jd_text:
            return 50.0
        jd_words = set(jd_text.lower().split())
        scores   = []
        for exp in experience_details:
            blob = ' '.join([
                str(exp.get('title', '')),
                str(exp.get('description', '')),
                ' '.join(str(t) for t in exp.get('technologies', [])),
            ]).lower()
            exp_words = set(blob.split())
            if not exp_words:
                continue
            overlap = len(jd_words & exp_words)
            scores.append(min(100.0, overlap / max(len(jd_words), 1) * 300))
        return min(100.0, sum(scores) / len(scores)) if scores else 50.0


# ══════════════════════════════════════════════════════════════════
#  3. Education Scorer
# ══════════════════════════════════════════════════════════════════

class EducationScorerAgent:
    """
    Compares candidate education level against the JD requirement.
    Higher education than required → 100.
    One level below → 70.
    Two+ levels below → 40.
    """

    LEVEL_ORDER = {
        'high_school': 1,
        'associate':   2,
        'bachelor':    3,
        'mba':         4,
        'master':      4,
        'phd':         5,
        'other':       2,
        '':            0,
    }

    # Maps keywords in jd education_requirement to canonical levels
    KEYWORD_MAP = {
        'high school': 'high_school', 'associate': 'associate',
        "bachelor":    'bachelor',    "bachelor's": 'bachelor',
        "master":      'master',      "master's":   'master',
        'mba':         'mba',
        'phd':         'phd',         'doctorate':  'phd',
        'any':         None,          '':           None,
    }

    def score(
        self,
        candidate_education: str,
        jd_education_req:    str,
    ) -> dict:
        req_level = self._parse_req(jd_education_req or '')

        if req_level is None:
            # No education requirement
            return {'education_score': 90.0, 'education_match': True,
                    'education_level': candidate_education}

        cand_lvl = self.LEVEL_ORDER.get(candidate_education, 0)
        req_lvl  = self.LEVEL_ORDER.get(req_level, 3)

        if cand_lvl >= req_lvl:
            edu_score = 100.0
            match     = True
        elif cand_lvl == req_lvl - 1:
            edu_score = 70.0
            match     = False
        else:
            edu_score = 40.0
            match     = False

        return {
            'education_score': edu_score,
            'education_match': match,
            'education_level': candidate_education,
        }

    def _parse_req(self, req_text: str) -> Optional[str]:
        lower = req_text.lower().strip()
        for keyword, level in self.KEYWORD_MAP.items():
            if keyword and keyword in lower:
                return level
        return None