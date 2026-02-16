# Churn Prediction & Customer Health Intelligence

## Что это и зачем нужно

### TL;DR из LinkedIn поста Zvi Shapira

**Суть:** Человек использует NotebookLM как "интеллектуальный брифинг" перед каждым звонком клиенту:
- Загружает туда все транскрипты звонков, переписки, заметки
- Перед звонком спрашивает:
  - "Какие были мои обещания с прошлого разговора?"
  - "Какие открытые вопросы у клиента?"
  - "Кто такой [Имя] и какие у него основные проблемы?"

**Результат:** Приходишь на встречу с полным контекстом. Без "давайте вспомним о чём говорили..."

### Это ИМЕННО то, что мы строим!

Наша система Customer Intelligence = NotebookLM, но:
- Автоматизированная (данные собираются сами)
- Специализированная под фулфилмент
- С **проактивными алертами** (система сама предупреждает о проблемах)

---

## Churn Prediction — что это простыми словами

**Churn** (отток) — когда клиент уходит к конкурентам.

**Churn Prediction** — предсказание ухода клиента ДО того, как он уйдёт.

### Почему это важно для фулфилмента?

| Сигнал | Что это значит |
|--------|----------------|
| Клиент резко собирает весь товар | Возможно, съезжает к конкуренту |
| Много броней, мало отгрузок | Проблемы с продажами или недовольство |
| Тон переписки становится негативным | Копится недовольство |
| Долгие паузы в коммуникации | "Тихий" уход — самый опасный |
| Упоминание конкурентов | Сравнивает варианты |

### Статистика из отрасли

> - **65.6%** команд отслеживают данные использования продукта
> - **57.2%** смотрят на низкую вовлечённость
> - **47.8%** используют customer health scores

---

## Customer Health Score — Оценка "здоровья" клиента

### Что это?

Единое число (0-100), показывающее насколько клиент "здоров" — доволен, активен, не собирается уходить.

### Из чего складывается для фулфилмента

```
Health Score = 
    (Engagement Score × 0.25) +      # Активность коммуникаций
    (Sentiment Score × 0.20) +       # Тон общения
    (Operations Score × 0.25) +      # Операционные метрики из WMS
    (Financial Score × 0.15) +       # Платёжная дисциплина
    (Relationship Score × 0.15)      # Качество отношений
```

### Компоненты оценки

#### 1. Engagement Score (Вовлечённость)
| Метрика | Хорошо | Плохо |
|---------|--------|-------|
| Частота созвонов | 2+ раза/месяц | 0 за 2 месяца |
| Ответы на сообщения | <2 часа | >24 часа |
| Участие в QBR | Всегда | Пропускает |

#### 2. Sentiment Score (Тональность)
| Сигнал | Позитив | Негатив |
|--------|---------|---------|
| Язык | "Отлично", "Спасибо" | "Проблема", "Недовольны" |
| Эмоции | Благодарность | Раздражение, угрозы |
| Тренд | Улучшается | Ухудшается |

#### 3. Operations Score (Операции WMS)
| Метрика | Хорошо | Плохо |
|---------|--------|-------|
| Объём отгрузок | Растёт | Падает >20% |
| Брони vs Отгрузки | Соотношение стабильное | Много броней, мало отгрузок |
| Жалобы на сборку | Редко | Часто |

#### 4. Financial Score (Финансы)
| Метрика | Хорошо | Плохо |
|---------|--------|-------|
| Оплата | Вовремя | Просрочки |
| Расторжение договора | Нет | Обсуждает |

#### 5. Relationship Score (Отношения)
| Метрика | Хорошо | Плохо |
|---------|--------|-------|
| Конфликты | Нет | Есть |
| Рекомендации | Приводит клиентов | Жалуется |
| Открытость | Делится планами | Закрытый |

### Визуализация

```
🟢 Здоровый (80-100)   — Всё отлично, можно думать об upsell
🟡 Внимание (60-79)    — Нужен проактивный контакт
🟠 Риск (40-59)        — Требуется вмешательство
🔴 Критично (0-39)     — Срочно спасать!
```

---

## Sentiment Analysis — Анализ тональности

### Что анализируем?

1. **Переписка в Telegram** — каждый день
2. **Транскрипты созвонов** — после каждого звонка
3. **Email из Bitrix** — при синхронизации

### Как это работает?

```
Сообщение: "Опять та же проблема с доставкой, третий раз уже!"

AI анализирует:
├── Sentiment: NEGATIVE (-0.7)
├── Emotion: FRUSTRATION
├── Intensity: HIGH (слово "опять", "третий раз")
├── Topic: DELIVERY_ISSUES
└── Action: ESCALATION_RISK
```

### Ключевые индикаторы

| Паттерн | Риск | Действие |
|---------|------|----------|
| "Вы обещали..." | Высокий | Проверить невыполненные обещания |
| "У конкурентов..." | Критический | Срочный звонок от руководства |
| "Надоело", "Устали" | Высокий | Назначить встречу |
| Долгая тишина (>2 недель) | Средний | Проактивный контакт |
| Короткие ответы после развёрнутых | Средний | Уточнить всё ли ок |

### Тренд-анализ

```
Январь:  😊 Позитив  ████████░░  80%
Февраль: 😐 Нейтрал  █████░░░░░  50%
Март:    😟 Негатив  ███░░░░░░░  30%
                     ↓
         🚨 ALERT: Тренд ухудшается!
```

---

## Как это встраивается в нашу систему

### Текущая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                 Customer Intelligence Platform              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Jitsi] ──► [Whisper] ──► [GLM Summary] ──┐               │
│                                             │               │
│  [Telegram] ──► [Daily Sync] ──────────────┤               │
│                                             │               │
│  [Bitrix] ──► [API Sync] ──────────────────┤               │
│                                             ▼               │
│                                      ┌───────────┐          │
│                                      │ PostgreSQL│          │
│                                      │ + pgvector│          │
│                                      └─────┬─────┘          │
│                                            │                │
│                                      ┌─────▼─────┐          │
│                                      │  RAG Chat │          │
│                                      │  Alerts   │          │
│                                      └───────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### С добавлением Churn Prediction

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 Customer Intelligence Platform v2.0                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Jitsi] ──► [Whisper] ──► [GLM Summary] ──┐                           │
│                                 │           │                           │
│                                 ▼           │                           │
│                          [Sentiment AI] ────┤                           │
│                                             │                           │
│  [Telegram] ──► [Daily Sync] ──────────────┤                           │
│                       │                     │                           │
│                       ▼                     │                           │
│                [Sentiment AI] ──────────────┤                           │
│                                             │                           │
│  [Bitrix] ──► [API Sync] ──────────────────┤                           │
│                                             │                           │
│  [WMS API] ──► [Metrics Collector] ────────┤                           │
│                                             ▼                           │
│                                      ┌───────────────┐                  │
│                                      │   PostgreSQL  │                  │
│                                      │   + pgvector  │                  │
│                                      └───────┬───────┘                  │
│                                              │                          │
│         ┌────────────────────────────────────┼────────────────┐        │
│         │                                    │                │        │
│         ▼                                    ▼                ▼        │
│  ┌─────────────┐                    ┌───────────────┐  ┌───────────┐  │
│  │ Health Score│ ◄──────────────────│ Churn Model   │  │  RAG Chat │  │
│  │ Calculator  │                    │ (ML Predictor)│  └───────────┘  │
│  └──────┬──────┘                    └───────┬───────┘                  │
│         │                                   │                          │
│         └───────────────┬───────────────────┘                          │
│                         ▼                                              │
│                  ┌─────────────┐                                       │
│                  │Smart Alerts │                                       │
│                  │ + Save Plays│                                       │
│                  └─────────────┘                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Технические изменения

### 1. Новые таблицы в БД

```sql
-- Customer Health Scores (ежедневный снепшот)
CREATE TABLE customer_health_scores (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    date DATE NOT NULL,
    
    -- Scores (0-100)
    overall_score INTEGER NOT NULL,
    engagement_score INTEGER,
    sentiment_score INTEGER,
    operations_score INTEGER,
    financial_score INTEGER,
    relationship_score INTEGER,
    
    -- Trend
    score_change INTEGER,  -- vs предыдущий день
    trend VARCHAR(20),     -- 'improving', 'stable', 'declining'
    
    -- Risk
    churn_risk VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    churn_probability FLOAT,
    
    -- Details
    risk_factors JSONB,     -- ["low_engagement", "negative_sentiment"]
    recommendations JSONB,  -- ["schedule_call", "offer_discount"]
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sentiment history
CREATE TABLE sentiment_history (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    source VARCHAR(50),     -- 'call', 'message', 'email'
    source_id UUID,         -- ID of call/message
    
    sentiment VARCHAR(20),  -- 'positive', 'neutral', 'negative'
    score FLOAT,            -- -1.0 to 1.0
    emotions JSONB,         -- ["frustration", "satisfaction"]
    key_phrases JSONB,      -- ["problem with delivery", "thank you"]
    
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- Engagement events
CREATE TABLE engagement_events (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    event_type VARCHAR(50), -- 'call', 'message', 'meeting', 'support_ticket'
    direction VARCHAR(20),  -- 'inbound', 'outbound'
    occurred_at TIMESTAMP,
    metadata JSONB
);
```

### 2. Новые API endpoints

```
POST /api/health/calculate/{customer_id}  -- Пересчитать health score
GET  /api/health/{customer_id}            -- Текущий health score
GET  /api/health/{customer_id}/history    -- История health score
GET  /api/health/at-risk                  -- Список клиентов в зоне риска

POST /api/sentiment/analyze               -- Анализ текста
GET  /api/sentiment/{customer_id}/trend   -- Тренд тональности

GET  /api/churn/predictions               -- Прогнозы оттока
GET  /api/churn/{customer_id}/factors     -- Факторы риска клиента
```

### 3. Новые сервисы (backend)

```python
# app/services/sentiment.py
async def analyze_sentiment(text: str) -> SentimentResult:
    """Analyze text sentiment using GLM-4."""
    ...

# app/services/health_score.py
async def calculate_health_score(customer_id: UUID) -> HealthScore:
    """Calculate customer health score from all signals."""
    ...

# app/services/churn_predictor.py
async def predict_churn_risk(customer_id: UUID) -> ChurnPrediction:
    """Predict churn probability based on health score and patterns."""
    ...
```

### 4. Новые Celery tasks (worker)

```python
# Ежедневный пересчёт health scores всех клиентов
@celery_app.task
def daily_health_score_calculation():
    """Run at 06:00 every day."""
    ...

# Анализ sentiment после каждого созвона/сообщения
@celery_app.task
def analyze_communication_sentiment(source_type: str, source_id: str):
    """Triggered after call transcription or message import."""
    ...

# Генерация алертов на основе health scores
@celery_app.task
def generate_health_alerts():
    """Run after health score calculation."""
    ...
```

---

## Алерты и "Save Plays"

### Типы алертов

| Алерт | Триггер | Действие |
|-------|---------|----------|
| 🔴 CHURN_CRITICAL | Health <40 + негативный тренд | Звонок руководства |
| 🟠 ENGAGEMENT_DROP | Нет коммуникации >2 недель | Проактивный контакт |
| 🟠 SENTIMENT_DECLINE | 3+ негативных сообщения подряд | Звонок менеджера |
| 🟡 VOLUME_DROP | Отгрузки упали >30% | Уточнить причину |
| 🟡 HIGH_RESERVES | Много броней, мало отгрузок | Проверить ситуацию |
| 🔴 COMPETITOR_MENTION | Упоминание конкурентов | Срочный анализ |

### "Save Plays" — что делать

```
Алерт: CHURN_CRITICAL
Клиент: ООО "Рога и Копыта"
Health Score: 35 (было 72 месяц назад)

Рекомендованные действия:
1. ⚡ Срочный звонок от руководства (в течение 24ч)
2. 📋 Подготовить анализ всех проблем клиента
3. 💰 Рассмотреть спец.условия/скидку
4. 🗓️ Назначить QBR-встречу на следующей неделе
5. 📊 Предоставить roadmap улучшений

История проблем:
- 15.01: Жалоба на задержку доставки
- 22.01: "Устали ждать" в переписке
- 05.02: Отменил 2 встречи подряд
- 10.02: Упоминал "смотрим варианты"
```

---

## Roadmap реализации

### Phase 4.1: Sentiment Analysis (1 неделя)
- [ ] Добавить analyze_sentiment в GLM service
- [ ] Интегрировать в transcription pipeline
- [ ] Интегрировать в messages import
- [ ] Создать sentiment_history таблицу
- [ ] API endpoint для sentiment trend

### Phase 4.2: Health Score (1 неделя)
- [ ] Создать таблицу customer_health_scores
- [ ] Реализовать calculate_health_score service
- [ ] Celery task для ежедневного расчёта
- [ ] API endpoints
- [ ] UI: виджет health score в карточке клиента

### Phase 4.3: Smart Alerts (1 неделя)
- [ ] Расширить типы алертов
- [ ] Логика генерации на основе health score
- [ ] "Save plays" рекомендации
- [ ] UI: dashboard с at-risk клиентами
- [ ] Опционально: Telegram уведомления

### Phase 4.4: WMS Integration (1 неделя)
- [ ] Подключить WMS API
- [ ] Собирать операционные метрики
- [ ] Включить в health score calculation
- [ ] Алерты на аномалии (много броней, резкий вывоз)

---

## Примеры запросов к RAG-чату

С добавлением churn prediction, RAG-чат становится ещё мощнее:

**"Почему у этого клиента упал health score?"**
> Health score упал с 75 до 52 за последние 2 недели. 
> Основные причины:
> 1. Негативный тренд тональности (3 сообщения с жалобами)
> 2. Снижение вовлечённости (не ответил на 2 письма)
> 3. Операционные проблемы (2 инцидента с доставкой)

**"Кто из клиентов в зоне риска?"**
> Сейчас 3 клиента в красной зоне:
> 1. ООО "Альфа" (score: 38) — негативный sentiment, упоминал конкурентов
> 2. ИП Иванов (score: 42) — резко снизились объёмы
> 3. ООО "Бета" (score: 45) — не отвечает 3 недели

**"Что обсуждали с клиентом Х за последний месяц и какой был настрой?"**
> За январь 2026 было 3 созвона:
> - 05.01: Обсуждение тарифов (нейтральный)
> - 15.01: Проблема с доставкой (негативный)
> - 28.01: QBR встреча (позитивный, решили проблемы)
> Тренд: улучшение после решения проблем

---

## Метрики успеха

| Метрика | Текущее | Цель |
|---------|---------|------|
| Время на подготовку к звонку | 15-30 мин | 2-5 мин |
| Пропущенные сигналы оттока | Много | <10% |
| Churn rate | ? | -25% за 6 месяцев |
| Время реакции на проблему | Дни | Часы |
| Точность предсказания churn | - | >80% |

---

## Ссылки и ресурсы

- [Gainsight Customer Health Score Guide](https://www.gainsight.com/blog/customer-health-scores/)
- [ChurnZero Health Scoring](https://churnzero.com/blog/four-step-strategy-customer-health-score-program/)
- [Pedowitz Group: Churn Prediction from Sentiment](https://www.pedowitzgroup.com/churn-prediction-from-sentiment-signals-in-customer-feedback)
- [ZenML Churn Prediction Example](https://github.com/zenml-io/zenml/tree/main/examples/deploying_ml_model)
