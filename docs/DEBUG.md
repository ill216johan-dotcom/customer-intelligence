# Customer Intelligence — Отчёт об ошибках и текущем состоянии

> Дата: 17.02.2026  
> Составлен для продолжения отладки

---

## TL;DR — Что работает и что нет

| Компонент | Статус | Примечание |
|-----------|--------|------------|
| Все Docker контейнеры | ✅ UP | backend, frontend, worker, redis, postgres, n8n |
| Авторизация (логин) | ✅ Работает | form-data, JWT токен |
| Загрузка аудиофайла | ✅ Работает | mp3, wav, webm, mp4 |
| Задача попадает в Celery | ✅ Работает | после исправления очереди |
| Whisper транскрипция | ⚠️ Работает, но МЕДЛЕННО | CPU-only, ~1:1 с реальным временем |
| GLM саммари | ⚠️ Частично | 429 rate limit при частых тестах, ключ рабочий |
| Прогресс-бар в % | ❌ Не работает | progress=null для текущих задач |
| Статус "completed" в браузере | ⚠️ Ждёт | файл ещё обрабатывается (~50 мин) |

---

## Проблема 1 (РЕШЕНА): Задачи не доходили до worker

### Симптом
Загружаешь файл, статус навсегда `processing`. В логах worker — тишина.

### Корневая причина
Несоответствие имён очередей:
- `backend/app/api/calls.py` строка 237 отправлял задачу в очередь **`"transcription"`**
- `worker/tasks/celery_app.py` строка 34 роутил задачи в очередь **`"celery"`**
- Задачи падали в Redis в очередь `transcription` и там гнили навсегда

### Фикс
```python
# backend/app/api/calls.py — было:
celery_app.send_task("tasks.transcribe.process_audio", args=[...], queue="transcription")

# стало:
celery_app.send_task("tasks.transcribe.process_audio", args=[...], queue="celery")
```

```python
# backend/app/celery.py — было:
celery_app.conf.task_routes = {"tasks.transcribe.*": {"queue": "transcription"}}

# стало:
celery_app.conf.task_routes = {"tasks.transcribe.*": {"queue": "celery"}}
```

### Проверка
```bash
docker-compose exec redis redis-cli LLEN celery   # должно быть 0 (нет застрявших задач)
docker-compose logs worker | grep "Task.*received" # должны быть строки после загрузки
```

---

## Проблема 2 (РЕШЕНА): WHISPER_MODEL=large-v3 в .env

### Симптом
Worker запускался с моделью `large-v3` (10GB+) вместо `small` (461MB). OOM-kill.

### Корневая причина
В `docker-compose.yml` стояло `${WHISPER_MODEL:-small}`, но в `.env` явно было `WHISPER_MODEL=large-v3`.
`.env` всегда переопределяет дефолт в docker-compose.

### Фикс
```bash
# .env — было:
WHISPER_MODEL=large-v3

# стало:
WHISPER_MODEL=small
```

### Проверка
```bash
docker-compose exec worker env | grep WHISPER
# Должно быть: WHISPER_MODEL=small
```

---

## Проблема 3: Транскрипция ОЧЕНЬ медленная на CPU

### Симптом
31-минутный webm файл обрабатывается ~50 минут. Пользователь видит `processing` целый час.

### Корневая причина
- Whisper `small` на CPU работает примерно 1:1 с реальным временем аудио
- На машине нет GPU (нет CUDA)
- Параллельно запускаются 2 worker-процесса (concurrency=2), они делят CPU и оба тормозят

### Логи показывают
```
ForkPoolWorker-1: 10%|#| 26000/248976 [07:40<1:06:21, 56 frames/s]
ForkPoolWorker-2: 36%|###5| 88600/248976 [17:39<40:26, 66 frames/s]
```
Два процесса одновременно = каждый работает медленнее.

### Варианты фикса

**Вариант A — Снизить concurrency до 1 (быстрый фикс):**
```yaml
# worker/Dockerfile — в CMD добавить --concurrency=1
CMD ["celery", "-A", "tasks.celery_app", "worker", "--loglevel=info", "--concurrency=1"]
```

**Вариант B — Использовать модель `tiny` вместо `small`:**
```bash
# .env
WHISPER_MODEL=tiny  # 72MB, в 4-5x быстрее small, хуже качество
```

**Вариант C (production) — GPU:**
```yaml
# docker-compose.yml
worker:
  environment:
    - WHISPER_DEVICE=cuda
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

**Вариант D — API вместо self-hosted:**
Использовать OpenAI Whisper API вместо локального:
```python
# ~$0.006/мин аудио, 31 мин = ~$0.18
import openai
result = openai.audio.transcriptions.create(model="whisper-1", file=audio_file)
```

---

## Проблема 4 (ЧАСТИЧНО РЕШЕНА): GLM API — неверное имя модели + rate limit

### Симптом A — Неверная модель
Worker пытался вызвать `glm-4` и `glm-4-flash` — оба не существуют.
Ответ API: `{"code": "1211", "message": "模型不存在"}`

### Корневая причина
Коды моделей GLM API обновились. Старые имена (`glm-4`, `glm-4-flash`) устарели.

### Доступные модели (проверено через API)
```json
["glm-4.5", "glm-4.5-air", "glm-4.6", "glm-4.7", "glm-5"]
```

### Фикс
```python
# worker/tasks/transcribe.py
GLM_MODEL = os.environ.get("GLM_MODEL", "glm-4.5-air")  # самая дешёвая/быстрая
```
```python
# backend/app/services/llm.py
self.model = "glm-4.5-air"
```

### Симптом B — Rate limit 429
При тестировании несколько запросов подряд → `HTTP 429 Too Many Requests`.

### Корневая причина
Ключ в `.env` (`GLM_API_KEY=5b3adbb6...`) рабочий, баланс есть, но бесплатный tier имеет RPM лимит.

### Фикс (добавлен retry)
```python
# worker/tasks/transcribe.py
for attempt in range(3):
    try:
        response = httpx.post(...)
        response.raise_for_status()
        break
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            wait_time = 15 * (attempt + 1)  # 15s, 30s, 45s
            time.sleep(wait_time)
            continue
        raise
```

### Что ещё нужно сделать
- Добавить `GLM_MODEL=glm-4.5-air` в `.env` (сейчас берётся дефолт из кода)
- Проверить баланс аккаунта на https://open.bigmodel.cn/

---

## Проблема 5: Прогресс-бар показывает `null` вместо %

### Симптом
`GET /api/calls/{id}/status` возвращает `"progress": null` всегда.

### Корневая причина
- Добавлена колонка `processing_progress` в БД: `ALTER TABLE calls ADD COLUMN processing_progress integer`
- Добавлен progress callback в worker через патчинг `whisper.transcribe.tqdm`
- НО: патч работает только если worker пересобран с новым кодом
- Текущий worker-процесс (`ForkPoolWorker-2`) запущен до пересборки — не имеет нового кода

### Как будет работать для следующих загрузок
1. Worker патчит `whisper.transcribe.tqdm` классом `_PatchedTqdm`
2. При каждом обновлении tqdm вызывает `update_call_status(call_id, "processing", progress=pct)`
3. Фронтенд каждые 5 секунд читает `/status` и показывает `{progress}%`

### Проверка что код попал в контейнер
```bash
docker-compose exec worker grep -c 'generate_summary_glm' /app/tasks/transcribe.py
# должно быть 2
docker-compose exec worker grep 'wait_time = 15' /app/tasks/transcribe.py
# должна быть строка
```

---

## Проблема 6: Два worker-процесса гонятся параллельно

### Симптом
В логах одновременно:
```
ForkPoolWorker-1: 10%...
ForkPoolWorker-2: 36%...
```
Два тяжёлых файла обрабатываются одновременно, делят CPU, оба тормозят.

### Корневая причина
Celery по умолчанию `concurrency=2` (по числу CPU-ядер). Whisper занимает всё CPU.

### Фикс
```yaml
# worker/Dockerfile — в конце файла
CMD ["celery", "-A", "tasks.celery_app", "worker", "--loglevel=info", "--concurrency=1"]
```
После этого задачи обрабатываются последовательно, но каждая быстрее.

---

## Проблема 7: test.mp3 и test_audio.wav — фейковые файлы

### Симптом
Загрузка `test.mp3` → ffmpeg ошибка `Failed to find two consecutive MPEG audio frames`.

### Причина
`test.mp3` = 1 байт, `test_audio.wav` = 44 байта. Это заглушки, не реальное аудио.

### Как создать реальный тестовый файл
```bash
# В контейнере worker:
docker-compose exec worker bash -c "ffmpeg -f lavfi -i 'sine=frequency=440:duration=5' -ar 16000 /app/audio/test_real.wav -y"
docker cp ci-worker:/app/audio/test_real.wav ./test_real.wav
```

---

## Текущее состояние на момент составления отчёта

### Что активно происходит
```
ForkPoolWorker-2: 36% из файла 45c966a9 (загружен из браузера)
ForkPoolWorker-1: 12% из другого тестового файла
Estimata ForkPoolWorker-2: ~40 минут осталось
```

### Команды для мониторинга
```bash
# Логи worker в реальном времени
docker-compose logs worker -f

# Статус конкретного звонка
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=admin123" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
curl -s http://localhost:8000/api/calls/45c966a9-72be-4e7e-be27-674311cd0189/status \
  -H "Authorization: Bearer $TOKEN"

# Что в очереди Redis
docker-compose exec redis redis-cli LLEN celery

# Перезапуск с нуля
docker-compose restart backend worker
```

---

## Архитектурные изменения за сессию

### Файлы изменены
| Файл | Что изменено |
|------|-------------|
| `backend/app/api/calls.py` | Очередь `transcription` → `celery`, добавлен `processing_progress` в статус |
| `backend/app/celery.py` | Роутинг очереди `transcription` → `celery` |
| `backend/app/models/models.py` | Добавлено поле `processing_progress: Optional[int]` |
| `backend/app/services/llm.py` | Модель `glm-4` → `glm-4.5-air` |
| `worker/tasks/transcribe.py` | GLM интеграция, retry логика, progress callback через tqdm патч |
| `worker/tasks/celery_app.py` | Роутинг очереди |
| `docker-compose.yml` | `WHISPER_MODEL=small`, volume mount `./worker:/app` |
| `.env` | `WHISPER_MODEL=large-v3` → `small` |

### БД изменения
```sql
ALTER TABLE calls ADD COLUMN IF NOT EXISTS processing_progress integer DEFAULT NULL;
```

---

## Следующие шаги для доведения до рабочего состояния

### Приоритет 1 — Дождаться текущей транскрипции
Файл `45c966a9` сейчас на 36%, ещё ~40 минут. Проверить через:
```bash
docker-compose logs worker -f | grep -E "ForkPoolWorker-2|succeeded|failed"
```

### Приоритет 2 — Снизить concurrency
```bash
# В worker/Dockerfile добавить --concurrency=1
# Потом:
docker-compose build worker && docker-compose up -d worker
```

### Приоритет 3 — Проверить полный pipeline после завершения
```bash
TOKEN=...
curl -s http://localhost:8000/api/calls/45c966a9-72be-4e7e-be27-674311cd0189 \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# Проверить: processing_status=completed, transcript≠null, summary≠null
```

### Приоритет 4 — Если GLM всё ещё 429
Добавить в `.env`:
```
GLM_MODEL=glm-4.5-air
```
И добавить дополнительную задержку между запросами или переключиться на модель через официальный Python SDK:
```bash
pip install zhipuai
```
```python
from zhipuai import ZhipuAI
client = ZhipuAI(api_key=GLM_API_KEY)
response = client.chat.completions.create(model="glm-4.5-air", messages=[...])
```

### Приоритет 5 — Для production-скорости
Рассмотреть переход на OpenAI Whisper API (платный, но мгновенный):
```python
# В worker/tasks/transcribe.py заменить Whisper на:
import openai
client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
with open(audio_path, "rb") as f:
    result = client.audio.transcriptions.create(model="whisper-1", file=f, language="ru")
transcript = result.text
```
Стоимость: $0.006/мин → 30-минутный звонок = $0.18 (~17 рублей)

---

## Credentials / endpoints для справки

| Что | Значение |
|-----|----------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| API Docs (Swagger) | http://localhost:8000/docs |
| n8n | http://localhost:5678 |
| PostgreSQL | localhost:5433, db=customer_intelligence, user=ci_user |
| Redis | localhost (внутри Docker сети) |
| Логин | admin@example.com / admin123 |
| GLM API Key | в .env GLM_API_KEY=5b3adbb6... |
| GLM API Base | https://open.bigmodel.cn/api/paas/v4 |
| GLM доступные модели | glm-4.5, glm-4.5-air, glm-4.6, glm-4.7, glm-5 |
