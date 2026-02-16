"""
Notes API endpoints.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Note, Customer
from app.api.auth import get_current_user, User

router = APIRouter()


# ==========================================
# Schemas
# ==========================================

class NoteCreate(BaseModel):
    customer_id: UUID
    content: str


class NoteUpdate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: UUID
    customer_id: UUID
    author_id: Optional[UUID]
    author_name: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Endpoints
# ==========================================

@router.get("", response_model=List[NoteResponse])
async def list_notes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    customer_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List notes with optional customer filter."""
    query = select(Note).order_by(Note.created_at.desc())
    
    if customer_id:
        query = query.where(Note.customer_id == customer_id)
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    notes = result.scalars().all()
    
    # Get author names
    note_responses = []
    for note in notes:
        author_name = None
        if note.author_id:
            author_result = await db.execute(
                select(User.name).where(User.id == note.author_id)
            )
            author_name = author_result.scalar()
        
        note_responses.append(NoteResponse(
            id=note.id,
            customer_id=note.customer_id,
            author_id=note.author_id,
            author_name=author_name,
            content=note.content,
            created_at=note.created_at,
            updated_at=note.updated_at,
        ))
    
    return note_responses


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific note."""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Get author name
    author_name = None
    if note.author_id:
        author_result = await db.execute(
            select(User.name).where(User.id == note.author_id)
        )
        author_name = author_result.scalar()
    
    return NoteResponse(
        id=note.id,
        customer_id=note.customer_id,
        author_id=note.author_id,
        author_name=author_name,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.post("", response_model=NoteResponse)
async def create_note(
    data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new note for a customer."""
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer.id).where(Customer.id == data.customer_id)
    )
    if not customer_result.scalar():
        raise HTTPException(status_code=404, detail="Customer not found")
    
    note = Note(
        customer_id=data.customer_id,
        author_id=current_user.id,
        content=data.content,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    
    return NoteResponse(
        id=note.id,
        customer_id=note.customer_id,
        author_id=note.author_id,
        author_name=current_user.name,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a note (only author can update)."""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Only author or admin can update
    if note.author_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this note")
    
    note.content = data.content
    await db.commit()
    await db.refresh(note)
    
    return NoteResponse(
        id=note.id,
        customer_id=note.customer_id,
        author_id=note.author_id,
        author_name=current_user.name,
        content=note.content,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.delete("/{note_id}")
async def delete_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a note (only author or admin can delete)."""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Only author or admin can delete
    if note.author_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    
    await db.delete(note)
    await db.commit()
    
    return {"message": "Note deleted"}
