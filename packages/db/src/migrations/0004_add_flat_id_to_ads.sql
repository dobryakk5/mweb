-- Добавление поля flat_id в таблицу ads для привязки к квартирам
ALTER TABLE "users"."ads" ADD COLUMN IF NOT EXISTS "flat_id" INTEGER NOT NULL DEFAULT 1;

-- Создание индекса для быстрого поиска по квартире
CREATE INDEX IF NOT EXISTS "ads_flat_id_idx" ON "users"."ads" ("flat_id");

-- Добавление внешнего ключа (опционально, для целостности данных)
-- ALTER TABLE "users"."ads" ADD CONSTRAINT "ads_flat_id_fkey" 
--   FOREIGN KEY ("flat_id") REFERENCES "users"."user_flats" ("id") ON DELETE CASCADE;
