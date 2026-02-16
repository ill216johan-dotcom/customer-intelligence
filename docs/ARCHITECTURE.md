# Customer Intelligence Platform - Архитектура

## 1. Обзор системы

**Цель:** Единая платформа для управления информацией о клиентах фулфилмента, включающая:
- Автоматическое конспектирование созвонов (Jitsi)
- Сбор и саммаризацию переписок (Telegram)
- Интеграцию с CRM (Bitrix24)
- Интеграцию с WMS (отгрузки, алерты)
- RAG-чат для быстрого поиска информации о клиенте

**Пользователи:** ~15 человек (менеджеры, руководство)
**Клиентская база:** ~100 ключевых клиентов (из 1000 активных)

---

## 2. Высокоуровневая архитектура

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     FULFILLMENT CUSTOMER INTELLIGENCE                           │
│                        MVP Architecture v1.0                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ════════════════════════ SOURCES (Источники) ═══════════════════════════════  │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Jitsi Meet     │  │  Telegram       │  │  Bitrix24       │                 │
│  │  ff-platform.ru │  │  Чаты коллег    │  │  CRM + Звонки   │                 │
│  │                 │  │  (100 клиентов) │  │  (Мегафон)      │                 │
│  │  Jibri запись   │  │                 │  │                 │                 │
│  │  → .webm/.mp4   │  │  Telethon       │  │  REST API       │                 │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                 │
│           │                    │                    │                          │
│           ▼                    ▼                    ▼                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         INGESTION LAYER                                  │  │
│  │                                                                          │  │
│  │   ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │   │                    n8n (Self-hosted)                             │  │  │
│  │   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │  │  │
│  │   │  │ Workflow 1  │ │ Workflow 2  │ │ Workflow 3  │                │  │  │
│  │   │  │ Jitsi→STT   │ │ TG Daily    │ │ Bitrix Sync │                │  │  │
│  │   │  │ (webhook)   │ │ (cron 23:00)│ │ (cron 06:00)│                │  │  │
│  │   │  └─────────────┘ └─────────────┘ └─────────────┘                │  │  │
│  │   └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│                                         ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                       PROCESSING LAYER                                   │  │
│  │                                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │  │
│  │  │ Whisper        │  │ GLM-4          │  │ Embeddings     │             │  │
│  │  │ (STT Local)    │  │ (Summarize)    │  │ (RAG Vectors)  │             │  │
│  │  │                │  │                │  │                │             │  │
│  │  │ • Transcribe   │  │ • Call Summary │  │ • BGE-M3       │             │  │
│  │  │ • Diarization  │  │ • Chat Summary │  │ • or MiniLM    │             │  │
│  │  │ • Free!        │  │ • Key points   │  │ • Free!        │             │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘             │  │
│  │                                                                          │  │
│  │  Tech: FastAPI Python service (whisper + transformers)                   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│                                         ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        DATA LAYER                                        │  │
│  │                                                                          │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    PostgreSQL + pgvector                           │ │  │
│  │  │                                                                    │ │  │
│  │  │  customers          calls              messages        notes       │ │  │
│  │  │  ┌──────────┐      ┌──────────┐       ┌──────────┐   ┌──────────┐ │ │  │
│  │  │  │id        │      │id        │       │id        │   │id        │ │ │  │
│  │  │  │name      │◄────┐│customer_ │       │customer_ │   │customer_ │ │ │  │
│  │  │  │company   │     ││  id      │       │  id      │   │  id      │ │ │  │
│  │  │  │products  │     ││source    │       │source    │   │author    │ │ │  │
│  │  │  │marketpl. │     ││(jitsi/   │       │(tg/email)│   │content   │ │ │  │
│  │  │  │pains     │     ││ bitrix)  │       │raw_text  │   │created_at│ │ │  │
│  │  │  │conflicts │     ││transcript│       │summary   │   └──────────┘ │ │  │
│  │  │  │wms_id    │     ││summary   │       │embedding │                │ │  │
│  │  │  │created_at│     ││speakers  │       │date      │   embeddings   │ │  │
│  │  │  └──────────┘     ││duration  │       └──────────┘   ┌──────────┐ │ │  │
│  │  │       ▲           ││embedding │                      │id        │ │ │  │
│  │  │       │           ││audio_url │       alerts         │content   │ │ │  │
│  │  │       │           │└──────────┘       ┌──────────┐   │vector    │ │ │  │
│  │  │       │           │                   │id        │   │source_id │ │ │  │
│  │  │       └───────────┴───────────────────│customer_ │   │source_   │ │ │  │
│  │  │                                       │  id      │   │  type    │ │ │  │
│  │  │                                       │type      │   └──────────┘ │ │  │
│  │  │                                       │message   │                │ │  │
│  │  │                                       │is_read   │                │ │  │
│  │  │                                       └──────────┘                │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│                                         ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        FRONTEND LAYER                                    │  │
│  │                                                                          │  │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                   Next.js / React App                              │ │  │
│  │  │                                                                    │ │  │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │ │  │
│  │  │  │  Dashboard                                                   │  │ │  │
│  │  │  │  ├── Статистика (звонки сегодня, алерты)                    │  │ │  │
│  │  │  │  ├── Активные алерты                                        │  │ │  │
│  │  │  │  └── Поиск клиентов                                         │  │ │  │
│  │  │  └─────────────────────────────────────────────────────────────┘  │ │  │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │ │  │
│  │  │  │  Карточка клиента                                           │  │ │  │
│  │  │  │  ├── Профиль (редактируемый)                                │  │ │  │
│  │  │  │  ├── Созвоны (транскрипт + саммари)                         │  │ │  │
│  │  │  │  ├── Переписки (TG + Email)                                 │  │ │  │
│  │  │  │  ├── Отгрузки WMS [Phase 4]                                 │  │ │  │
│  │  │  │  ├── Заметки команды                                        │  │ │  │
│  │  │  │  └── AI-чат "Спроси о клиенте"                              │  │ │  │
│  │  │  └─────────────────────────────────────────────────────────────┘  │ │  │
│  │  │                                                                    │ │  │
│  │  │  Auth: простой логин (15 юзеров)                                  │ │  │
│  │  └────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            VPS Server (4-8 CPU, 16GB RAM)                       │
│                                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ nginx   │ │ next.js │ │ fastapi │ │   n8n   │ │postgres │ │ whisper │       │
│  │ :80/443 │ │ :3000   │ │ :8000   │ │ :5678   │ │ :5432   │ │ worker  │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                                                 │
│  Volumes: /data/postgres, /data/audio, /data/n8n                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Технологический стек

### Frontend
- **Next.js 14** (App Router)
- **TailwindCSS**
- **shadcn/ui** (компоненты)
- **React Query** (кэширование)

### Backend
- **FastAPI** (Python 3.11)
- **SQLAlchemy** + asyncpg
- **Celery** + Redis (фоновые задачи)
- **Pydantic** (валидация)

### AI/ML
- **Whisper large-v3** (Speech-to-Text, self-hosted)
- **pyannote-audio** (диаризация спикеров)
- **GLM-4 API** (саммаризация)
- **BGE-M3** (embeddings для RAG, self-hosted)

### Database
- **PostgreSQL 16** + pgvector extension

### Automation
- **n8n** (self-hosted)

### Integrations
- **Telethon** (Telegram userbot)
- **Bitrix24 REST API**
- **Jibri** (Jitsi recording)
- **WMS API** (Swagger)

### DevOps
- **Docker** + Docker Compose
- **Nginx** (reverse proxy + SSL)
- **Let's Encrypt** (сертификаты)

---

## 5. Структура базы данных

### Основные таблицы

#### customers
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Имя контакта |
| company | VARCHAR(255) | Название компании |
| phone | VARCHAR(50) | Телефон |
| email | VARCHAR(255) | Email |
| telegram_id | BIGINT | Telegram ID |
| products | TEXT | Чем торгует |
| marketplaces | JSONB | Маркетплейсы (WB, Ozon, etc.) |
| pains | TEXT | Боли клиента |
| conflicts | TEXT | История конфликтов |
| wms_client_id | VARCHAR(100) | ID в WMS системе |
| bitrix_contact_id | INTEGER | ID в Bitrix24 |
| created_at | TIMESTAMP | Дата создания |
| updated_at | TIMESTAMP | Дата обновления |

#### calls
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | FK → customers |
| source | ENUM | 'jitsi', 'bitrix' |
| title | VARCHAR(255) | Название встречи |
| date | TIMESTAMP | Дата созвона |
| duration | INTEGER | Длительность (секунды) |
| participants | JSONB | Список участников |
| transcript | TEXT | Полный транскрипт |
| summary | TEXT | AI-саммари |
| key_points | JSONB | Ключевые пункты |
| audio_url | VARCHAR(500) | Ссылка на аудио |
| embedding | VECTOR(1024) | Вектор для RAG |

#### messages
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | FK → customers |
| source | ENUM | 'telegram', 'email', 'bitrix' |
| direction | ENUM | 'incoming', 'outgoing' |
| sender | VARCHAR(255) | Отправитель |
| content | TEXT | Текст сообщения |
| date | TIMESTAMP | Дата сообщения |
| chat_id | VARCHAR(100) | ID чата (для группировки) |
| summary | TEXT | AI-саммари (для группы) |
| embedding | VECTOR(1024) | Вектор для RAG |

#### notes
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | FK → customers |
| author_id | UUID | FK → users |
| content | TEXT | Текст заметки |
| created_at | TIMESTAMP | Дата создания |

#### alerts
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | FK → customers |
| type | ENUM | 'high_reserves', 'potential_leave', 'custom' |
| message | TEXT | Текст алерта |
| severity | ENUM | 'low', 'medium', 'high', 'critical' |
| is_read | BOOLEAN | Прочитан ли |
| created_at | TIMESTAMP | Дата создания |

#### users
| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Email |
| password_hash | VARCHAR(255) | Хэш пароля |
| name | VARCHAR(255) | Имя |
| role | ENUM | 'admin', 'manager' |
| is_active | BOOLEAN | Активен ли |

---

## 6. Потоки данных (Data Flows)

### Flow 1: Jitsi → Транскрипт → Саммари

```
Jitsi Meeting
     │
     ▼ (Jibri записывает)
  .webm файл
     │
     ▼ (webhook в n8n)
  n8n Workflow
     │
     ▼ (POST /api/calls/process)
  FastAPI Backend
     │
     ├──► Celery Task: transcribe
     │         │
     │         ▼ (Whisper + pyannote)
     │    Транскрипт с диаризацией
     │         │
     │         ▼ (GLM-4)
     │    Саммари + ключевые пункты
     │         │
     │         ▼ (BGE-M3)
     │    Embedding
     │
     ▼
  PostgreSQL (calls table)
     │
     ▼
  UI обновляется
```

### Flow 2: Telegram → Ежедневная выгрузка

```
Cron (23:00)
     │
     ▼
  n8n Workflow
     │
     ▼ (Telethon)
  Получить сообщения за день
     │
     ▼ (POST /api/messages/bulk)
  FastAPI Backend
     │
     ├──► Сгруппировать по клиентам
     │
     ├──► Celery Task: summarize_chat
     │         │
     │         ▼ (GLM-4)
     │    Саммари переписки
     │
     ▼
  PostgreSQL (messages table)
```

### Flow 3: RAG Chat

```
User Question
     │
     ▼ (POST /api/chat)
  FastAPI Backend
     │
     ├──► Получить customer_id
     │
     ├──► BGE-M3: embed question
     │
     ├──► pgvector: similarity search
     │         │
     │         ▼
     │    Релевантные calls, messages
     │
     ├──► GLM-4: generate answer
     │
     ▼
  Response to User
```

---

## 7. Смета расходов

| Компонент | Решение | Стоимость/мес |
|-----------|---------|---------------|
| VPS | Timeweb/Selectel (4 CPU, 16GB RAM) | ~2,500 руб |
| STT | Whisper (self-hosted) | 0 руб |
| LLM | GLM-4 API (bigmodel.cn) | ~500 руб |
| Embeddings | BGE-M3 (self-hosted) | 0 руб |
| Telegram | Telethon (free) | 0 руб |
| Домен | Опционально | ~150 руб |
| **ИТОГО** | | **~3,000-3,500 руб/мес** |

---

## 8. Фазы разработки

### Phase 1: Jitsi Transcription (1-2 недели)
- [x] Инфраструктура (Docker, PostgreSQL)
- [ ] Whisper + pyannote pipeline
- [ ] GLM-4 саммаризация
- [ ] UI: загрузка аудио, просмотр транскрипта

### Phase 2: Telegram Integration (1 неделя)
- [ ] Telethon userbot
- [ ] Ежедневная синхронизация
- [ ] Саммари чатов
- [ ] UI: вкладка переписок

### Phase 3: Bitrix24 Integration (1 неделя)
- [ ] REST API подключение
- [ ] Синхронизация контактов
- [ ] Импорт звонков и писем

### Phase 4: WMS + Alerts (1 неделя)
- [ ] API интеграция
- [ ] Система алертов
- [ ] RAG-чат

---

## 9. Рекомендации по VPS

### Минимальные требования
- **CPU:** 4 vCPU (для Whisper критично)
- **RAM:** 16 GB (Whisper large ~10GB)
- **Disk:** 100 GB SSD (аудиофайлы)
- **OS:** Ubuntu 22.04 LTS

### Рекомендуемые провайдеры (Россия)

| Провайдер | Конфигурация | Цена/мес | Примечание |
|-----------|--------------|----------|------------|
| **Timeweb Cloud** | 4 CPU / 16GB / 100GB | ~2,500 руб | Хороший баланс |
| **Selectel** | 4 CPU / 16GB / 100GB | ~3,000 руб | Надёжный, быстрая поддержка |
| **VDSina** | 4 CPU / 16GB / 100GB | ~2,200 руб | Бюджетный вариант |
| **Reg.ru Cloud** | 4 CPU / 16GB / 100GB | ~2,800 руб | Популярный |

**Рекомендация:** Начни с **Timeweb Cloud** — оптимальное соотношение цена/качество, хорошая панель управления.

---

## 10. Безопасность

- [ ] HTTPS (Let's Encrypt)
- [ ] JWT аутентификация
- [ ] Rate limiting
- [ ] Шифрование паролей (bcrypt)
- [ ] Бэкапы PostgreSQL (ежедневно)
- [ ] Ограниченный доступ по IP (опционально)
