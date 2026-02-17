"""
Transcription tasks using Whisper.
"""

import os
import json
from typing import List, Dict, Any
from datetime import datetime

import time
import whisper
import httpx
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from tasks.celery_app import celery_app

# GLM API config
GLM_API_KEY = os.environ.get("GLM_API_KEY", "")
GLM_API_BASE = os.environ.get("GLM_API_BASE", "https://open.bigmodel.cn/api/paas/v4")
GLM_MODEL = os.environ.get("GLM_MODEL", "glm-4.5-air")  # glm-4.5-air is cheapest/fastest

# Database connection
DATABASE_URL = "postgresql://{user}:{password}@{host}:{port}/{db}".format(
    user=os.environ.get("POSTGRES_USER", "ci_user"),
    password=os.environ.get("POSTGRES_PASSWORD", "change_me"),
    host=os.environ.get("POSTGRES_HOST", "postgres"),
    port=os.environ.get("POSTGRES_PORT", "5432"),
    db=os.environ.get("POSTGRES_DB", "customer_intelligence"),
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Whisper model (loaded once)
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "small")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")

_whisper_model = None


def get_whisper_model():
    """Lazy load Whisper model."""
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper model: {WHISPER_MODEL} on {WHISPER_DEVICE}")
        _whisper_model = whisper.load_model(WHISPER_MODEL, device=WHISPER_DEVICE)
    return _whisper_model


def update_call_status(call_id: str, status: str, error: str = None, progress: int = None):
    """Update call processing status in database."""
    with SessionLocal() as session:
        if error:
            session.execute(
                text("""
                    UPDATE calls 
                    SET processing_status = :status, 
                        processing_error = :error,
                        updated_at = NOW()
                    WHERE id = :call_id
                """),
                {"call_id": call_id, "status": status, "error": error}
            )
        elif progress is not None:
            session.execute(
                text("""
                    UPDATE calls 
                    SET processing_status = :status,
                        processing_progress = :progress,
                        updated_at = NOW()
                    WHERE id = :call_id
                """),
                {"call_id": call_id, "status": status, "progress": progress}
            )
        else:
            session.execute(
                text("""
                    UPDATE calls 
                    SET processing_status = :status,
                        updated_at = NOW()
                    WHERE id = :call_id
                """),
                {"call_id": call_id, "status": status}
            )
        session.commit()


def save_transcription(
    call_id: str,
    transcript: str,
    transcript_with_speakers: List[Dict],
    summary: str,
    key_points: List[str],
    action_items: List[str],
    duration: int,
):
    """Save transcription results to database."""
    with SessionLocal() as session:
        session.execute(
            text("""
                UPDATE calls 
                SET transcript = :transcript,
                    transcript_with_speakers = :transcript_with_speakers,
                    summary = :summary,
                    key_points = :key_points,
                    action_items = :action_items,
                    duration = :duration,
                    processing_status = 'completed',

                    updated_at = NOW()
                WHERE id = :call_id
            """),
            {
                "call_id": call_id,
                "transcript": transcript,
                "transcript_with_speakers": json.dumps(transcript_with_speakers),
                "summary": summary,
                "key_points": json.dumps(key_points),
                "action_items": json.dumps(action_items),
                "duration": duration,
            }
        )
        session.commit()


def generate_summary_glm(transcript: str) -> Dict[str, Any]:
    """Generate summary via GLM API (synchronous)."""
    if not GLM_API_KEY:
        return {
            "summary": "GLM API ключ не настроен. Добавьте GLM_API_KEY в .env",
            "key_points": [],
            "action_items": [],
        }
    
    prompt = f"""Проанализируй транскрипт созвона и создай структурированное саммари.

ТРАНСКРИПТ:
{transcript[:10000]}

---

Ответь строго в следующем формате:

САММАРИ:
[Краткое описание в 2-3 предложениях]

КЛЮЧЕВЫЕ ПУНКТЫ:
- [пункт 1]
- [пункт 2]

ЗАДАЧИ:
- [задача 1]
- [задача 2]"""

    try:
        # Retry up to 3 times with backoff for rate limits
        response = None
        last_error = None
        for attempt in range(3):
            try:
                response = httpx.post(
                    f"{GLM_API_BASE}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GLM_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": GLM_MODEL,
                        "messages": [
                            {"role": "system", "content": "You are an assistant for analyzing business calls. Respond in Russian."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1500,
                    },
                    timeout=60.0,
                )
                response.raise_for_status()
                last_error = None
                break
            except httpx.HTTPStatusError as e:
                last_error = e
                if e.response.status_code == 429:
                    wait_time = 15 * (attempt + 1)  # 15s, 30s, 45s
                    print(f"GLM rate limit hit, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                raise
        
        if last_error:
            raise last_error
        
        text_response = response.json()["choices"][0]["message"]["content"]
        
        # Parse sections
        summary = ""
        key_points = []
        action_items = []
        current_section = None
        
        for line in text_response.split("\n"):
            line = line.strip()
            if line.startswith("САММАРИ:"):
                current_section = "summary"
                continue
            elif line.startswith("КЛЮЧЕВЫЕ ПУНКТЫ:"):
                current_section = "key_points"
                continue
            elif line.startswith("ЗАДАЧИ:") or line.startswith("ЗАДАЧИ/ДОГОВОРЁННОСТИ:"):
                current_section = "action_items"
                continue
            
            if current_section == "summary" and line:
                summary += line + " "
            elif current_section == "key_points" and line.startswith("-"):
                key_points.append(line[1:].strip())
            elif current_section == "action_items" and line.startswith("-"):
                action_items.append(line[1:].strip())
        
        return {
            "summary": summary.strip() or text_response,
            "key_points": key_points,
            "action_items": action_items,
        }
    except Exception as e:
        print(f"GLM API error: {e}")
        return {
            "summary": f"Ошибка генерации саммари: {str(e)}",
            "key_points": [],
            "action_items": [],
        }


@celery_app.task(bind=True, name="tasks.transcribe.process_audio")
def process_audio(self, call_id: str, audio_path: str):
    """
    Main transcription task.
    
    1. Transcribe audio using Whisper
    2. (Optional) Perform speaker diarization
    3. Generate summary using GLM
    4. Save results to database
    """
    print(f"Starting transcription for call {call_id}")
    
    try:
        # Update status to processing
        update_call_status(call_id, "processing")
        
        # Check if file exists
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # Load Whisper model
        model = get_whisper_model()
        
        # Transcribe with progress tracking
        print(f"Transcribing {audio_path}...")
        
        # Progress callback via tqdm hook
        _last_progress = [0]
        
        class ProgressHook:
            """Intercept tqdm to write progress to DB."""
            def __init__(self, call_id):
                self.call_id = call_id
                self.total = None
                self.n = 0
            
            def __call__(self, iterable=None, **kwargs):
                """Called by whisper's tqdm wrapper."""
                import tqdm as tqdm_module
                orig = tqdm_module.tqdm
                call_id = self.call_id
                
                class TrackedTqdm(orig):
                    def update(self, n=1):
                        super().update(n)
                        if self.total and self.total > 0:
                            pct = min(99, int(self.n * 100 / self.total))
                            if pct > _last_progress[0] + 4:  # update every 5%
                                _last_progress[0] = pct
                                update_call_status(call_id, "processing", progress=pct)
                
                return TrackedTqdm(iterable, **kwargs)
        
        # Patch tqdm in whisper module for progress tracking
        import whisper.transcribe as _wt
        import tqdm as _tqdm
        _orig_tqdm = _wt.tqdm
        
        _call_id_ref = call_id
        _last_pct = [0]
        
        class _PatchedTqdm(_tqdm.tqdm):
            def update(self, n=1):
                super().update(n)
                if self.total and self.total > 0:
                    pct = min(99, int(self.n * 100 / self.total))
                    if pct >= _last_pct[0] + 5:
                        _last_pct[0] = pct
                        try:
                            update_call_status(_call_id_ref, "processing", progress=pct)
                        except Exception:
                            pass
        
        _wt.tqdm = _PatchedTqdm
        try:
            result = model.transcribe(
                audio_path,
                language="ru",  # Russian
                task="transcribe",
                verbose=False,
            )
        finally:
            _wt.tqdm = _orig_tqdm  # Restore original tqdm
        
        # Extract transcript
        transcript = result["text"]
        segments = result.get("segments", [])
        
        # Calculate duration from segments
        duration = 0
        if segments:
            duration = int(segments[-1].get("end", 0))
        
        # Format segments with timestamps
        transcript_with_speakers = []
        for seg in segments:
            transcript_with_speakers.append({
                "speaker": "Speaker",  # Basic - no diarization yet
                "text": seg.get("text", "").strip(),
                "start": seg.get("start", 0),
                "end": seg.get("end", 0),
            })
        
        print(f"Transcription complete: {len(transcript)} chars, {duration}s")
        
        # Generate summary via GLM API
        print(f"Generating summary via GLM for call {call_id}...")
        llm_result = generate_summary_glm(transcript)
        summary = llm_result["summary"]
        key_points = llm_result["key_points"]
        action_items = llm_result["action_items"]
        print(f"Summary generated: {len(summary)} chars")
        
        # Save to database
        save_transcription(
            call_id=call_id,
            transcript=transcript,
            transcript_with_speakers=transcript_with_speakers,
            summary=summary,
            key_points=key_points,
            action_items=action_items,
            duration=duration,
        )
        
        print(f"Transcription saved for call {call_id}")
        return {"status": "completed", "duration": duration}
        
    except Exception as e:
        error_msg = str(e)
        print(f"Transcription failed for call {call_id}: {error_msg}")
        update_call_status(call_id, "failed", error_msg)
        raise


@celery_app.task(name="tasks.transcribe.check_pending")
def check_pending_calls():
    """
    Periodic task to check for pending transcriptions.
    Runs every minute via Celery Beat.
    """
    with SessionLocal() as session:
        result = session.execute(
            text("""
                SELECT id, audio_filename 
                FROM calls 
                WHERE processing_status = 'pending' 
                  AND audio_filename IS NOT NULL
                ORDER BY created_at ASC
                LIMIT 5
            """)
        )
        pending = result.fetchall()
        
        for row in pending:
            call_id = str(row.id)
            audio_filename = row.audio_filename
            audio_path = f"/app/audio/{audio_filename}"
            
            print(f"Queuing transcription for call {call_id}")
            process_audio.delay(call_id, audio_path)
    
    return {"checked": len(pending) if pending else 0}
