# Инструкция по развёртыванию

## 1. Выбор VPS провайдера

### Рекомендация: Timeweb Cloud

**Почему Timeweb:**
- Хорошее соотношение цена/качество
- Простая панель управления
- Быстрая техподдержка
- Датацентры в России (низкий пинг)

**Ссылка:** https://timeweb.cloud/

### Минимальная конфигурация

| Параметр | Значение |
|----------|----------|
| CPU | 4 vCPU |
| RAM | 16 GB |
| Disk | 100 GB SSD |
| OS | Ubuntu 22.04 LTS |
| Стоимость | ~2,500 руб/мес |

### Альтернативы

| Провайдер | Конфигурация | Цена | Ссылка |
|-----------|--------------|------|--------|
| Selectel | 4/16/100 | ~3,000 руб | https://selectel.ru/ |
| VDSina | 4/16/100 | ~2,200 руб | https://vdsina.ru/ |
| Reg.ru Cloud | 4/16/100 | ~2,800 руб | https://reg.ru/ |

---

## 2. Первоначальная настройка сервера

### 2.1. Подключение по SSH

```bash
ssh root@YOUR_SERVER_IP
```

### 2.2. Создание пользователя

```bash
# Создать пользователя
adduser deploy
usermod -aG sudo deploy

# Настроить SSH ключ
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys  # Вставить свой публичный ключ
chmod 600 ~/.ssh/authorized_keys
exit

# Отключить вход по паролю (опционально, но рекомендуется)
nano /etc/ssh/sshd_config
# PasswordAuthentication no
systemctl restart sshd
```

### 2.3. Установка Docker

```bash
# Обновить систему
apt update && apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавить пользователя в группу docker
usermod -aG docker deploy

# Установить Docker Compose
apt install docker-compose-plugin -y

# Проверить
docker --version
docker compose version
```

### 2.4. Настройка файрвола

```bash
# UFW (Ubuntu Firewall)
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Проверить
ufw status
```

---

## 3. Развёртывание проекта

### 3.1. Клонирование (или копирование)

```bash
# Переключиться на deploy
su - deploy

# Создать директорию
mkdir -p ~/apps
cd ~/apps

# Вариант A: Git clone (если репозиторий настроен)
git clone https://github.com/YOUR_ORG/customer-intelligence.git
cd customer-intelligence

# Вариант B: Копирование через SCP (с локальной машины)
# scp -r ./customer-intelligence deploy@YOUR_SERVER_IP:~/apps/
```

### 3.2. Конфигурация

```bash
# Скопировать пример конфигурации
cp .env.example .env

# Отредактировать
nano .env
```

**Обязательно изменить:**

```env
# Пароли (сгенерировать надёжные!)
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
BACKEND_SECRET_KEY=RANDOM_32_CHAR_STRING
N8N_BASIC_AUTH_PASSWORD=YOUR_N8N_PASSWORD

# GLM API (получить на https://open.bigmodel.cn/)
GLM_API_KEY=your_glm_api_key
```

### 3.3. Запуск

```bash
# Запустить все сервисы
docker compose up -d

# Проверить статус
docker compose ps

# Должно быть 6 сервисов: postgres, redis, backend, worker, frontend, n8n
```

### 3.4. Проверка

```bash
# Логи backend
docker compose logs backend

# Логи worker (Whisper)
docker compose logs worker

# API health check
curl http://localhost:8000/health
# Ожидаемый ответ: {"status":"healthy"}
```

---

## 4. Настройка домена и SSL

### 4.1. DNS

Добавьте A-запись в DNS вашего домена:
```
ci.your-domain.ru → YOUR_SERVER_IP
```

### 4.2. Nginx и SSL (Let's Encrypt)

```bash
# Установить Nginx и Certbot
apt install nginx certbot python3-certbot-nginx -y

# Создать конфиг
nano /etc/nginx/sites-available/customer-intelligence
```

Содержимое конфига:

```nginx
server {
    listen 80;
    server_name ci.your-domain.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /n8n {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Активировать
ln -s /etc/nginx/sites-available/customer-intelligence /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# Получить SSL сертификат
certbot --nginx -d ci.your-domain.ru

# Автообновление сертификата (уже настроено certbot)
systemctl status certbot.timer
```

---

## 5. Обслуживание

### 5.1. Обновление

```bash
cd ~/apps/customer-intelligence

# Остановить
docker compose down

# Обновить код (git pull или scp)
git pull

# Пересобрать и запустить
docker compose build
docker compose up -d
```

### 5.2. Бэкапы

```bash
# Бэкап базы данных
docker compose exec postgres pg_dump -U ci_user customer_intelligence > backup_$(date +%Y%m%d).sql

# Бэкап аудиофайлов
tar -czvf audio_backup_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/customer-intelligence_audio_data/
```

### 5.3. Мониторинг

```bash
# Статус сервисов
docker compose ps

# Использование ресурсов
docker stats

# Логи в реальном времени
docker compose logs -f --tail=100
```

---

## 6. Troubleshooting

### Whisper не запускается

```bash
# Проверить логи worker
docker compose logs worker

# Возможные причины:
# 1. Не хватает RAM → увеличить сервер
# 2. Модель не скачалась → перезапустить worker
docker compose restart worker
```

### Backend не стартует

```bash
# Проверить подключение к БД
docker compose exec backend python -c "from app.db.database import engine; print('OK')"

# Возможные причины:
# 1. PostgreSQL не запущен → docker compose up postgres -d
# 2. Неверный пароль в .env
```

### Нет места на диске

```bash
# Очистить Docker мусор
docker system prune -a --volumes

# Удалить старые аудиофайлы (осторожно!)
# find /var/lib/docker/volumes/customer-intelligence_audio_data/ -mtime +30 -delete
```

---

## 7. Контакты поддержки

При возникновении проблем:
1. Проверьте логи: `docker compose logs`
2. Проверьте документацию: `docs/ERRORS.md`
3. Обратитесь к разработчику
