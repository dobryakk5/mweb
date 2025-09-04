# MWeb - Система управления недвижимостью

Веб-приложение для управления квартирами и объявлениями о продаже недвижимости.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- pnpm
- PostgreSQL
- Python 3.8+ (для API парсинга недвижимости)

### Установка и запуск

lsof -ti :13000 | xargs kill -9

1. **Клонирование и установка зависимостей**
```bash
git clone <repository-url>
cd mweb
pnpm install
```

2. **Настройка базы данных**
```bash
cd packages/db
pnpm setup-db
```

3. **Запуск API сервиса**
```bash
cd services/api
# Создайте .env файл с настройками
cp .env.example .env
# Отредактируйте .env файл
pnpm dev
```

4. **Запуск веб-приложения**
```bash
cd apps/web
# Создайте .env.local файл
echo "NEXT_PUBLIC_API_URL=http://localhost:13001" > .env.local
pnpm dev
```

## 🔧 Настройка API парсинга недвижимости

### Переменные окружения

В файле `services/api/.env`:
```env
# Порт для API сервиса
PORT=13001

# URL Python API для парсинга недвижимости
PYTHON_API_URL=http://localhost:8008

# Настройки базы данных
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

В файле `apps/web/.env.local`:
```env
# URL API сервиса для фронтенда
NEXT_PUBLIC_API_URL=http://localhost:13001
```

### Python API

Для работы парсинга недвижимости требуется запущенный Python API сервис на порту 8008.

API должен поддерживать следующие эндпоинты:
- `POST /parse` - парсинг одного объявления
- `POST /parse-batch` - пакетный парсинг
- `POST /parse-text` - парсинг из текста
- `GET /health` - проверка состояния

## 📱 Функциональность

### Управление квартирами
- Добавление, редактирование и удаление квартир
- Поиск и фильтрация
- Пагинация

### Управление объявлениями
- Создание объявлений о продаже
- Автоматическая загрузка цен из внешних источников
- Парсинг данных о недвижимости

### Парсинг недвижимости
- **`GET /property-parser/parse?url={url}`** - парсинг одного объявления
- **`POST /property-parser/parse-urls`** - пакетный парсинг
- **`POST /property-parser/parse-text`** - парсинг из текста
- **`POST /property-parser/parse-with-retry`** - парсинг с retry логикой
- **`GET /property-parser/health`** - проверка состояния Python API

## 🏗️ Архитектура

```
mweb/
├── apps/
│   └── web/                 # Next.js веб-приложение
├── packages/
│   ├── db/                  # База данных и схемы
│   ├── ui/                  # UI компоненты
│   └── id/                  # Утилиты для ID
├── services/
│   └── api/                 # Fastify API сервис
└── tools/                   # Инструменты разработки
```

## 🔌 API Endpoints

### Основные эндпоинты
- **`/ads`** - управление объявлениями
- **`/users`** - управление пользователями
- **`/user-flats`** - управление квартирами пользователей
- **`/property-parser/*`** - парсинг недвижимости

## 🧪 Тестирование

### Проверка API
```bash
# Проверка основного health check
curl http://localhost:13001/health

# Проверка парсера недвижимости
curl "http://localhost:13001/property-parser/parse?url=https://example.com"

# Проверка health check парсера
curl http://localhost:13001/property-parser/health
```

## 📚 Документация

- [Настройка базы данных](packages/db/README.md)
- [API сервис](services/api/README.md)
- [UI компоненты](packages/ui/README.md)

## 🤝 Разработка

### Команды разработки

```bash
# Установка зависимостей
pnpm install

# Сборка всех пакетов
pnpm build

# Запуск в режиме разработки
pnpm dev

# Проверка типов
pnpm typecheck

# Линтинг
pnpm lint
```

### Структура проекта

Проект использует монорепозиторий с pnpm workspaces:
- `apps/` - приложения
- `packages/` - переиспользуемые пакеты
- `services/` - микросервисы
- `tools/` - инструменты разработки

## 📄 Лицензия

MIT
