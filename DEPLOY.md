# Развертывание API сервера на Self-hosted Server

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

# Собираем проект
pnpm build --filter @acme/api
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

### Вариант 1: PM2 с tsx (рекомендуется)

```bash
# Устанавливаем tsx глобально
npm install -g tsx

# Создаем ecosystem файл
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'acme-api',
    script: 'tsx',
    args: './services/api/index.ts',
    instances: 1,  // tsx не поддерживает cluster mode
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 13001
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_file: './logs/api-combined.log',
    time: true,
    watch: false
  }]
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
# Создаем service файл
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
ExecStart=/usr/local/bin/tsx services/api/index.ts
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Запускаем
sudo systemctl daemon-reload
sudo systemctl enable acme-api
sudo systemctl start acme-api
```

### Вариант 3: Простой запуск в screen/tmux

```bash
# В screen сессии
screen -S api-server
cd /path/to/your/mweb
NODE_ENV=production PORT=13001 tsx services/api/index.ts

# Detach: Ctrl+A, D
# Attach: screen -r api-server
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

## Шаг 7: Обновление Frontend

Обновите переменную окружения в Netlify:
- `NEXT_PUBLIC_API_URL` = `http://your-server-ip:13001` или `https://your-api-domain.com`

## Мониторинг и логи

```bash
# PM2 команды
pm2 status
pm2 logs acme-api
pm2 restart acme-api
pm2 stop acme-api

# systemd команды  
sudo systemctl status acme-api
sudo journalctl -u acme-api -f
sudo systemctl restart acme-api
```

## Обновление

```bash
# Остановка
pm2 stop acme-api  # или sudo systemctl stop acme-api

# Обновление кода
git pull origin main
pnpm install
pnpm build --filter @acme/api

# Запуск
pm2 start acme-api  # или sudo systemctl start acme-api
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