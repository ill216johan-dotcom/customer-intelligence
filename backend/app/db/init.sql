-- ==========================================
-- Customer Intelligence Platform
-- Database Initialization
-- ==========================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUM Types
-- ==========================================

CREATE TYPE call_source AS ENUM ('jitsi', 'bitrix', 'manual');
CREATE TYPE message_source AS ENUM ('telegram', 'email', 'bitrix', 'whatsapp');
CREATE TYPE message_direction AS ENUM ('incoming', 'outgoing');
CREATE TYPE alert_type AS ENUM ('high_reserves', 'potential_leave', 'payment_overdue', 'custom');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');

-- ==========================================
-- Users Table
-- ==========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'manager',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Customers Table
-- ==========================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    telegram_id BIGINT,
    telegram_username VARCHAR(100),
    
    -- Business Info
    products TEXT,                          -- Чем торгует
    marketplaces JSONB DEFAULT '[]',        -- ["wildberries", "ozon", "yandex_market"]
    working_since DATE,                     -- С какого времени клиент
    
    -- Pain Points & History
    pains TEXT,                             -- Боли клиента
    conflicts TEXT,                         -- История конфликтов
    
    -- External IDs
    wms_client_id VARCHAR(100),             -- ID в WMS системе
    bitrix_contact_id INTEGER,              -- ID в Bitrix24
    
    -- AI-generated summary
    ai_summary TEXT,                        -- Общее саммари о клиенте
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_company ON customers(company);
CREATE INDEX idx_customers_telegram_id ON customers(telegram_id);
CREATE INDEX idx_customers_bitrix_id ON customers(bitrix_contact_id);

-- ==========================================
-- Calls Table (созвоны)
-- ==========================================

CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Call Info
    source call_source NOT NULL,
    title VARCHAR(255),
    meeting_id VARCHAR(255),                -- Jitsi room ID или Bitrix call ID
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER,                       -- Длительность в секундах
    
    -- Participants
    participants JSONB DEFAULT '[]',        -- [{"name": "...", "role": "manager|client"}]
    
    -- Content
    transcript TEXT,                        -- Полный транскрипт
    transcript_with_speakers JSONB,         -- [{"speaker": "Speaker 1", "text": "...", "start": 0.0, "end": 5.0}]
    summary TEXT,                           -- AI-саммари
    key_points JSONB DEFAULT '[]',          -- ["пункт 1", "пункт 2"]
    action_items JSONB DEFAULT '[]',        -- ["задача 1", "задача 2"]
    
    -- Files
    audio_url VARCHAR(500),
    audio_filename VARCHAR(255),
    
    -- RAG
    embedding vector(1024),                 -- BGE-M3 embedding
    
    -- Status
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    processing_error TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calls_customer ON calls(customer_id);
CREATE INDEX idx_calls_source ON calls(source);
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX idx_calls_embedding ON calls USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ==========================================
-- Messages Table (переписки)
-- ==========================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Message Info
    source message_source NOT NULL,
    direction message_direction NOT NULL,
    
    -- Sender/Receiver
    sender_name VARCHAR(255),
    sender_id VARCHAR(100),                 -- Telegram ID, email, etc.
    
    -- Content
    content TEXT NOT NULL,
    
    -- Chat grouping
    chat_id VARCHAR(100),                   -- Для группировки сообщений
    thread_id VARCHAR(100),                 -- Email thread ID
    
    -- Timing
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- RAG
    embedding vector(1024),
    
    -- Metadata
    raw_data JSONB,                         -- Оригинальные данные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_customer ON messages(customer_id);
CREATE INDEX idx_messages_source ON messages(source);
CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_embedding ON messages USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ==========================================
-- Message Summaries (дневные саммари чатов)
-- ==========================================

CREATE TABLE message_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    source message_source NOT NULL,
    chat_id VARCHAR(100),
    
    -- Period
    date DATE NOT NULL,
    
    -- Content
    message_count INTEGER DEFAULT 0,
    summary TEXT,
    key_topics JSONB DEFAULT '[]',
    sentiment VARCHAR(50),                  -- positive, neutral, negative
    
    -- RAG
    embedding vector(1024),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_summaries_customer ON message_summaries(customer_id);
CREATE INDEX idx_summaries_date ON message_summaries(date DESC);

-- ==========================================
-- Notes (заметки менеджеров)
-- ==========================================

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    content TEXT NOT NULL,
    
    -- RAG
    embedding vector(1024),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notes_customer ON notes(customer_id);
CREATE INDEX idx_notes_created ON notes(created_at DESC);

-- ==========================================
-- Alerts (уведомления)
-- ==========================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    type alert_type NOT NULL,
    severity alert_severity DEFAULT 'medium',
    
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Data that triggered the alert
    trigger_data JSONB,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_by UUID REFERENCES users(id),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_customer ON alerts(customer_id);
CREATE INDEX idx_alerts_unread ON alerts(is_read) WHERE is_read = false;
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ==========================================
-- WMS Shipments (отгрузки)
-- ==========================================

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- WMS Data
    wms_shipment_id VARCHAR(100) UNIQUE,
    marketplace VARCHAR(50),                -- wildberries, ozon, etc.
    
    -- Status
    status VARCHAR(50),
    
    -- Quantities
    items_count INTEGER,
    boxes_count INTEGER,
    
    -- Timing
    created_at_wms TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    
    -- Raw data from WMS
    raw_data JSONB,
    
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shipments_customer ON shipments(customer_id);
CREATE INDEX idx_shipments_wms_id ON shipments(wms_shipment_id);
CREATE INDEX idx_shipments_created ON shipments(created_at_wms DESC);

-- ==========================================
-- Default Admin User
-- ==========================================

-- Password: admin123 (bcrypt hash)
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G4cE4c4SxaJxK2', 'Admin', 'admin');

-- ==========================================
-- Trigger: Update updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
