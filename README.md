# Customer Intelligence Platform

Единая платформа управления информацией о клиентах фулфилмента.

## Возможности

- **Конспектирование созвонов** — автоматическая транскрипция и саммари встреч из Jitsi
- **История переписок** — сбор и анализ чатов из Telegram
- **CRM интеграция** — синхронизация с Bitrix24 (звонки, письма)
- **WMS данные** — отгрузки и алерты из складской системы
- **Мониторинг рисков** — проактивное выявление вероятности оттока (Churn Prediction)
- **RAG-чат** — задавайте вопросы о клиенте в свободной форме (Knowledge Retrieval)

## Быстрый старт

### 1. Клонирование и настройка

```bash
# Скопировать конфигурацию
cp .env.example .env

# Отредактировать .env (обязательно поменять пароли!)
nano .env
```

### 2. Запуск (Docker)

```bash
# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps

# Посмотреть логи
docker-compose logs -f backend
```

### 3. Первый вход

- **Web-интерфейс:** http://localhost:3000
- **API документация:** http://localhost:8000/docs
- **n8n (автоматизация):** http://localhost:5678

Логин по умолчанию:
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Сразу поменяйте пароль!**

## Структура проекта

```
customer-intelligence/
├── backend/          # FastAPI сервер
├── frontend/         # Next.js приложение (в разработке)
├── worker/           # Celery worker (Whisper транскрипция)
├── n8n/              # Конфиги автоматизации
├── docs/             # Документация
└── docker-compose.yml
```

## Технологии

| Компонент | Технология |
|-----------|-----------|
| Backend | FastAPI (Python 3.11) |
| Frontend | Next.js 14, TailwindCSS |
| Database | PostgreSQL 16 + pgvector |
| Queue | Celery + Redis |
| STT | OpenAI Whisper (self-hosted) |
| LLM | GLM-4 API |
| Automation | n8n |

## Документация

- [Архитектура](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Спецификация](docs/SPECS.md)

## Требования к серверу

- **CPU:** 4+ vCPU (Whisper требователен к CPU)
- **RAM:** 16 GB минимум
- **Disk:** 100 GB SSD
- **OS:** Ubuntu 22.04 LTS

## Разработка

```bash
# Backend (без Docker)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Worker
cd worker
celery -A tasks.celery_app worker --loglevel=info
```

## Лицензия

Proprietary. Internal use only.
