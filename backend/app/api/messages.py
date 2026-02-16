"""
Messages API endpoints.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Message, MessageSource, MessageDirection, Customer
from app.api.auth import get_current_user, User

router = APIRouter()


# ==========================================
# Schemas
# ==========================================

class MessageCreate(BaseModel):
    customer_id: Optional[UUID] = None
    source: MessageSource
    direction: MessageDirection
    sender_name: Optional[str] = None
    sender_id: Optional[str] = None
    content: str
    chat_id: Optional[str] = None
    thread_id: Optional[str] = None
    sent_at: datetime
    raw_data: Optional[dict] = None


class MessageBulkCreate(BaseModel):
    messages: List[MessageCreate]


class MessageResponse(BaseModel):
    id: UUID
    customer_id: Optional[UUID]
    source: MessageSource
    direction: MessageDirection
    sender_name: Optional[str]
    sender_id: Optional[str]
    content: str
    chat_id: Optional[str]
    thread_id: Optional[str]
    sent_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSummary(BaseModel):
    chat_id: str
    customer_id: Optional[UUID]
    customer_name: Optional[str]
    source: MessageSource
    message_count: int
    last_message_at: datetime
    participants: List[str]


# ==========================================
# Endpoints
# ==========================================

@router.get("", response_model=List[MessageResponse])
async def list_messages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    customer_id: Optional[UUID] = Query(None),
    chat_id: Optional[str] = Query(None),
    source: Optional[MessageSource] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List messages with filtering."""
    query = select(Message).order_by(Message.sent_at.desc())
    
    if customer_id:
        query = query.where(Message.customer_id == customer_id)
    if chat_id:
        query = query.where(Message.chat_id == chat_id)
    if source:
        query = query.where(Message.source == source)
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    messages = result.scalars().all()
    
    return messages


@router.get("/chats", response_model=List[ChatSummary])
async def list_chats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    source: Optional[MessageSource] = Query(None),
    limit: int = Query(50, ge=1, le=100),
):
    """List unique chats with summary info."""
    # Get unique chat_ids with their stats
    query = select(
        Message.chat_id,
        Message.customer_id,
        Message.source,
        func.count(Message.id).label("message_count"),
        func.max(Message.sent_at).label("last_message_at"),
    ).where(
        Message.chat_id.isnot(None)
    ).group_by(
        Message.chat_id,
        Message.customer_id,
        Message.source,
    ).order_by(
        func.max(Message.sent_at).desc()
    ).limit(limit)
    
    if source:
        query = query.where(Message.source == source)
    
    result = await db.execute(query)
    rows = result.all()
    
    chats = []
    for row in rows:
        # Get customer name
        customer_name = None
        if row.customer_id:
            customer_result = await db.execute(
                select(Customer.name).where(Customer.id == row.customer_id)
            )
            customer_name = customer_result.scalar()
        
        # Get unique participants
        participants_result = await db.execute(
            select(Message.sender_name).where(
                Message.chat_id == row.chat_id,
                Message.sender_name.isnot(None)
            ).distinct()
        )
        participants = [p for p in participants_result.scalars().all() if p]
        
        chats.append(ChatSummary(
            chat_id=row.chat_id,
            customer_id=row.customer_id,
            customer_name=customer_name,
            source=row.source,
            message_count=row.message_count,
            last_message_at=row.last_message_at,
            participants=participants,
        ))
    
    return chats


@router.get("/chat/{chat_id}", response_model=List[MessageResponse])
async def get_chat_messages(
    chat_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(200, ge=1, le=1000),
    before: Optional[datetime] = Query(None, description="Get messages before this time"),
):
    """Get all messages in a specific chat."""
    query = select(Message).where(
        Message.chat_id == chat_id
    ).order_by(Message.sent_at.asc())
    
    if before:
        query = query.where(Message.sent_at < before)
    
    query = query.limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()
    
    return messages


@router.post("", response_model=MessageResponse)
async def create_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a single message."""
    message = Message(**data.model_dump())
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


@router.post("/bulk", response_model=dict)
async def create_messages_bulk(
    data: MessageBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create multiple messages at once (for batch import)."""
    messages = [Message(**msg.model_dump()) for msg in data.messages]
    db.add_all(messages)
    await db.commit()
    
    return {"created": len(messages)}


@router.put("/{message_id}/customer")
async def assign_message_to_customer(
    message_id: UUID,
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a message to a customer."""
    result = await db.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer.id).where(Customer.id == customer_id)
    )
    if not customer_result.scalar():
        raise HTTPException(status_code=404, detail="Customer not found")
    
    message.customer_id = customer_id
    await db.commit()
    
    return {"message": "Customer assigned"}


@router.put("/chat/{chat_id}/customer")
async def assign_chat_to_customer(
    chat_id: str,
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign all messages in a chat to a customer."""
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer.id).where(Customer.id == customer_id)
    )
    if not customer_result.scalar():
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update all messages in chat
    result = await db.execute(
        select(Message).where(Message.chat_id == chat_id)
    )
    messages = result.scalars().all()
    
    if not messages:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    for message in messages:
        message.customer_id = customer_id
    
    await db.commit()
    
    return {"message": f"Assigned {len(messages)} messages to customer"}


@router.delete("/{message_id}")
async def delete_message(
    message_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a message."""
    result = await db.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    await db.delete(message)
    await db.commit()
    
    return {"message": "Message deleted"}
