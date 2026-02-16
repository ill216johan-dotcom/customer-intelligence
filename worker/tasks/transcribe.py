"""
Transcription tasks using Whisper.
"""

import os
import json
from typing import List, Dict, Any
from datetime import datetime

import whisper
import httpx
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from tasks.celery_app import celery_app

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
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "large-v3")
WHISPER_DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")

_whisper_model = None


def get_whisper_model():
    """Lazy load Whisper model."""
    global _whisper_model
    if _whisper_model is None:
        print(f"Loading Whisper model: {WHISPER_MODEL} on {WHISPER_DEVICE}")
        _whisper_model = whisper.load_model(WHISPER_MODEL, device=WHISPER_DEVICE)
    return _whisper_model


def update_call_status(call_id: str, status: str, error: str = None):
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


async def generate_summary_via_api(transcript: str) -> Dict[str, Any]:
    """Call backend API to generate summary using GLM."""
    # This would call the backend's LLM service
    # For now, return placeholder
    return {
        "summary": "Саммари будет сгенерировано после настройки GLM API",
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
        
        # Transcribe
        print(f"Transcribing {audio_path}...")
        result = model.transcribe(
            audio_path,
            language="ru",  # Russian
            task="transcribe",
            verbose=False,
        )
        
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
        
        # Generate summary (placeholder for now)
        # In production, this would call the GLM API
        summary = f"Транскрипция созвона длительностью {duration // 60} минут. Для генерации саммари настройте GLM API."
        key_points = []
        action_items = []
        
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
