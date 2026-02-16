"""
Alerts API endpoints.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.models import Alert, AlertType, AlertSeverity, Customer
from app.api.auth import get_current_user, User

router = APIRouter()


# ==========================================
# Schemas
# ==========================================

class AlertCreate(BaseModel):
    customer_id: UUID
    type: AlertType
    severity: AlertSeverity = AlertSeverity.MEDIUM
    title: str
    message: Optional[str] = None
    trigger_data: Optional[dict] = None


class AlertResponse(BaseModel):
    id: UUID
    customer_id: UUID
    customer_name: Optional[str] = None
    type: AlertType
    severity: AlertSeverity
    title: str
    message: Optional[str]
    trigger_data: Optional[dict]
    is_read: bool
    read_by: Optional[UUID]
    read_at: Optional[datetime]
    is_resolved: bool
    resolved_by: Optional[UUID]
    resolved_at: Optional[datetime]
    resolution_note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AlertResolve(BaseModel):
    resolution_note: Optional[str] = None


class AlertStats(BaseModel):
    total: int
    unread: int
    by_severity: dict
    by_type: dict


# ==========================================
# Endpoints
# ==========================================

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    customer_id: Optional[UUID] = Query(None),
    type: Optional[AlertType] = Query(None),
    severity: Optional[AlertSeverity] = Query(None),
    is_read: Optional[bool] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List alerts with filtering."""
    query = select(Alert).order_by(Alert.created_at.desc())
    
    if customer_id:
        query = query.where(Alert.customer_id == customer_id)
    if type:
        query = query.where(Alert.type == type)
    if severity:
        query = query.where(Alert.severity == severity)
    if is_read is not None:
        query = query.where(Alert.is_read == is_read)
    if is_resolved is not None:
        query = query.where(Alert.is_resolved == is_resolved)
    
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    # Get customer names
    alert_responses = []
    for alert in alerts:
        customer_name = None
        if alert.customer_id:
            customer_result = await db.execute(
                select(Customer.name).where(Customer.id == alert.customer_id)
            )
            customer_name = customer_result.scalar()
        
        alert_responses.append(AlertResponse(
            id=alert.id,
            customer_id=alert.customer_id,
            customer_name=customer_name,
            type=alert.type,
            severity=alert.severity,
            title=alert.title,
            message=alert.message,
            trigger_data=alert.trigger_data,
            is_read=alert.is_read,
            read_by=alert.read_by,
            read_at=alert.read_at,
            is_resolved=alert.is_resolved,
            resolved_by=alert.resolved_by,
            resolved_at=alert.resolved_at,
            resolution_note=alert.resolution_note,
            created_at=alert.created_at,
        ))
    
    return alert_responses


@router.get("/stats", response_model=AlertStats)
async def get_alert_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get alert statistics."""
    # Total
    total = (await db.execute(select(func.count(Alert.id)))).scalar() or 0
    
    # Unread
    unread = (await db.execute(
        select(func.count(Alert.id)).where(Alert.is_read == False)
    )).scalar() or 0
    
    # By severity
    severity_result = await db.execute(
        select(Alert.severity, func.count(Alert.id))
        .where(Alert.is_resolved == False)
        .group_by(Alert.severity)
    )
    by_severity = {row[0].value: row[1] for row in severity_result.all()}
    
    # By type
    type_result = await db.execute(
        select(Alert.type, func.count(Alert.id))
        .where(Alert.is_resolved == False)
        .group_by(Alert.type)
    )
    by_type = {row[0].value: row[1] for row in type_result.all()}
    
    return AlertStats(
        total=total,
        unread=unread,
        by_severity=by_severity,
        by_type=by_type,
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get alert details."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Get customer name
    customer_name = None
    customer_result = await db.execute(
        select(Customer.name).where(Customer.id == alert.customer_id)
    )
    customer_name = customer_result.scalar()
    
    return AlertResponse(
        id=alert.id,
        customer_id=alert.customer_id,
        customer_name=customer_name,
        type=alert.type,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        trigger_data=alert.trigger_data,
        is_read=alert.is_read,
        read_by=alert.read_by,
        read_at=alert.read_at,
        is_resolved=alert.is_resolved,
        resolved_by=alert.resolved_by,
        resolved_at=alert.resolved_at,
        resolution_note=alert.resolution_note,
        created_at=alert.created_at,
    )


@router.post("", response_model=AlertResponse)
async def create_alert(
    data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new alert."""
    # Verify customer exists
    customer_result = await db.execute(
        select(Customer).where(Customer.id == data.customer_id)
    )
    customer = customer_result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    alert = Alert(**data.model_dump())
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    
    return AlertResponse(
        id=alert.id,
        customer_id=alert.customer_id,
        customer_name=customer.name,
        type=alert.type,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        trigger_data=alert.trigger_data,
        is_read=alert.is_read,
        read_by=alert.read_by,
        read_at=alert.read_at,
        is_resolved=alert.is_resolved,
        resolved_by=alert.resolved_by,
        resolved_at=alert.resolved_at,
        resolution_note=alert.resolution_note,
        created_at=alert.created_at,
    )


@router.post("/{alert_id}/read")
async def mark_as_read(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark alert as read."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_read = True
    alert.read_by = current_user.id
    alert.read_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Alert marked as read"}


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: UUID,
    data: AlertResolve,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resolve an alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_resolved = True
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()
    alert.resolution_note = data.resolution_note
    
    # Also mark as read if not already
    if not alert.is_read:
        alert.is_read = True
        alert.read_by = current_user.id
        alert.read_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Alert resolved"}


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an alert."""
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    await db.delete(alert)
    await db.commit()
    
    return {"message": "Alert deleted"}
