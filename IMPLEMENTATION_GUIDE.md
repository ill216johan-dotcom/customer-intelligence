# Implementation Guide - Customer Intelligence Enhancements

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Health Score & Engagement

#### Step 1.1: Database Migrations

```sql
-- Add health score columns to customers
ALTER TABLE customers ADD COLUMN (
    health_score NUMERIC(5,2) DEFAULT 50.0,
    health_score_updated_at TIMESTAMP DEFAULT now(),
    health_trend VARCHAR(20) DEFAULT 'stable',
    health_components JSONB DEFAULT '{}'
);

-- Create health history table
CREATE TABLE customer_health_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    health_score NUMERIC(5,2) NOT NULL,
    components JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_health_customer_date 
ON customer_health_history(customer_id, calculated_at DESC);

-- Create engagement metrics table
CREATE TABLE engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    call_count INT DEFAULT 0,
    message_count INT DEFAULT 0,
    avg_response_time_hours NUMERIC(5,2),
    last_interaction_date TIMESTAMP,
    engagement_score NUMERIC(5,2),
    calculated_at TIMESTAMP DEFAULT now(),
    UNIQUE (customer_id, period_start, period_end)
);

CREATE INDEX idx_engagement_customer_date 
ON engagement_metrics(customer_id, period_end DESC);
```

#### Step 1.2: Create Health Score Service

**File:** `/backend/app/services/health_score.py`

```python
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

class HealthScoreCalculator:
    """Calculate customer health scores."""
    
    async def calculate_engagement_score(
        self, 
        db: AsyncSession, 
        customer_id: UUID, 
        days: int = 90
    ) -> float:
        """Calculate engagement score (0-100)."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Call frequency
        calls = await db.execute(
            select(func.count(Call.id))
            .where(Call.customer_id == customer_id)
            .where(Call.started_at >= cutoff_date)
        )
        call_count = calls.scalar() or 0
        call_frequency = min(100, (call_count / days) * 100)
        
        # Message volume
        messages = await db.execute(
            select(func.count(Message.id))
            .where(Message.customer_id == customer_id)
            .where(Message.sent_at >= cutoff_date)
        )
        message_count = messages.scalar() or 0
        message_frequency = min(100, (message_count / days) * 10)
        
        # Recency
        last_interaction = await db.execute(
            select(func.max(Message.sent_at))
            .where(Message.customer_id == customer_id)
        )
        last_date = last_interaction.scalar()
        
        if last_date:
            days_since = (datetime.utcnow() - last_date).days
            recency_score = max(0, 100 - (days_since * 5))
        else:
            recency_score = 0
        
        # Weighted average
        engagement_score = (
            0.40 * call_frequency +
            0.40 * message_frequency +
            0.20 * recency_score
        )
        
        return engagement_score
    
    async def calculate_activity_score(
        self, 
        db: AsyncSession, 
        customer_id: UUID, 
        days: int = 90
    ) -> float:
        """Calculate activity score (0-100)."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total interactions
        interactions = await db.execute(
            select(func.count(Call.id) + func.count(Message.id))
            .where(Call.customer_id == customer_id)
            .where(Call.started_at >= cutoff_date)
        )
        
        interaction_count = interactions.scalar() or 0
        activity_score = min(100, (interaction_count / days) * 5)
        
        return activity_score
    
    async def calculate_health_score(
        self, 
        db: AsyncSession, 
        customer_id: UUID
    ) -> dict:
        """Calculate comprehensive health score."""
        engagement = await self.calculate_engagement_score(db, customer_id)
        activity = await self.calculate_activity_score(db, customer_id)
        
        # Placeholder for sentiment and payment scores
        sentiment = 50.0  # Will be implemented in Week 2
        payment = 50.0    # Will be implemented later
        support = 50.0    # Will be implemented later
        
        # Weighted average
        health_score = (
            0.25 * engagement +
            0.25 * sentiment +
            0.20 * activity +
            0.15 * payment +
            0.15 * support
        )
        
        # Get previous score for trend
        previous_result = await db.execute(
            select(CustomerHealthHistory.health_score)
            .where(CustomerHealthHistory.customer_id == customer_id)
            .order_by(CustomerHealthHistory.calculated_at.desc())
            .limit(1)
        )
        previous_score = previous_result.scalar()
        
        # Determine trend
        if previous_score is None:
            trend = 'stable'
        elif health_score > previous_score + 5:
            trend = 'improving'
        elif health_score < previous_score - 5:
            trend = 'declining'
        else:
            trend = 'stable'
        
        return {
            'health_score': health_score,
            'trend': trend,
            'components': {
                'engagement': engagement,
                'sentiment': sentiment,
                'activity': activity,
                'payment': payment,
                'support': support,
            }
        }
```

#### Step 1.3: Create Celery Task

**File:** `/worker/tasks/health_score.py`

```python
from celery import shared_task
from uuid import UUID
from app.services.health_score import HealthScoreCalculator
from app.db.database import get_db
from app.models.models import Customer, CustomerHealthHistory

calculator = HealthScoreCalculator()

@shared_task
def calculate_customer_health_score(customer_id: str):
    """Calculate health score for a single customer."""
    async def _calculate():
        db = get_db()
        customer_uuid = UUID(customer_id)
        
        # Calculate score
        result = await calculator.calculate_health_score(db, customer_uuid)
        
        # Update customer
        customer = await db.execute(
            select(Customer).where(Customer.id == customer_uuid)
        )
        customer = customer.scalar_one()
        customer.health_score = result['health_score']
        customer.health_trend = result['trend']
        customer.health_components = result['components']
        customer.health_score_updated_at = datetime.utcnow()
        
        # Store history
        history = CustomerHealthHistory(
            customer_id=customer_uuid,
            health_score=result['health_score'],
            components=result['components']
        )
        
        db.add(history)
        await db.commit()
    
    import asyncio
    asyncio.run(_calculate())

@shared_task
def calculate_all_health_scores():
    """Calculate health scores for all customers."""
    async def _calculate_all():
        db = get_db()
        customers = await db.execute(select(Customer))
        customers = customers.scalars().all()
        
        for customer in customers:
            calculate_customer_health_score.delay(str(customer.id))
    
    import asyncio
    asyncio.run(_calculate_all())
```

#### Step 1.4: Add Celery Beat Schedule

**File:** `/backend/app/config.py` (add to existing config)

```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'calculate-health-scores-daily': {
        'task': 'tasks.health_score.calculate_all_health_scores',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
}
```

#### Step 1.5: Create API Endpoints

**File:
