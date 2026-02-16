# Customer Intelligence Platform - Recommendations & Implementation Guide

---

## 4. RECOMMENDATIONS FOR CHURN PREDICTION FEATURES

### 4.1 Customer Health Score

**Purpose:** Single metric (0-100) representing customer viability

**Components:**
```
HEALTH_SCORE = (
    0.25 * engagement_score +
    0.25 * sentiment_score +
    0.20 * activity_score +
    0.15 * payment_score +
    0.15 * support_score
)
```

**Database Schema Addition:**
```sql
ALTER TABLE customers ADD COLUMN (
    health_score NUMERIC(5,2) DEFAULT 50.0,
    health_score_updated_at TIMESTAMP DEFAULT now(),
    health_trend VARCHAR(20) DEFAULT 'stable',
    health_components JSONB DEFAULT '{}'
);

CREATE TABLE customer_health_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    health_score NUMERIC(5,2) NOT NULL,
    components JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT now(),
    INDEX (customer_id, calculated_at DESC)
);
```

**Calculation Logic (Celery Task):**
```python
# /worker/tasks/health_score.py

async def calculate_health_score(customer_id: UUID):
    """Calculate comprehensive health score for a customer."""
    customer = await get_customer(customer_id)
    
    # 1. Engagement Score (25%)
    engagement = await calculate_engagement_score(customer_id)
    
    # 2. Sentiment Score (25%)
    sentiment = await calculate_sentiment_score(customer_id)
    
    # 3. Activity Score (20%)
    activity = await calculate_activity_score(customer_id)
    
    # 4. Payment Score (15%)
    payment = await calculate_payment_score(customer_id)
    
    # 5. Support Score (15%)
    support = await calculate_support_score(customer_id)
    
    # Weighted average
    health_score = (
        0.25 * engagement +
        0.25 * sentiment +
        0.20 * activity +
        0.15 * payment +
        0.15 * support
    )
    
    # Determine trend
    previous_score = await get_previous_health_score(customer_id)
    trend = determine_trend(previous_score, health_score)
    
    # Store
    await update_customer_health(
        customer_id,
        health_score,
        {
            'engagement': engagement,
            'sentiment': sentiment,
            'activity': activity,
            'payment': payment,
            'support': support,
        },
        trend
    )
    
    # Trigger alerts if score drops below threshold
    if health_score < 40:
        await create_alert(
            customer_id,
            AlertType.CHURN_RISK,
            AlertSeverity.HIGH,
            f"Health score dropped to {health_score:.1f}",
            trigger_data={'previous': previous_score, 'current': health_score}
        )
```

### 4.2 Sentiment Analysis on Communications

**Purpose:** Track emotional tone in customer interactions

**Implementation:**
```python
# /backend/app/services/sentiment.py

from transformers import pipeline

class SentimentAnalyzer:
    def __init__(self):
        # Use multilingual model for Russian
        self.classifier = pipeline(
            "sentiment-analysis",
            model="xlm-roberta-base",
            device=0  # GPU if available
        )
    
    async def analyze_message(self, text: str) -> dict:
        """Analyze sentiment of a single message."""
        result = self.classifier(text[:512])[0]
        
        return {
            'sentiment': result['label'].lower(),
            'score': result['score'],
            'analyzed_at': datetime.utcnow()
        }
    
    async def analyze_conversation(self, messages: List[str]) -> dict:
        """Analyze overall sentiment of a conversation."""
        sentiments = []
        for msg in messages:
            result = await self.analyze_message(msg)
            sentiments.append(result)
        
        positive = sum(1 for s in sentiments if s['sentiment'] == 'positive')
        negative = sum(1 for s in sentiments if s['sentiment'] == 'negative')
        neutral = sum(1 for s in sentiments if s['sentiment'] == 'neutral')
        
        total = len(sentiments)
        
        return {
            'overall_sentiment': 'positive' if positive > negative else 'negative' if negative > positive else 'neutral',
            'positive_ratio': positive / total if total > 0 else 0,
            'negative_ratio': negative / total if total > 0 else 0,
            'neutral_ratio': neutral / total if total > 0 else 0,
            'message_count': total,
            'details': sentiments
        }
```

**Database Schema Addition:**
```sql
ALTER TABLE messages ADD COLUMN (
    sentiment VARCHAR(20),
    sentiment_score NUMERIC(3,2),
    sentiment_analyzed_at TIMESTAMP
);

ALTER TABLE calls ADD COLUMN (
    overall_sentiment VARCHAR(20),
    sentiment_summary JSONB
);

CREATE TABLE customer_sentiment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    positive_ratio NUMERIC(3,2),
    negative_ratio NUMERIC(3,2),
    neutral_ratio NUMERIC(3,2),
    trend VARCHAR(20),
    calculated_at TIMESTAMP DEFAULT now(),
    UNIQUE (customer_id, period_start, period_end)
);
```

### 4.3 Engagement Tracking

**Purpose:** Measure customer interaction frequency and patterns

**Metrics:**
```python
class EngagementMetrics:
    """
    Engagement Score Components:
    - Call frequency (calls per week)
    - Message volume (messages per week)
    - Response time (avg hours to respond)
    - Interaction consistency (std dev of gaps)
    - Recent activity (days since last contact)
    """
    
    async def calculate_engagement_score(customer_id: UUID, days: int = 90) -> float:
        """Calculate engagement score (0-100) based on recent activity."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # 1. Call frequency
        calls = await db.execute(
            select(func.count(Call.id))
            .where(Call.customer_id == customer_id)
            .where(Call.started_at >= cutoff_date)
        )
        call_count = calls.scalar() or 0
        call_frequency = min(100, (call_count / days) * 100)
        
        # 2. Message volume
        messages = await db.execute(
            select(func.count(Message.id))
            .where(Message.customer_id == customer_id)
            .where(Message.sent_at >= cutoff_date)
        )
        message_count = messages.scalar() or 0
        message_frequency = min(100, (message_count / days) * 10)
        
        # 3. Response time
        response_times = await db.execute(
            select(Message.sent_at)
            .where(Message.customer_id == customer_id)
            .where(Message.direction == MessageDirection.INCOMING)
            .where(Message.sent_at >= cutoff_date)
            .order_by(Message.sent_at)
        )
        
        avg_response_time = await calculate_avg_response_time(response_times)
        response_score = max(0, 100 - (avg_response_time / 24))
        
        # 4. Recency
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
            0.30 * call_frequency +
            0.30 * message_frequency +
            0.20 * response_score +
            0.20 * recency_score
        )
        
        return engagement_score
```

**Database Schema Addition:**
```sql
CREATE TABLE engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    call_count INT DEFAULT 0,
    message_count INT DEFAULT 0,
    avg_response_time_hours NUMERIC(5,2),
    last_interaction_date TIM
