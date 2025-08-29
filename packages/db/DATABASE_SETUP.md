# Настройка базы данных

## Подключение к существующей PostgreSQL базе

### 1. Создайте файл .env

Скопируйте `env.example` в `.env` и настройте подключение к вашей базе данных:

```bash
cp env.example .env
```

Отредактируйте `.env` файл:

```env
# Подключение к вашей PostgreSQL базе
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Окружение
NODE_ENV="development"
```

**Замените на ваши реальные данные:**
- `username` - имя пользователя PostgreSQL
- `password` - пароль пользователя
- `localhost` - хост базы данных
- `5432` - порт PostgreSQL (по умолчанию 5432)
- `database_name` - имя вашей базы данных

### 2. Установите зависимости

```bash
pnpm install
```

### 3. Создайте таблицу пользователей

```bash
pnpm db:setup
```

Этот скрипт:
- Подключится к вашей базе данных
- Создаст таблицу `users` на основе Drizzle схемы
- Покажет статус подключения

### 4. Добавьте реальных пользователей

```bash
pnpm db:add-users
```

Этот скрипт добавит 5 тестовых пользователей:
- John Doe (johndoe)
- Jane Smith (janesmith)  
- Bob Johnson (bobjohnson)
- Alice Williams (alicewilliams)
- Charlie Brown (charliebrown)

### 5. Альтернативно: используйте Drizzle миграции

```bash
# Сгенерировать миграцию на основе схемы
pnpm db:generate

# Применить миграцию к базе данных
pnpm db:migrate
```

### 6. Просмотр данных через Drizzle Studio

```bash
pnpm db:studio
```

Откроет веб-интерфейс для просмотра и редактирования данных.

## Структура таблицы users

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Проверка подключения

После настройки вы можете проверить, что все работает:

1. **Запустите API сервер**: `cd services/api && pnpm dev`
2. **Запустите веб-приложение**: `cd apps/web && pnpm dev`
3. **Откройте в браузере**: `http://localhost:13000/users`

Вы должны увидеть список добавленных пользователей!

## Устранение проблем

### Ошибка подключения
- Проверьте правильность DATABASE_URL
- Убедитесь, что PostgreSQL запущен
- Проверьте права доступа пользователя

### Таблица не создается
- Убедитесь, что у пользователя есть права на создание таблиц
- Проверьте, что база данных существует

### Пользователи не добавляются
- Проверьте логи на наличие ошибок
- Убедитесь, что таблица создана корректно
