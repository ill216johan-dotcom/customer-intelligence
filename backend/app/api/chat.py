"""
RAG Chat API endpoints.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Customer, Call, Message, Note
from app.api.auth import get_current_user, User
from app.services.llm import generate_chat_response, generate_embedding

router = APIRouter()


# ==========================================
# Schemas
# ==========================================

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    customer_id: UUID
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]


class RelevantChunk(BaseModel):
    type: str  # "call", "message", "note"
    content: str
    date: datetime
    similarity: float


# ==========================================
# Helpers
# ==========================================

async def get_relevant_context(
    db: AsyncSession,
    customer_id: UUID,
    query: str,
    limit: int = 5,
) -> List[dict]:
    """
    Search for relevant context using vector similarity.
    Returns chunks from calls, messages, and notes.
    """
    # Generate embedding for query
    query_embedding = await generate_embedding(query)
    
    if not query_embedding:
        # Fallback: just get recent data if embedding fails
        return await get_recent_context(db, customer_id, limit)
    
    # Convert embedding to PostgreSQL array format
    embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
    
    relevant_chunks = []
    
    # Search in calls
    calls_query = text("""
        SELECT 
            'call' as type,
            COALESCE(summary, LEFT(transcript, 500)) as content,
            started_at as date,
            1 - (embedding <=> :embedding::vector) as similarity
        FROM calls
        WHERE customer_id = :customer_id
          AND embedding IS NOT NULL
        ORDER BY embedding <=> :embedding::vector
        LIMIT :limit
    """)
    
    calls_result = await db.execute(
        calls_query,
        {"customer_id": str(customer_id), "embedding": embedding_str, "limit": limit}
    )
    for row in calls_result:
        relevant_chunks.append({
            "type": row.type,
            "content": row.content,
            "date": row.date.isoformat() if row.date else None,
            "similarity": float(row.similarity) if row.similarity else 0,
        })
    
    # Search in messages (aggregate by chat for context)
    messages_query = text("""
        SELECT 
            'message' as type,
            content,
            sent_at as date,
            1 - (embedding <=> :embedding::vector) as similarity
        FROM messages
        WHERE customer_id = :customer_id
          AND embedding IS NOT NULL
        ORDER BY embedding <=> :embedding::vector
        LIMIT :limit
    """)
    
    messages_result = await db.execute(
        messages_query,
        {"customer_id": str(customer_id), "embedding": embedding_str, "limit": limit}
    )
    for row in messages_result:
        relevant_chunks.append({
            "type": row.type,
            "content": row.content,
            "date": row.date.isoformat() if row.date else None,
            "similarity": float(row.similarity) if row.similarity else 0,
        })
    
    # Search in notes
    notes_query = text("""
        SELECT 
            'note' as type,
            content,
            created_at as date,
            1 - (embedding <=> :embedding::vector) as similarity
        FROM notes
        WHERE customer_id = :customer_id
          AND embedding IS NOT NULL
        ORDER BY embedding <=> :embedding::vector
        LIMIT :limit
    """)
    
    notes_result = await db.execute(
        notes_query,
        {"customer_id": str(customer_id), "embedding": embedding_str, "limit": limit}
    )
    for row in notes_result:
        relevant_chunks.append({
            "type": row.type,
            "content": row.content,
            "date": row.date.isoformat() if row.date else None,
            "similarity": float(row.similarity) if row.similarity else 0,
        })
    
    # Sort by similarity and return top results
    relevant_chunks.sort(key=lambda x: x["similarity"], reverse=True)
    return relevant_chunks[:limit]


async def get_recent_context(
    db: AsyncSession,
    customer_id: UUID,
    limit: int = 5,
) -> List[dict]:
    """Fallback: get recent data without vector search."""
    chunks = []
    
    # Recent calls
    calls_result = await db.execute(
        select(Call.summary, Call.transcript, Call.started_at)
        .where(Call.customer_id == customer_id)
        .order_by(Call.started_at.desc())
        .limit(limit)
    )
    for row in calls_result:
        content = row.summary or (row.transcript[:500] if row.transcript else None)
        if content:
            chunks.append({
                "type": "call",
                "content": content,
                "date": row.started_at.isoformat() if row.started_at else None,
                "similarity": 0,
            })
    
    # Recent messages
    messages_result = await db.execute(
        select(Message.content, Message.sent_at)
        .where(Message.customer_id == customer_id)
        .order_by(Message.sent_at.desc())
        .limit(limit)
    )
    for row in messages_result:
        chunks.append({
            "type": "message",
            "content": row.content,
            "date": row.sent_at.isoformat() if row.sent_at else None,
            "similarity": 0,
        })
    
    # Recent notes
    notes_result = await db.execute(
        select(Note.content, Note.created_at)
        .where(Note.customer_id == customer_id)
        .order_by(Note.created_at.desc())
        .limit(limit)
    )
    for row in notes_result:
        chunks.append({
            "type": "note",
            "content": row.content,
            "date": row.created_at.isoformat() if row.created_at else None,
            "similarity": 0,
        })
    
    return chunks[:limit]


# ==========================================
# Endpoints
# ==========================================

@router.post("", response_model=ChatResponse)
async def chat_with_customer_data(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    RAG chat: ask questions about a specific customer.
    Uses vector similarity search to find relevant context.
    """
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer).where(Customer.id == data.customer_id)
    )
    customer = customer_result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get relevant context
    context_chunks = await get_relevant_context(db, data.customer_id, data.message)
    
    # Build context string
    context_parts = []
    for chunk in context_chunks:
        chunk_type = {
            "call": "Созвон",
            "message": "Сообщение",
            "note": "Заметка",
        }.get(chunk["type"], chunk["type"])
        
        date_str = chunk["date"][:10] if chunk["date"] else "дата неизвестна"
        context_parts.append(f"[{chunk_type}, {date_str}]: {chunk['content']}")
    
    context_text = "\n\n".join(context_parts) if context_parts else "Нет данных"
    
    # Build customer profile
    customer_profile = f"""
Клиент: {customer.name}
Компания: {customer.company or 'не указана'}
Товары: {customer.products or 'не указаны'}
Маркетплейсы: {', '.join(customer.marketplaces) if customer.marketplaces else 'не указаны'}
Боли/проблемы: {customer.pains or 'не указаны'}
Конфликты: {customer.conflicts or 'не было'}
"""
    
    # Generate response
    answer = await generate_chat_response(
        question=data.message,
        context=context_text,
        customer_profile=customer_profile,
        history=data.history,
    )
    
    return ChatResponse(
        answer=answer,
        sources=context_chunks,
    )


@router.get("/{customer_id}/context")
async def get_customer_context(
    customer_id: UUID,
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10,
):
    """
    Debug endpoint: see what context would be retrieved for a query.
    """
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer.id).where(Customer.id == customer_id)
    )
    if not customer_result.scalar():
        raise HTTPException(status_code=404, detail="Customer not found")
    
    context = await get_relevant_context(db, customer_id, query, limit)
    
    return {"query": query, "context": context}
