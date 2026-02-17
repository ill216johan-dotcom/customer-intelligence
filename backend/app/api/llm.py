"""
LLM API endpoints for text generation.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Call
from app.api.auth import get_current_user, User
from app.services.llm import generate_call_summary as llm_generate_summary

router = APIRouter()


# ==========================================
# Schemas
# ==========================================

class SummaryRequest(BaseModel):
    transcript: str
    participants: list[str] = []


class SummaryResponse(BaseModel):
    summary: str
    key_points: list[str]
    action_items: list[str]


# ==========================================
# Endpoints
# ==========================================

@router.post("/summary")
async def generate_summary(
    request: SummaryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate summary from transcript using GLM-4."""
    try:
        result = await llm_generate_summary(
            transcript=request.transcript,
            participants=request.participants
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")
