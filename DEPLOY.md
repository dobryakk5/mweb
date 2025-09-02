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

# Собираем проект (только backend компоненты)
pnpm build --filter @acme/api --filter @acme/db

# Установить tsx локально для production (проще чем компиляция)
pnpm add tsx --workspace-root
```

## Шаг 3: Настройка окружения

```bash
# Создаем конфиг API
cp services/api/.env.example services/api/.env
```

Отредактируйте `services/api/.env`:
```env
PORT=13001
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_db
PYTHON_API_URL=http://localhost:8008  # если есть Python API
```

## Шаг 4: Настройка базы данных

```bash
# Создаем и применяем миграции
cd packages/db
pnpm db:migrate
```

## Шаг 5: Запуск в production

### Вариант 1A: PM2 с компиляцией (рекомендуется для production)

```bash
# Компилируем TypeScript в JavaScript (теперь работает!)
cd services/api && npx tsc -p tsconfig.build.json
cd ../scheduler && npx tsc -p tsconfig.json

# Создаем ecosystem файл для скомпилированного JS
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
      watch: false,
      cron_restart: '0 0 * * *'  // Перезапуск каждый день в полночь
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
- Build command: `pnpm build --filter @acme/web`
- Publish directory: `apps/web/out` (для статической сборки) или `apps/web/.next` (для серверной)

**Environment variables:**
1. Зайдите в Netlify Dashboard → Site Settings → Environment variables
2. Добавьте/обновите переменные:
   - `NEXT_PUBLIC_API_URL` = `http://your-server-ip:13001` (или `https://your-api-domain.com`)
   - `NODE_VERSION` = `18` (или выше)

**netlify.toml в корне проекта:**
```toml
[build]
  command = "pnpm build --filter @acme/web"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "18"
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
pnpm build --filter @acme/api --filter @acme/db

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