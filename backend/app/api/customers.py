"""
Customers API endpoints.
"""

from datetime import date, datetime
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import Customer, Call, Message, Note, Alert
from app.api.auth import get_current_user, User

router = APIRouter()


# ==========================================
# Schemas
# ==========================================

class CustomerCreate(BaseModel):
    name: str
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    products: Optional[str] = None
    marketplaces: Optional[List[str]] = []
    working_since: Optional[date] = None
    pains: Optional[str] = None
    conflicts: Optional[str] = None
    wms_client_id: Optional[str] = None
    bitrix_contact_id: Optional[int] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    products: Optional[str] = None
    marketplaces: Optional[List[str]] = None
    working_since: Optional[date] = None
    pains: Optional[str] = None
    conflicts: Optional[str] = None
    wms_client_id: Optional[str] = None
    bitrix_contact_id: Optional[int] = None


class CustomerResponse(BaseModel):
    id: UUID
    name: str
    company: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    telegram_id: Optional[int]
    telegram_username: Optional[str]
    products: Optional[str]
    marketplaces: Optional[List[str]]
    working_since: Optional[date]
    pains: Optional[str]
    conflicts: Optional[str]
    wms_client_id: Optional[str]
    bitrix_contact_id: Optional[int]
    ai_summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerListItem(BaseModel):
    id: UUID
    name: str
    company: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    telegram_username: Optional[str]
    calls_count: int = 0
    messages_count: int = 0
    unread_alerts_count: int = 0
    last_interaction: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerStats(BaseModel):
    calls_count: int
    messages_count: int
    notes_count: int
    alerts_count: int
    unread_alerts_count: int


# ==========================================
# Endpoints
# ==========================================

@router.get("", response_model=List[CustomerListItem])
async def list_customers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    search: Optional[str] = Query(None, description="Search by name or company"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all customers with basic info and stats."""
    query = select(Customer).order_by(Customer.updated_at.desc())
    
    if search:
        query = query.where(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.company.ilike(f"%{search}%"))
        )
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    customers = result.scalars().all()
    
    # Get stats for each customer
    customer_list = []
    for customer in customers:
        # Count calls
        calls_result = await db.execute(
            select(func.count(Call.id)).where(Call.customer_id == customer.id)
        )
        calls_count = calls_result.scalar() or 0
        
        # Count messages
        messages_result = await db.execute(
            select(func.count(Message.id)).where(Message.customer_id == customer.id)
        )
        messages_count = messages_result.scalar() or 0
        
        # Count unread alerts
        alerts_result = await db.execute(
            select(func.count(Alert.id)).where(
                Alert.customer_id == customer.id,
                Alert.is_read == False
            )
        )
        unread_alerts_count = alerts_result.scalar() or 0
        
        # Last interaction (latest call or message)
        last_call = await db.execute(
            select(Call.started_at)
            .where(Call.customer_id == customer.id)
            .order_by(Call.started_at.desc())
            .limit(1)
        )
        last_call_date = last_call.scalar()
        
        last_message = await db.execute(
            select(Message.sent_at)
            .where(Message.customer_id == customer.id)
            .order_by(Message.sent_at.desc())
            .limit(1)
        )
        last_message_date = last_message.scalar()
        
        last_interaction = None
        if last_call_date and last_message_date:
            last_interaction = max(last_call_date, last_message_date)
        elif last_call_date:
            last_interaction = last_call_date
        elif last_message_date:
            last_interaction = last_message_date
        
        customer_list.append(CustomerListItem(
            id=customer.id,
            name=customer.name,
            company=customer.company,
            phone=customer.phone,
            email=customer.email,
            telegram_username=customer.telegram_username,
            calls_count=calls_count,
            messages_count=messages_count,
            unread_alerts_count=unread_alerts_count,
            last_interaction=last_interaction,
            created_at=customer.created_at,
        ))
    
    return customer_list


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer details."""
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id)
    )
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer


@router.get("/{customer_id}/stats", response_model=CustomerStats)
async def get_customer_stats(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get customer statistics."""
    # Verify customer exists
    result = await db.execute(
        select(Customer.id).where(Customer.id == customer_id)
    )
    if not result.scalar():
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get counts
    calls_count = (await db.execute(
        select(func.count(Call.id)).where(Call.customer_id == customer_id)
    )).scalar() or 0
    
    messages_count = (await db.execute(
        select(func.count(Message.id)).where(Message.customer_id == customer_id)
    )).scalar() or 0
    
    notes_count = (await db.execute(
        select(func.count(Note.id)).where(Note.customer_id == customer_id)
    )).scalar() or 0
    
    alerts_count = (await db.execute(
        select(func.count(Alert.id)).where(Alert.customer_id == customer_id)
    )).scalar() or 0
    
    unread_alerts_count = (await db.execute(
        select(func.count(Alert.id)).where(
            Alert.customer_id == customer_id,
            Alert.is_read == False
        )
    )).scalar() or 0
    
    return CustomerStats(
        calls_count=calls_count,
        messages_count=messages_count,
        notes_count=notes_count,
        alerts_count=alerts_count,
        unread_alerts_count=unread_alerts_count,
    )


@router.post("", response_model=CustomerResponse)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new customer."""
    customer = Customer(**data.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update customer details."""
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id)
    )
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update only provided fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    await db.commit()
    await db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a customer."""
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id)
    )
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    await db.delete(customer)
    await db.commit()
    
    return {"message": "Customer deleted successfully"}
