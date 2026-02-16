# Customer Intelligence Platform - Recommendations Summary

## Quick Overview

This document provides a high-level summary of recommendations for enhancing the Customer Intelligence Platform with predictive analytics and customer health scoring capabilities.

---

## Current State Assessment

### What's Working Well ✅

1. **Data Collection Infrastructure**
   - Multi-source integration (Jitsi, Telegram, Bitrix24, WMS)
   - Automated transcription and summarization pipeline
   - RAG chat with vector similarity search
   - Clean database schema with proper relationships

2. **Alert System**
   - Flexible alert types and severity levels
   - Read/resolve tracking
   - Trigger data storage for context
   - API endpoints for management

3. **Technology Stack**
   - FastAPI for high-performance async API
   - PostgreSQL + pgvector for vector search
   - Celery for background processing
   - n8n for workflow automation

### What's Missing ⚠️

1. **Customer Intelligence**
   - No health scoring mechanism
   - No sentiment analysis
   - No engagement metrics
   - No churn prediction

2. **Proactive Management**
   - Alerts are manual-triggered only
   - No automated risk detection
   - No trend analysis
   - No retention recommendations

---

## Recommended Features

### 1. Customer Health Score (Priority: HIGH)

**What it does:** Single 0-100 metric representing customer viability

**Components:**
- Engagement Score (25%) - Call/message frequency, response time
- Sentiment Score (25%) - Positive/negative communication tone
- Activity Score (20%) - Recent interaction recency
- Payment Score (15%) - Payment history and overdue invoices
- Support Score (15%) - Support ticket resolution

**Implementation:**
- Add 4 new columns to customers table
- Create customer_health_history table for trends
- Celery beat task to calculate daily
- API endpoints for dashboard

**Effort:** 40 hours | **Timeline:** 1 week

---

### 2. Sentiment Analysis (Priority: HIGH)

**What it does:** Analyzes emotional tone in customer communications

**Implementation:**
- Use transformers library (xlm-roberta-base for Russian)
- Analyze messages and call transcripts
- Track sentiment trends over time
- Trigger alerts on negative sentiment shifts

**Database Changes:**
- Add sentiment columns to messages and calls tables
- Create customer_sentiment_history table
- Store sentiment scores and trends

**Effort:** 40 hours | **Timeline:** 1 week

---

### 3. Engagement Tracking (Priority: HIGH)

**What it does:** Measures customer interaction patterns

**Metrics:**
- Call frequency (calls per week)
- Message volume (messages per week)
- Response time (average hours to respond)
- Days since last contact
- Interaction consistency

**Database Changes:**
- Create engagement_metrics table
- Store daily/weekly aggregates
- Track trends and anomalies

**Effort:** 30 hours | **Timeline:** 3-4 days

---

### 4. Churn Risk Detection (Priority: HIGH)

**What it does:** Identifies customers at risk of leaving

**Risk Factors:**
- Health score decline (30%)
- Engagement decline (25%)
- Sentiment deterioration (20%)
- Payment issues (15%)
- Competitive signals (10%)

**Output:**
- Churn risk score (0-100)
- Risk level (LOW, MEDIUM, HIGH, CRITICAL)
- Contributing factors
- Retention recommendations

**Database Changes:**
- Create churn_risk_scores table
- Add CHURN_RISK alert type
- Store risk history for analysis

**Effort:** 50 hours | **Timeline:** 1 week

---

## Implementation Roadmap

### Phase 1: Foundation (2 weeks)

**Week 1: Health Score & Engagement**
- Add health_score columns to customers
- Create customer_health_history table
- Implement engagement_score calculation
- Create engagement_metrics table
- Add Celery beat task for daily calculation

**Week 2: Sentiment Analysis**
- Integrate sentiment analysis model
- Add sentiment columns to messages/calls
- Create customer_sentiment_history table
- Implement sentiment Celery tasks
- Add sentiment API endpoints

### Phase 2: Churn Prediction (2 weeks)

**Week 3: Churn Risk Calculation**
- Create churn_risk_scores table
- Implement churn risk calculation logic
- Add CHURN_RISK alert type
- Create Celery beat task for daily detection
- Add churn risk API endpoints

**Week 4: Retention & Optimization**
- Create retention recommendation engine
- Add churn risk dashboard to frontend
- Implement alert escalation rules
- Add historical trend analysis
- Performance optimization

### Phase 3: Advanced Features (3 weeks)

**Week 5: ML & Segmentation**
- Implement predictive churn model
- Add customer segmentation
- Create cohort analysis
- Add A/B testing framework

**Week 6: CLV & Automation**
- Implement customer lifetime value (CLV)
- Add win-back campaign recommendations
- Create retention strategy templates
- Add automated outreach triggers

**Week 7: Testing & Deployment**
- Performance tuning
- Comprehensive testing
- Documentation
- Production deployment

---

## New API Endpoints

### Health Score
```
GET /api/customers/{id}/health
GET /api/customers/{id}/health/history?days=90
GET /api/health/dashboard
```

### Sentiment
```
GET /api/customers/{id}/sentiment
GET /api/customers/{id}/sentiment/history?days=90
GET /api/messages/{id}/sentiment
```

### Churn Risk
```
GET /api/customers/{id}/churn-risk
GET /api/churn-risk/dashboard
GET /api/churn-risk/cohorts
POST /api/churn-risk/{id}/retention-plan
```

### Engagement
```
GET /api/customers/{id}/engagement
GET /api/customers/{id}/engagement/history?days=90
GET /api/engagement/leaderboard
```

---

## Database Changes Summary

### New Tables
1. `customer_health_history` - Health score trends
2. `customer_sentiment_history` - Sentiment trends
3. `engagement_metrics` - Engagement scores and metrics
4. `churn_risk_scores` - Churn risk calculations

### Modified Tables
1. `customers` - Add health_score, health_trend, health_components
2. `messages` - Add sentiment, sentiment_score, sentiment_analyzed_at
3. `calls` - Add overall_sentiment, sentiment_summary
4. `alerts` - Add CHURN_RISK to AlertType enum

### New Indexes
- idx_engagement_customer_date
- idx_churn_risk_level
- idx_churn_risk_customer
- idx_messages_customer_date
- idx_calls_customer_date

---

## Cost Analysis

### Infrastructure
- Sentiment model (GPU): +$50-100/month (optional, can run on CPU)
- Additional RAM (16→32GB): +$50/month
- Redis cache: +$20/month
- Monitoring (Grafana): +$30/month (optional)
- **Total: +$150-200/month (~5-7% increase)**

### Development
- Phase 1 (Foundation): 80 hours
- Phase 2 (Churn): 80 hours
- Phase 3 (Advanced): 120 hours
- Testing & Optimization: 60 hours
- **Total: 340 hours (~8.5 weeks)**

---

## Success Metrics

### Health Score
- Average health score across customer base
- Distribution of health scores
- Customers below 40 (at-risk)
- Customers above 80 (healthy)

### Sentiment
- Average positive ratio
- Sentiment trend (improving/declining)
- Customers with negative trend

### Engagement
- Average engagement score
- Inactive customers (no activity > 30 days)
- Highly engaged customers

### Churn Prediction
- Customers at critical risk
- Customers at high risk
- Churn prediction accuracy (after validation)
- Retention rate by segment

---

## Technical Debt to Address

| Issue | Severity | Fix |
|-------|----------|-----|
| No database connection pooling | MEDIUM | Add pgbouncer or SQLAlchemy pool |
| Embedding generation on-demand | HIGH | Pre-compute and cache |
| Sentiment model loaded per request | HIGH | Load once at startup |
| No caching layer | MEDIUM | Add Redis caching |
| No rate limiting | MEDIUM | Add FastAPI rate limiter |
| No request logging | LOW | Add structured logging |

---

## Next Steps

1. **Review & Approve** - Get stakeholder sign-off on recommendations
2. **Prioritize** - Determine which features to implement first
3. **Resource Allocation** - Assign development team
4. **Setup** - Prepare development environment
5. **Phase 1** - Begin health score and engagement implementation
6. **Monitoring** - Set up dashboards and metrics tracking

---

## Questions & Clarifications

### Q: Can
