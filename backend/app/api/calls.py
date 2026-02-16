"""
Calls API endpoints.
"""

import os
import uuid as uuid_module
from datetime import datetime
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Call, CallSource, Customer
from app.api.auth import get_current_user, User
from app.config import settings

router = APIRouter()


# ==========================================
# Schemas
# ==========================================

class SpeakerSegment(BaseModel):
    speaker: str
    text: str
    start: float
    end: float


class CallCreate(BaseModel):
    customer_id: Optional[UUID] = None
    source: CallSource = CallSource.MANUAL
    title: Optional[str] = None
    meeting_id: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    participants: Optional[List[dict]] = []


class CallResponse(BaseModel):
    id: UUID
    customer_id: Optional[UUID]
    source: CallSource
    title: Optional[str]
    meeting_id: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    duration: Optional[int]
    participants: Optional[List[dict]]
    transcript: Optional[str]
    transcript_with_speakers: Optional[List[SpeakerSegment]]
    summary: Optional[str]
    key_points: Optional[List[str]]
    action_items: Optional[List[str]]
    audio_url: Optional[str]
    audio_filename: Optional[str]
    processing_status: str
    processing_error: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CallListItem(BaseModel):
    id: UUID
    customer_id: Optional[UUID]
    customer_name: Optional[str] = None
    source: CallSource
    title: Optional[str]
    started_at: datetime
    duration: Optional[int]
    processing_status: str
    has_summary: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class TranscriptionStatus(BaseModel):
    call_id: UUID
    status: str
    progress: Optional[int] = None
    error: Optional[str] = None


# ==========================================
# Endpoints
# ==========================================

@router.get("", response_model=List[CallListItem])
async def list_calls(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    customer_id: Optional[UUID] = Query(None, description="Filter by customer"),
    source: Optional[CallSource] = Query(None, description="Filter by source"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all calls with filtering."""
    query = select(Call).order_by(Call.started_at.desc())
    
    if customer_id:
        query = query.where(Call.customer_id == customer_id)
    if source:
        query = query.where(Call.source == source)
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    calls = result.scalars().all()
    
    # Get customer names
    call_list = []
    for call in calls:
        customer_name = None
        if call.customer_id:
            customer_result = await db.execute(
                select(Customer.name).where(Customer.id == call.customer_id)
            )
            customer_name = customer_result.scalar()
        
        call_list.append(CallListItem(
            id=call.id,
            customer_id=call.customer_id,
            customer_name=customer_name,
            source=call.source,
            title=call.title,
            started_at=call.started_at,
            duration=call.duration,
            processing_status=call.processing_status,
            has_summary=bool(call.summary),
            created_at=call.created_at,
        ))
    
    return call_list


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get call details with transcript and summary."""
    result = await db.execute(
        select(Call).where(Call.id == call_id)
    )
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    return call


@router.post("", response_model=CallResponse)
async def create_call(
    data: CallCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new call record."""
    # Calculate duration if both times provided
    duration = None
    if data.started_at and data.ended_at:
        duration = int((data.ended_at - data.started_at).total_seconds())
    
    call = Call(
        **data.model_dump(),
        duration=duration,
        processing_status="pending",
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)
    return call


@router.post("/upload", response_model=CallResponse)
async def upload_audio(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(..., description="Audio file (mp3, wav, webm, mp4)"),
    customer_id: Optional[UUID] = Form(None),
    title: Optional[str] = Form(None),
    started_at: Optional[datetime] = Form(None),
):
    """Upload audio file for transcription."""
    # Validate file type
    allowed_types = ["audio/mpeg", "audio/wav", "audio/webm", "video/webm", "audio/mp4", "video/mp4"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: mp3, wav, webm, mp4"
        )
    
    # Generate filename
    ext = file.filename.split(".")[-1] if file.filename else "webm"
    filename = f"{uuid_module.uuid4()}.{ext}"
    filepath = os.path.join(settings.audio_dir, filename)
    
    # Save file
    os.makedirs(settings.audio_dir, exist_ok=True)
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create call record
    call = Call(
        customer_id=customer_id,
        source=CallSource.MANUAL,
        title=title or file.filename,
        started_at=started_at or datetime.utcnow(),
        audio_filename=filename,
        audio_url=f"/audio/{filename}",
        processing_status="pending",
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)
    
    # Queue transcription task (Celery)
    # background_tasks.add_task(process_transcription, str(call.id), filepath)
    
    # For now, just mark as pending (worker will pick it up)
    return call


@router.get("/{call_id}/status", response_model=TranscriptionStatus)
async def get_transcription_status(
    call_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transcription processing status."""
    result = await db.execute(
        select(Call.processing_status, Call.processing_error)
        .where(Call.id == call_id)
    )
    row = result.one_or_none()
    
    if not row:
        raise HTTPException(status_code=404, detail="Call not found")
    
    status, error = row
    
    return TranscriptionStatus(
        call_id=call_id,
        status=status,
        error=error,
    )


@router.post("/{call_id}/reprocess")
async def reprocess_call(
    call_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reprocess a failed transcription."""
    result = await db.execute(
        select(Call).where(Call.id == call_id)
    )
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if not call.audio_filename:
        raise HTTPException(status_code=400, detail="No audio file to process")
    
    # Reset status
    call.processing_status = "pending"
    call.processing_error = None
    await db.commit()
    
    return {"message": "Reprocessing queued", "call_id": call_id}


@router.put("/{call_id}/customer")
async def assign_customer(
    call_id: UUID,
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a call to a customer."""
    # Verify call exists
    call_result = await db.execute(
        select(Call).where(Call.id == call_id)
    )
    call = call_result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer.id).where(Customer.id == customer_id)
    )
    if not customer_result.scalar():
        raise HTTPException(status_code=404, detail="Customer not found")
    
    call.customer_id = customer_id
    await db.commit()
    
    return {"message": "Customer assigned", "call_id": call_id, "customer_id": customer_id}


@router.delete("/{call_id}")
async def delete_call(
    call_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a call and its audio file."""
    result = await db.execute(
        select(Call).where(Call.id == call_id)
    )
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Delete audio file if exists
    if call.audio_filename:
        filepath = os.path.join(settings.audio_dir, call.audio_filename)
        if os.path.exists(filepath):
            os.remove(filepath)
    
    await db.delete(call)
    await db.commit()
    
    return {"message": "Call deleted successfully"}
