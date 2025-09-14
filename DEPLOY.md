# Развертывание приложения в Production

## Обзор архитектуры

- **Frontend (Web)**: Развернут на Netlify - https://mrealty.netlify.app
- **Backend (API)**: Развертывается на self-hosted сервере 
- **Database**: PostgreSQL на self-hosted сервере

## Развертывание API сервера на Self-hosted Server

## Требования

- Node.js 18+ 
- pnpm
- PostgreSQL база данных
- PM2 (для production) или systemd

## Шаг 1: Подготовка сервера

```bash
# Установка Node.js (если нет)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка pnpm
npm install -g pnpm

# Установка PM2 для управления процессами
npm install -g pm2
```

## Шаг 2: Клонирование и сборка

```bash
# Клонируем репозиторий
git clone <your-repo-url>
cd mweb

# Устанавливаем зависимости
pnpm install

# Собираем проект по порядку: сначала db, потом остальные
cd packages/db && pnpm build  # Сначала компилируем db package в dist/
cd ../../services/api && npx tsc -p tsconfig.build.json  # Потом API
cd ../scheduler && npx tsc -p tsconfig.json  # И scheduler
cd ../../apps/web && pnpm build  # Собираем Next.js приложение
```

## Шаг 3: Настройка окружения

```bash
# Создаем конфиг API
cp services/api/.env.example services/api/.env

# Создаем конфиг для веб-приложения
cp apps/web/.env.example apps/web/.env.local
```

Отредактируйте `services/api/.env`:
```env
PORT=13001
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_db
PYTHON_API_URL=http://localhost:8008  # если есть Python API
```

Отредактируйте `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:13001
NEXT_PUBLIC_BASE_URL=http://localhost:13000
```

## Шаг 4: Настройка базы данных

```bash
# Создаем и применяем миграции
cd packages/db
pnpm db:migrate
```

### Настройка синхронизации с публичными таблицами

Система включает автоматическую синхронизацию данных между пользовательскими и публичными таблицами. 

**Архитектура синхронизации:**

1. **Пользовательские таблицы** (`users.ads`, `users.user_flats`):
   - Содержат данные пользователей и их объявления
   - Обновляются парсером и пользователем напрямую
   - Имеют кеширующие поля: `house_id`, `person_type_id`

2. **Публичные таблицы** (`public.flats`, `public.flats_history`, `public.flats_changes`):
   - Нормализованные данные для анализа и поиска
   - Обновляются через процедуру синхронизации
   - `flats_changes` - детальная история изменений цены и статуса
   - Связаны с lookup-таблицами для типизированных значений

**Процесс синхронизации:**

```bash
# 1. Установка прав пользователя БД (от имени администратора)
psql "postgresql://admin:password@host:5432/db" -f grant_permissions.sql

# 2. Создание процедур синхронизации в схеме users (от имени администратора) 
psql "postgresql://admin:password@host:5432/db" -f transfer_to_public_flats.sql
```

**Автоматическая синхронизация:**

- **Scheduler** (ежедневно в 23:00): автоматически синхронизирует все обработанные объявления
- **API endpoint**: `POST /ads/transfer-to-public` для ручной синхронизации
- **Оптимизация**: повторные синхронизации используют кеш (`house_id`, `person_type_id`)

**Логика маппинга данных:**

1. **Определение source_id по URL:**
   - `cian.ru` → 4 (Cian)
   - `avito.ru` → 1 (Avito) 
   - `realty.yandex.ru`, `realty.ya.ru` → 3 (Yandex)
   - Остальные → 2 (Other)

2. **Извлечение avitoid из URL:** последние цифры в URL
   
3. **Маппинг house_type:** через `public.lookup_types` с fuzzy поиском

4. **Определение person_type_id:**
   - Приоритет: строковое значение от парсера
   - Fallback: анализ описания/тегов на ключевые слова
   - 1 = Частное лицо, 2 = Агентство, 3 = Собственник

5. **Получение house_id:** через `public.get_house_id_by_address(address)`

**Файлы конфигурации:**

- `grant_permissions.sql` - права для пользователя БД
- `transfer_to_public_flats.sql` - процедуры синхронизации  
- `update_cache_only.sql` - тестовая процедура (только кеш)

**Новые API endpoints:**

- `GET /ads/:id/price-changes` - получить изменения цены для одного объявления
- `POST /ads/price-changes` - получить изменения цены для нескольких объявлений

**Мониторинг синхронизации:**

```bash
# Проверка логов scheduler
pm2 logs scheduler

# Ручная синхронизация через API
curl -X POST http://localhost:13001/ads/transfer-to-public \
  -H "Content-Type: application/json" \
  -d '{"adIds": [4, 11, 20]}'

# Проверка изменений цены
curl -X GET http://localhost:13001/ads/4/price-changes

# Проверка заполненности кеша
psql "postgresql://user:pass@host:5432/db" -c "
  SELECT id, house_id, person_type_id 
  FROM users.ads 
  WHERE house_id IS NOT NULL OR person_type_id IS NOT NULL;"

# Проверка записей в flats_changes
psql "postgresql://user:pass@host:5432/db" -c "
  SELECT fc.*, fh.url 
  FROM public.flats_changes fc 
  JOIN public.flats_history fh ON fc.flats_history_id = fh.id 
  ORDER BY fc.updated DESC LIMIT 10;"
```

## Шаг 5: Запуск в production

### Вариант 1A: PM2 с компиляцией (рекомендуется для production)

```bash
# Компилируем TypeScript в JavaScript (теперь работает!)
cd services/api && npx tsc -p tsconfig.build.json
cd ../scheduler && npx tsc -p tsconfig.json
cd ../../apps/web && pnpm build



# Создаем ecosystem файл для скомпилированного JS
⏺ ecosystem.config.js должен лежать в корне проекта на
  сервере, то есть в директории /var/py/mweb/.

  /var/py/mweb/
  ├── ecosystem.config.js  ← здесь
  ├── package.json
  ├── services/
  │   ├── api/
  │   └── scheduler/
  ├── packages/
  └── apps/

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'acme-api',
      script: './services/api/dist/index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 13001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      watch: false
    },
    {
      name: 'acme-web',
      script: 'npm',
      args: 'start',
      cwd: './apps/web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 13000,
        NEXT_PUBLIC_API_URL: 'http://localhost:13001',
        NEXT_PUBLIC_BASE_URL: 'http://localhost:13000'
      },
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
      watch: false
    },
    {
      name: 'scheduler',
      script: './services/scheduler/dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/scheduler-error.log',
      out_file: './logs/scheduler-out.log',
      log_file: './logs/scheduler-combined.log',
      time: true,
      watch: false
    }
  ]
}
EOF

# Создаем папку для логов
mkdir -p logs

# Запускаем
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # настройка автозапуска
```

### Вариант 2: systemd с tsx

```bash
# Создаем service файл для API
sudo cat > /etc/systemd/system/acme-api.service << 'EOF'
[Unit]
Description=Acme API Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/mweb
Environment=NODE_ENV=production
Environment=PORT=13001
ExecStart=/path/to/your/mweb/node_modules/.bin/tsx services/api/index.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Создаем service файл для Scheduler
sudo cat > /etc/systemd/system/acme-scheduler.service << 'EOF'
[Unit]
Description=Acme Scheduler Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/mweb
Environment=NODE_ENV=production
ExecStart=/path/to/your/mweb/node_modules/.bin/tsx services/scheduler/src/index.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Запускаем оба сервиса
sudo systemctl daemon-reload
sudo systemctl enable acme-api acme-scheduler
sudo systemctl start acme-api acme-scheduler
```

### Вариант 3: Простой запуск в screen/tmux

```bash
# Запуск API сервера
screen -S api-server
cd /path/to/your/mweb
NODE_ENV=production PORT=13001 ./node_modules/.bin/tsx services/api/index.ts
# Detach: Ctrl+A, D

# Запуск Scheduler в отдельной сессии
screen -S scheduler
cd /path/to/your/mweb
NODE_ENV=production ./node_modules/.bin/tsx services/scheduler/src/index.ts
# Detach: Ctrl+A, D

# Просмотр активных сессий: screen -ls
# Подключение: screen -r api-server или screen -r scheduler
```

## Шаг 6: Настройка Nginx (опционально)

```nginx
# /etc/nginx/sites-available/acme-api
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:13001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активируем сайт
sudo ln -s /etc/nginx/sites-available/acme-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Шаг 7: Настройка Frontend на Netlify

Frontend уже развернут на Netlify: https://mrealty.netlify.app

### Настройка сборки в Netlify

В настройках Netlify необходимо указать:

**Build settings:**
- Build command: `cd ../.. && pnpm build --filter @acme/web` 
- Publish directory: `.next` (так как netlify.toml находится в apps/web/)

**Environment variables:**
1. Зайдите в Netlify Dashboard → Site Settings → Environment variables
2. Добавьте/обновите переменные:
   - `NEXT_PUBLIC_API_URL` = `http://your-server-ip:13001` (или `https://your-api-domain.com`)
   - `NODE_VERSION` = `18` (или выше)

**netlify.toml в apps/web/ (автоматически):**
```toml
[build]
  command = "cd ../.. && pnpm build --filter @acme/web"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

# Redirect all to index.html for SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

После изменений Netlify автоматически пересоберет и задеплоит приложение.

## Мониторинг и логи

```bash
# PM2 команды
pm2 status
pm2 logs acme-api
pm2 logs scheduler
pm2 restart acme-api
pm2 restart scheduler
pm2 stop acme-api
pm2 stop scheduler

# systemd команды  
sudo systemctl status acme-api
sudo systemctl status acme-scheduler
sudo journalctl -u acme-api -f
sudo journalctl -u acme-scheduler -f
sudo systemctl restart acme-api
sudo systemctl restart acme-scheduler
```

## Обновление

```bash
# Остановка
pm2 stop all  # или sudo systemctl stop acme-api acme-scheduler

# Обновление кода
git pull origin main
pnpm install
pnpm build --filter @acme/db --filter @acme/api --filter @acme/web

# Запуск
pm2 start ecosystem.config.js  # или sudo systemctl start acme-api acme-scheduler
```

## Безопасность

1. **Firewall**: разрешить только нужные порты
2. **SSL**: использовать Nginx с Let's Encrypt
3. **Environment**: не коммитить `.env` файлы
4. **Updates**: регулярно обновлять зависимости

```bash
# Настройка firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```