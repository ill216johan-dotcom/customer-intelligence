# База знаний ошибок

## Ошибки установки

### Docker: "Cannot connect to the Docker daemon"

**Симптом:**
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Причина:** Docker не запущен или пользователь не в группе docker.

**Решение:**
```bash
# Запустить Docker
sudo systemctl start docker

# Добавить пользователя в группу
sudo usermod -aG docker $USER
# Перелогиниться или выполнить:
newgrp docker
```

---

### PostgreSQL: "FATAL: password authentication failed"

**Симптом:**
```
FATAL: password authentication failed for user "ci_user"
```

**Причина:** Пароль в .env не совпадает с паролем в базе.

**Решение:**
```bash
# Удалить volume и пересоздать
docker compose down
docker volume rm customer-intelligence_postgres_data
docker compose up -d
```

---

## Ошибки транскрипции

### Whisper: "CUDA out of memory"

**Симптом:**
```
RuntimeError: CUDA out of memory
```

**Причина:** Недостаточно памяти GPU.

**Решение:**
1. Использовать CPU режим: `WHISPER_DEVICE=cpu`
2. Использовать меньшую модель: `WHISPER_MODEL=medium`

---

### Whisper: "Could not load model"

**Симптом:**
```
Could not load model large-v3
```

**Причина:** Модель не скачана или недостаточно места.

**Решение:**
```bash
# Проверить место
df -h

# Перезапустить worker (модель скачается заново)
docker compose restart worker

# Логи скачивания
docker compose logs -f worker
```

---

## Ошибки API

### 422 Unprocessable Entity

**Симптом:**
```json
{"detail": [{"loc": ["body", "email"], "msg": "field required"}]}
```

**Причина:** Не передано обязательное поле.

**Решение:** Проверить тело запроса по документации API.

---

### 401 Unauthorized

**Симптом:**
```json
{"detail": "Could not validate credentials"}
```

**Причина:** Токен истёк или неверный.

**Решение:** Получить новый токен через `/auth/login`.

---

## Ошибки интеграций

### Telegram: "Phone number invalid"

**Симптом:** При авторизации Telethon.

**Причина:** Неверный формат номера.

**Решение:** Указать номер в формате `+79001234567` (с кодом страны).

---

### GLM API: "API rate limit exceeded"

**Симптом:**
```
Error: API rate limit exceeded
```

**Причина:** Превышен лимит запросов.

**Решение:** 
1. Подождать и повторить
2. Увеличить тариф на https://open.bigmodel.cn/

---

## Логирование

### Где смотреть логи

```bash
# Все сервисы
docker compose logs

# Конкретный сервис
docker compose logs backend
docker compose logs worker

# В реальном времени
docker compose logs -f --tail=100

# Только ошибки
docker compose logs 2>&1 | grep -i error
```

---

## Добавление новых ошибок

При обнаружении новой ошибки, добавьте её в формате:

```markdown
### Название ошибки

**Симптом:**
[Текст ошибки или описание]

**Причина:** [Почему возникает]

**Решение:**
[Шаги исправления]
```
