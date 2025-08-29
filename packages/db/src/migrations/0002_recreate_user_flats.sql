-- Удаляем старую таблицу user_flats
DROP TABLE IF EXISTS users.user_flats;

-- Создаем новую таблицу user_flats с правильной схемой
CREATE TABLE users.user_flats (
  id SERIAL PRIMARY KEY,
  tg_user_id BIGINT NOT NULL,
  address VARCHAR NOT NULL,
  rooms INTEGER NOT NULL,
  floor INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы
CREATE INDEX users_tg_user_id_idx ON users.user_flats(tg_user_id);

-- Добавляем комментарии к таблице
COMMENT ON TABLE users.user_flats IS 'Квартиры пользователей';
COMMENT ON COLUMN users.user_flats.id IS 'Уникальный идентификатор квартиры (автоинкремент)';
COMMENT ON COLUMN users.user_flats.tg_user_id IS 'Telegram ID пользователя';
COMMENT ON COLUMN users.user_flats.address IS 'Адрес квартиры';
COMMENT ON COLUMN users.user_flats.rooms IS 'Количество комнат';
COMMENT ON COLUMN users.user_flats.floor IS 'Этаж';
