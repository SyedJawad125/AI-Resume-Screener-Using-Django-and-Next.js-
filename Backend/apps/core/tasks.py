"""
Celery Tasks
────────────
parse_resume_task           → single resume parse
bulk_parse_resumes_task     → batch parse (called after bulk upload)
analyze_job_description_task → JD analysis
run_screening_session_task  → full session orchestration
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════
#  Resume Tasks
# ══════════════════════════════════════════════════════════════════

@shared_task(
    bind=True,
    name='core.tasks.parse_resume',
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def parse_resume_task(self, resume_id: str) -> dict:
    """Parse a single resume — called immediately after upload."""
    logger.info(f'[Task] parse_resume_task → {resume_id}')
    try:
        from core.agents.orchestrator import ScreeningOrchestrator
        success = ScreeningOrchestrator().parse_resume(resume_id)
        if not success:
            raise RuntimeError(f'parse_resume returned False for {resume_id}')
        return {'status': 'success', 'resume_id': resume_id}
    except Exception as exc:
        logger.error(f'[Task] parse_resume_task FAILED for {resume_id}: {exc}')
        raise self.retry(exc=exc)


@shared_task(
    bind=True,
    name='core.tasks.bulk_parse_resumes',
    acks_late=True,
)
def bulk_parse_resumes_task(self, resume_ids: list[str], bulk_session_id: str) -> dict:
    """
    Parse a batch of resumes sequentially.
    Updates BulkResumeUpload progress after each resume.
    """
    logger.info(f'[Task] bulk_parse_resumes_task — {len(resume_ids)} resumes, session {bulk_session_id}')
    from apps.resumes.models import BulkResumeUpload
    from core.agents.orchestrator import ScreeningOrchestrator

    try:
        session = BulkResumeUpload.objects.get(id=bulk_session_id)
        session.status = 'processing'
        session.save(update_fields=['status'])
    except BulkResumeUpload.DoesNotExist:
        logger.error(f'BulkResumeUpload {bulk_session_id} not found')
        return {'status': 'error', 'reason': 'session not found'}

    orchestrator = ScreeningOrchestrator()
    ok = fail = 0

    for rid in resume_ids:
        try:
            if orchestrator.parse_resume(rid):
                ok += 1
            else:
                fail += 1
        except Exception as e:
            fail += 1
            logger.error(f'[Task] parse error for resume {rid}: {e}')
        finally:
            session.processed_files = ok + fail
            session.failed_files    = fail
            session.save(update_fields=['processed_files', 'failed_files'])

    session.status       = 'completed'
    session.completed_at = timezone.now()
    session.save(update_fields=['status', 'completed_at'])

    logger.info(f'[Task] bulk_parse done — {ok} ok, {fail} failed')
    return {'status': 'completed', 'success': ok, 'failed': fail}


# ══════════════════════════════════════════════════════════════════
#  JD Task
# ══════════════════════════════════════════════════════════════════

@shared_task(
    bind=True,
    name='core.tasks.analyze_job_description',
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def analyze_job_description_task(self, job_id: str) -> dict:
    """Analyze a JD — triggered from jobs/analyze/ endpoint."""
    logger.info(f'[Task] analyze_job_description_task → {job_id}')
    try:
        from core.agents.orchestrator import ScreeningOrchestrator
        success = ScreeningOrchestrator().analyze_job(job_id)
        if not success:
            raise RuntimeError(f'analyze_job returned False for {job_id}')
        return {'status': 'success', 'job_id': job_id}
    except Exception as exc:
        logger.error(f'[Task] analyze_job_description_task FAILED for {job_id}: {exc}')
        raise self.retry(exc=exc)


# ══════════════════════════════════════════════════════════════════
#  Screening Task
# ══════════════════════════════════════════════════════════════════

@shared_task(
    bind=True,
    name='core.tasks.run_screening_session',
    acks_late=True,
)
def run_screening_session_task(self, session_id: str) -> dict:
    """
    Runs the complete screening session:
      1. Ensures JD is analyzed
      2. Screens every PENDING result row
      3. Ranks candidates
      4. Marks session COMPLETED
    """
    logger.info(f'[Task] run_screening_session_task → {session_id}')
    from apps.screening.models import ScreeningSession, ScreeningResult, ScreeningStatus
    from core.agents.orchestrator import ScreeningOrchestrator

    try:
        session = ScreeningSession.objects.get(id=session_id)
    except ScreeningSession.DoesNotExist:
        logger.error(f'ScreeningSession {session_id} not found')
        return {'status': 'error', 'reason': 'session not found'}

    # ── Mark as processing ───────────────────────────────
    session.status     = ScreeningStatus.PROCESSING
    session.started_at = timezone.now()
    session.save(update_fields=['status', 'started_at'])

    orchestrator = ScreeningOrchestrator()

    # ── Ensure JD is analyzed ────────────────────────────
    job = session.job
    if not job.extracted_skills:
        logger.info(f'[Task] JD {job.id} not yet analyzed — running JD analyzer first')
        orchestrator.analyze_job(str(job.id))

    # ── Screen each pending result ───────────────────────
    pending = ScreeningResult.objects.filter(session=session, status=ScreeningStatus.PENDING)
    total_tokens = 0

    for result in pending:
        success = orchestrator.screen_candidate(str(result.id))
        session.refresh_from_db()
        session.processed_count += 1
        if not success:
            session.failed_count += 1
        session.save(update_fields=['processed_count', 'failed_count'])
        try:
            result.refresh_from_db()
            total_tokens += result.tokens_used
        except Exception:
            pass

    # ── Rank completed results ───────────────────────────
    _rank_session_candidates(session_id)

    # ── Mark session complete ────────────────────────────
    session.status            = ScreeningStatus.COMPLETED
    session.completed_at      = timezone.now()
    session.total_tokens_used = total_tokens
    # Cost estimate: GPT-4o ~$0.005 / 1K tokens (blended in/out)
    session.total_cost_usd    = round(total_tokens * 0.000005, 6)
    session.save(update_fields=[
        'status', 'completed_at', 'total_tokens_used', 'total_cost_usd'
    ])

    logger.info(
        f'[Task] Session {session_id} COMPLETED — '
        f'{session.processed_count} screened, {session.failed_count} failed, '
        f'{total_tokens} tokens used.'
    )
    return {
        'status':    'completed',
        'session_id': session_id,
        'processed': session.processed_count,
        'failed':    session.failed_count,
        'tokens':    total_tokens,
    }


# ── Helper ────────────────────────────────────────────────────────

def _rank_session_candidates(session_id: str) -> None:
    """Assign rank 1..N by descending overall_score within a session."""
    from apps.screening.models import ScreeningResult, ScreeningStatus
    results = (
        ScreeningResult.objects
        .filter(session_id=session_id, status=ScreeningStatus.COMPLETED)
        .order_by('-overall_score')
    )
    for rank, r in enumerate(results, start=1):
        r.rank = rank
        r.save(update_fields=['rank'])