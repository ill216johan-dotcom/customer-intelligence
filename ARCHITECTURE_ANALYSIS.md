# Customer Intelligence Platform - Comprehensive Architecture Analysis

**Date:** 2026-02-17  
**Status:** MVP Phase  
**Analyzed By:** Claude Code

---

## EXECUTIVE SUMMARY

The Customer Intelligence Platform is a well-architected fulfillment management system consolidating customer data from multiple sources (Jitsi calls, Telegram, Bitrix24, WMS) into a unified intelligence layer.

### ✅ Strengths
- Clean FastAPI backend with async/await patterns
- PostgreSQL + pgvector for RAG capabilities
- Modular API design with proper separation of concerns
- Celery worker for async processing (Whisper transcription)
- Comprehensive alert system with severity levels
- RAG chat with vector similarity search

### ⚠️ Gaps
- No customer health scoring mechanism
- No sentiment analysis on communications
- No engagement tracking/metrics
- No churn prediction or risk detection
- Limited alert triggers (only manual + WMS-based)
- No historical trend analysis

---

## 1. CURRENT ALERT SYSTEM IMPLEMENTATION

### Architecture Overview

**Location:** `/backend/app/api/alerts.py`

The alert system is **event-driven and manual-trigger based**:

**Sources:**
- Manual creation (API POST /alerts)
- WMS integration (high reserves, potential leave)
- [Future] Automated triggers (churn risk, sentiment)

**Storage:** PostgreSQL alerts table with:
- id (UUID), customer_id (FK)
- type (enum: HIGH_RESERVES, POTENTIAL_LEAVE, PAYMENT_OVERDUE, CUSTOM)
- severity (enum: LOW, MEDIUM, HIGH, CRITICAL)
- title, message, trigger_data (JSONB)
- is_read, read_by, read_at
- is_resolved, resolved_by, resolved_at

**API Endpoints:**
- GET /alerts (list with filters)
- GET /alerts/stats (aggregated counts)
- POST /alerts (create)
- POST /alerts/{id}/read (mark as read)
- POST /alerts/{id}/resolve (resolve with note)
- DELETE /alerts/{id}

### Current Limitations

| Issue | Impact | Priority |
|-------|--------|----------|
| No automated triggers | Alerts are manual only | HIGH |
| No sentiment-based alerts | Miss negative sentiment shifts | HIGH |
| No engagement decline detection | Can't predict churn early | HIGH |
| No health score integration | No holistic customer view | MEDIUM |
| No alert escalation rules | Can't auto-escalate critical issues | MEDIUM |
| No alert templates | Inconsistent alert messages | LOW |

---

## 2. CUSTOMER DATA STORAGE ARCHITECTURE

### Data Model Overview

**CUSTOMERS (Core Profile)**
- Basic Info: name, company, phone, email
- Telegram: telegram_id, telegram_username
- Business: products, marketplaces (JSONB), working_since
- Context: pains, conflicts (text fields)
- External IDs: wms_client_id, bitrix_contact_id
- AI Summary: ai_summary (text)
- Metadata: created_at, updated_at

**Related Tables (1:N relationships):**

**CALLS**
- source (jitsi, bitrix, manual)
- title, meeting_id, started_at, ended_at, duration
- participants (JSONB)
- transcript, transcript_with_speakers (JSONB)
- summary, key_points (JSONB), action_items (JSONB)
- audio_url, audio_filename
- embedding (Vector 1024) ◄── RAG
- processing_status, processing_error

**MESSAGES**
- source (telegram, email, bitrix, whatsapp)
- direction (incoming, outgoing)
- sender_name, sender_id
- content (text)
- chat_id, thread_id (for grouping)
- sent_at
- embedding (Vector 1024) ◄── RAG
- raw_data (JSONB)

**NOTES**
- author_id (FK → users)
- content (text)
- embedding (Vector 1024) ◄── RAG
- created_at, updated_at

**ALERTS**
- type (enum), severity (enum)
- title, message
- trigger_data (JSONB)
- is_read, read_by, read_at
- is_resolved, resolved_by, resolved_at

### Data Ingestion Flows

**Flow 1: Jitsi → Transcription → Storage**
```
Jitsi Meeting → .webm/.mp4 file → webhook → n8n
→ POST /api/calls/process → Celery Task: transcribe_audio
├─► Whisper (STT)
├─► pyannote (diarization)
└─► GLM-4 (summarization)
→ PostgreSQL calls table
```

**Flow 2: Telegram → Daily Sync**
```
Cron (23:00) → n8n Workflow → Telethon
→ Fetch messages from TG chats → POST /api/messages/bulk
→ Celery Task: summarize_chat
├─► GLM-4 (group summary)
└─► BGE-M3 (embedding)
→ PostgreSQL messages table
```

**Flow 3: Bitrix24 → Sync**
```
Cron (06:00) → n8n Workflow → REST API
→ Fetch contacts, calls, emails
→ POST /api/customers/sync, /api/calls/sync, /api/messages/sync
→ PostgreSQL (upsert)
```

### Storage Statistics

| Table | Estimated Rows | Growth Rate | Storage |
|-------|-----------------|-------------|---------|
| customers | 100 | +5/month | ~50 KB |
| calls | 200-300 | +7-10/day | ~50 MB (with audio) |
| messages | 10,000+ | +100-200/day | ~100 MB |
| notes | 500-1000 | +10-20/day | ~5 MB |
| alerts | 1000+ | +20-50/day | ~2 MB |
| embeddings | 10,000+ | +100-200/day | ~40 MB (1024-dim vectors) |

**Total:** ~200-300 MB (excluding audio files)

---

## 3. RAG CHAT IMPLEMENTATION

### Architecture

**Location:** `/backend/app/api/chat.py` + `/backend/app/services/llm.py`

**Flow:**
```
User Question
    ↓
POST /api/chat
    ├─► Validate customer_id
    ├─► Generate embedding (GLM embedding-2)
    ├─► Vector similarity search (pgvector)
    │   ├─► Search calls (summary + transcript)
    │   ├─► Search messages (content)
    │   └─► Search notes (content)
    ├─► Rank by similarity (top 5 per type)
    ├─► Build context string
    ├─► Build customer profile
    ├─► Call GLM-4 with RAG prompt
    └─► Return answer + sources
```

### Vector Search Implementation

Uses PostgreSQL `<=>` operator (cosine distance):
- Similarity = 1 - distance (0-1 scale)
- Searches across 3 tables (calls, messages, notes)
- Fallback to recent data if embedding fails

### Current Limitations

| Issue | Impact | Fix |
|-------|--------|-----|
| No conversation history | Each query is independent | Add chat_history table |
| No context window management | May exceed token limits | Implement sliding window |
| No relevance filtering | Low-quality matches included | Add similarity threshold |
| No source attribution | Hard to verify answers | Already implemented ✓ |
| No feedback loop | Can't improve search | Add thumbs up/down |
| Single embedding model | Limited semantic understanding | Consider multi-model ensemble |

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

### 4.2 Sentiment Analysis on Communications

**Purpose:** Track emotional tone in customer interactions

**Implementation:**
```python
from transformers import pipeline

class SentimentAnalyzer:
    def __init__(self):
        self.classifier = pipeline(
            "sentiment-analysis",
            model="xlm-roberta-base",  # Multilingual for Russian
            device=0  # GPU if available
        )
    
    async def analyze_message(self, text: str) -> dict:
        result = self.classifier(text[:512])[0]
        return {
            'sentiment': result['label'].lower(),
            'score': result['score'],
            'analyzed_at': datetime.utcnow()
        }
    
    async def analyze_conversation(self, messages: List[str]) -> dict:
        sentiments = []
        for msg in messages:
            result = await self.analyze_message(msg)
            sentiments.append(result)
        
        positive = sum(1 for s in sentiments if s['sentiment'] == 'positive')
        negative = sum(1 for s in sentiments if s['sentime
