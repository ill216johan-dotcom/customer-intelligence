# API Reference

## Базовый URL

```
http://localhost:8000/api
```

## Аутентификация

Все эндпоинты (кроме `/auth/login`) требуют JWT токен в заголовке:

```
Authorization: Bearer <access_token>
```

---

## Auth

### POST /auth/login

Авторизация пользователя.

**Request:**
```json
{
  "username": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### GET /auth/me

Получить текущего пользователя.

**Response:**
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "name": "Admin",
  "role": "admin",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Customers

### GET /customers

Список клиентов.

**Query params:**
- `search` (string) — поиск по имени/компании
- `limit` (int, default=50) — количество
- `offset` (int, default=0) — смещение

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Иван Иванов",
    "company": "ООО Рога и Копыта",
    "phone": "+79001234567",
    "email": "ivan@example.com",
    "calls_count": 5,
    "messages_count": 42,
    "unread_alerts_count": 1,
    "last_interaction": "2024-01-15T10:30:00Z"
  }
]
```

### GET /customers/{id}

Детали клиента.

**Response:**
```json
{
  "id": "uuid",
  "name": "Иван Иванов",
  "company": "ООО Рога и Копыта",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "telegram_id": 123456789,
  "telegram_username": "ivan_ivanov",
  "products": "Одежда, аксессуары",
  "marketplaces": ["wildberries", "ozon"],
  "working_since": "2023-01-01",
  "pains": "Долгая доставка до склада",
  "conflicts": "Инцидент с потерей товара в марте 2023",
  "wms_client_id": "CLN-001",
  "bitrix_contact_id": 12345,
  "ai_summary": "Активный клиент с WB и Ozon...",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### POST /customers

Создать клиента.

**Request:**
```json
{
  "name": "Иван Иванов",
  "company": "ООО Рога и Копыта",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "products": "Одежда",
  "marketplaces": ["wildberries"]
}
```

### PUT /customers/{id}

Обновить клиента.

**Request:** (все поля опциональны)
```json
{
  "pains": "Новая боль клиента",
  "conflicts": "Добавить описание конфликта"
}
```

### DELETE /customers/{id}

Удалить клиента (и все связанные данные).

---

## Calls

### GET /calls

Список созвонов.

**Query params:**
- `customer_id` (uuid) — фильтр по клиенту
- `source` (enum: jitsi, bitrix, manual) — источник
- `limit`, `offset`

### GET /calls/{id}

Детали созвона с транскриптом и саммари.

**Response:**
```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "source": "jitsi",
  "title": "Обсуждение условий",
  "started_at": "2024-01-15T10:00:00Z",
  "ended_at": "2024-01-15T10:45:00Z",
  "duration": 2700,
  "participants": [
    {"name": "Менеджер", "role": "manager"},
    {"name": "Клиент", "role": "client"}
  ],
  "transcript": "Полный текст транскрипции...",
  "transcript_with_speakers": [
    {"speaker": "Speaker 1", "text": "Здравствуйте", "start": 0.0, "end": 1.5}
  ],
  "summary": "Обсудили условия сотрудничества...",
  "key_points": [
    "Клиент хочет снизить тариф",
    "Планирует увеличить объёмы"
  ],
  "action_items": [
    "Подготовить новое КП",
    "Согласовать скидку с руководством"
  ],
  "processing_status": "completed"
}
```

### POST /calls/upload

Загрузить аудио для транскрипции.

**Request:** `multipart/form-data`
- `file` — аудиофайл (mp3, wav, webm, mp4)
- `customer_id` (uuid, optional)
- `title` (string, optional)

**Response:**
```json
{
  "id": "uuid",
  "processing_status": "pending"
}
```

### GET /calls/{id}/status

Статус обработки.

**Response:**
```json
{
  "call_id": "uuid",
  "status": "processing",
  "progress": 45,
  "error": null
}
```

---

## Messages

### GET /messages

Список сообщений.

### GET /messages/chats

Список чатов с статистикой.

### GET /messages/chat/{chat_id}

Сообщения конкретного чата.

### POST /messages/bulk

Массовый импорт сообщений (для Telegram sync).

---

## Notes

### GET /notes?customer_id={id}

Заметки по клиенту.

### POST /notes

Создать заметку.

**Request:**
```json
{
  "customer_id": "uuid",
  "content": "Текст заметки"
}
```

---

## Alerts

### GET /alerts

Список алертов.

**Query params:**
- `is_read` (bool)
- `is_resolved` (bool)
- `severity` (enum: low, medium, high, critical)
- `type` (enum: high_reserves, potential_leave, payment_overdue, churn_risk, sentiment_decline, custom)

### GET /alerts/stats

Статистика алертов.

**Response:**
```json
{
  "total": 15,
  "unread": 3,
  "by_severity": {"high": 2, "medium": 5, "low": 8},
  "by_type": {"high_reserves": 3, "potential_leave": 1}
}
```

### POST /alerts/{id}/read

Пометить как прочитанный.

### POST /alerts/{id}/resolve

Закрыть алерт.

**Request:**
```json
{
  "resolution_note": "Связались с клиентом, всё ок"
}
```

---

## Chat (RAG)

### POST /chat

Задать вопрос о клиенте.

**Request:**
```json
{
  "customer_id": "uuid",
  "message": "Какие были проблемы с этим клиентом?",
  "history": [
    {"role": "user", "content": "Предыдущий вопрос"},
    {"role": "assistant", "content": "Предыдущий ответ"}
  ]
}
```

**Response:**
```json
{
  "answer": "По данным из созвонов и переписок, у клиента были следующие проблемы...",
  "sources": [
    {
      "type": "call",
      "content": "Обсуждали проблему с доставкой...",
      "date": "2024-01-10T00:00:00Z",
      "similarity": 0.87
    }
  ]
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Доступ запрещён |
| 404 | Не найдено |
| 422 | Ошибка валидации |
| 500 | Внутренняя ошибка сервера |
