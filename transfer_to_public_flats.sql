-- Процедура для переноса данных из users.ads в public.flats и public.flats_history
-- Принимает массив ID из users.ads
-- Использует новые поля house_id и person_type_id для оптимизации

-- Вспомогательная функция для поиска ID по категории и названию
CREATE OR REPLACE FUNCTION public.get_lookup_id(category_name TEXT, lookup_value TEXT)
RETURNS SMALLINT
LANGUAGE plpgsql
AS $function$
DECLARE
    result_id SMALLINT;
BEGIN
    IF lookup_value IS NULL OR trim(lookup_value) = '' THEN
        RETURN NULL;
    END IF;
    
    SELECT id INTO result_id
    FROM public.lookup_types 
    WHERE category = category_name 
    AND (name ILIKE lookup_value OR lookup_value ILIKE '%' || name || '%')
    LIMIT 1;
    
    RETURN result_id;
END;
$function$;

-- Функция для конвертации строкового person_type в person_type_id
CREATE OR REPLACE FUNCTION public.get_person_type_id(person_type_string TEXT, description TEXT DEFAULT NULL, tags TEXT DEFAULT NULL)
RETURNS SMALLINT
LANGUAGE plpgsql
AS $function$
DECLARE
    result_id SMALLINT;
BEGIN
    -- Сначала проверяем строковое значение person_type из парсера
    IF person_type_string IS NOT NULL AND trim(person_type_string) != '' THEN
        CASE LOWER(trim(person_type_string))
            WHEN 'агентство', 'agent', 'agency' THEN
                RETURN 2;
            WHEN 'собственник', 'owner', 'владелец', 'хозяин' THEN
                RETURN 3;
            WHEN 'частное лицо', 'private', 'частник' THEN
                RETURN 1;
            ELSE
                -- Если строка не распознана, используем текстовый анализ
        END CASE;
    END IF;
    
    -- Если строкового значения нет или оно не распознано, анализируем описание/теги
    IF description IS NOT NULL OR tags IS NOT NULL THEN
        IF (description ILIKE '%агент%' OR description ILIKE '%агентство%' OR 
            description ILIKE '%риэлтор%' OR tags ILIKE '%агент%') THEN
            RETURN 2; -- Агентство
        ELSIF (description ILIKE '%собственник%' OR description ILIKE '%владелец%' OR
               description ILIKE '%хозяин%' OR tags ILIKE '%собственник%') THEN
            RETURN 3; -- Собственник
        END IF;
    END IF;
    
    -- По умолчанию - частное лицо
    RETURN 1;
END;
$function$;

CREATE OR REPLACE PROCEDURE public.transfer_user_ads_to_public(user_ad_ids INTEGER[])
LANGUAGE plpgsql
AS $procedure$
DECLARE
    rec RECORD;
    house_id_var INTEGER;
    source_id_var SMALLINT;
    ad_type_var SMALLINT;
    object_type_var SMALLINT;
    person_type_var SMALLINT;
    town_id_var SMALLINT;
    house_type_id_var SMALLINT;
    need_house_id_update BOOLEAN;
    need_person_type_update BOOLEAN;
BEGIN
    -- Константы для маппинга
    town_id_var := 1; -- Москва
    ad_type_var := 1; -- Продажа (из nedvigimost_type_id)
    object_type_var := 2; -- Вторичка (из object_type)

    -- Обрабатываем каждое объявление
    FOR rec IN 
        SELECT 
            a.*,
            uf.address as flat_address
        FROM users.ads a
        JOIN users.user_flats uf ON a.flat_id = uf.id
        WHERE a.id = ANY(user_ad_ids)
    LOOP
        -- Определяем source_id на основе URL
        IF rec.url LIKE '%cian.ru%' THEN
            source_id_var := 4; -- Cian
        ELSIF rec.url LIKE '%avito.ru%' THEN
            source_id_var := 1; -- Avito
        ELSIF rec.url LIKE '%realty.yandex.ru%' OR rec.url LIKE '%realty.ya.ru%' THEN
            source_id_var := 3; -- Yandex
        ELSE
            source_id_var := 2; -- Other
        END IF;

        -- Получаем или используем существующий house_id
        need_house_id_update := FALSE;
        IF rec.house_id IS NOT NULL THEN
            house_id_var := rec.house_id;
        ELSE
            SELECT result_id INTO house_id_var 
            FROM public.get_house_id_by_address(rec.flat_address);
            
            -- Если адрес не найден, пропускаем это объявление
            IF house_id_var IS NULL THEN
                RAISE NOTICE 'Address not found for ad %: %', rec.id, rec.flat_address;
                CONTINUE;
            ELSE
                need_house_id_update := TRUE;
            END IF;
        END IF;
        
        -- Маппинг house_type через lookup_types
        house_type_id_var := public.get_lookup_id('house_type', rec.house_type);
        
        -- Получаем или определяем person_type_id
        need_person_type_update := FALSE;
        IF rec.person_type_id IS NOT NULL THEN
            person_type_var := rec.person_type_id;
        ELSE
            person_type_var := public.get_person_type_id(rec.person_type, rec.description, rec.tags);
            need_person_type_update := TRUE;
        END IF;

        -- 1. Upsert в таблицу public.flats
        INSERT INTO public.flats (
            house_id, 
            floor, 
            rooms,
            street,
            street_type,
            house,
            town, 
            total_floors,
            area,
            living_area, 
            kitchen_area,
            house_type_id,
            ao_id,
            built,
            metro_id,
            km_do_metro,
            min_metro
        )
        VALUES (
            house_id_var,
            COALESCE(rec.floor, 1),
            rec.rooms,
            -- Парсим адрес (упрощенная версия)
            split_part(rec.flat_address, ',', 1), -- street
            'ул.', -- street_type (статично)
            split_part(rec.flat_address, ',', 2), -- house
            town_id_var,
            rec.total_floors,
            rec.total_area,
            rec.living_area,
            rec.kitchen_area,
            house_type_id_var, -- house_type_id из lookup_types
            NULL, -- ao_id
            rec.construction_year,
            NULL, -- metro_id (нужно маппить из rec.metro_station)
            NULL, -- km_do_metro
            NULL  -- min_metro (нужно парсить из rec.metro_time)
        )
        ON CONFLICT (house_id, floor, rooms) DO NOTHING;

        -- 2. Извлекаем avitoid из URL (цифры в конце)
        DECLARE
            avito_id_var NUMERIC(20,0);
            url_digits TEXT;
        BEGIN
            -- Извлекаем последние цифры из URL
            url_digits := regexp_replace(rec.url, '.*?(\d+)/?$', '\1');
            
            -- Проверяем, что получились цифры
            IF url_digits ~ '^\d+$' THEN
                avito_id_var := url_digits::NUMERIC(20,0);
            ELSE
                -- Если не удалось извлечь, используем fallback
                avito_id_var := (rec.id::BIGINT * 10000 + source_id_var)::NUMERIC(20,0);
                RAISE NOTICE 'Could not extract digits from URL %, using fallback ID %', rec.url, avito_id_var;
            END IF;

            -- 3. Upsert в public.flats_history
            INSERT INTO public.flats_history (
                house_id,
                floor,
                rooms,
                object_type_id,
                ad_type_id,
                url,
                person_type_id,
                price,
                time_source_created,
                time_source_updated,
                avitoid,
                source_id,
                is_actual,
                description
            )
            VALUES (
                house_id_var,
                COALESCE(rec.floor, 1),
                rec.rooms,
                object_type_var,
                ad_type_var,
                rec.url,
                person_type_var,
                rec.price,
                rec.created_at::DATE,
                rec.updated_at,
                avito_id_var,
                source_id_var,
                CASE WHEN rec.status IS TRUE THEN 1 WHEN rec.status IS FALSE THEN 0 ELSE NULL END, -- boolean -> smallint
                rec.description
            )
            ON CONFLICT (avitoid, source_id) DO UPDATE
            SET
                price = EXCLUDED.price,
                time_source_updated = EXCLUDED.time_source_updated,
                is_actual = EXCLUDED.is_actual,
                description = EXCLUDED.description;

        END;
        
        -- 4. Обновляем поля в users.ads для оптимизации следующих запусков
        IF need_house_id_update OR need_person_type_update THEN
            UPDATE users.ads 
            SET 
                house_id = CASE WHEN need_house_id_update THEN house_id_var ELSE house_id END,
                person_type_id = CASE WHEN need_person_type_update THEN person_type_var ELSE person_type_id END
            WHERE id = rec.id;
            
            RAISE NOTICE 'Updated ad % with house_id=% person_type_id=%', 
                rec.id, 
                CASE WHEN need_house_id_update THEN house_id_var::TEXT ELSE 'unchanged' END,
                CASE WHEN need_person_type_update THEN person_type_var::TEXT ELSE 'unchanged' END;
        END IF;
    END LOOP;

    RAISE NOTICE 'Transferred % ads to public tables', array_length(user_ad_ids, 1);
END;
$procedure$;

-- Примеры использования:
-- CALL public.transfer_user_ads_to_public(ARRAY[44, 45, 46]);

/*
ФУНКЦИОНАЛЬНОСТЬ:
1. Оптимизированное получение house_id: 
   - Использует существующий users.ads.house_id если есть
   - Иначе вызывает public.get_house_id_by_address(address) и сохраняет результат
2. Извлечение avitoid из URL (последние цифры)
3. Маппинг через public.lookup_types:
   - house_type → house_type_id
   - source_id по URL
4. Оптимизированное получение person_type_id:
   - Использует существующий users.ads.person_type_id если есть
   - Иначе конвертирует person_type через public.get_person_type_id()
   - Поддерживает анализ описания/тегов как fallback
5. Конвертация boolean → smallint для is_actual
6. Автоматическое обновление users.ads для кеширования результатов

НОВЫЕ ПОЛЯ В users.ads:
- house_id int4 NULL - кеш результата get_house_id_by_address
- person_type_id int2 NULL - конвертированный ID типа продавца
- person_type varchar(15) NULL - строковое значение от парсера

ПРИМЕРЫ ИЗВЛЕЧЕНИЯ AVITOID:
- https://www.avito.ru/moskva/kvartiry/4-k._kvartira_95_m_514_et._4805953955 → 4805953955
- https://spb.cian.ru/sale/flat/123456/ → 123456  
- https://realty.yandex.ru/offer/7891011/ → 7891011

МАППИНГ ИСТОЧНИКОВ:
- 1 = Avito
- 3 = Yandex (realty.yandex.ru, realty.ya.ru)
- 4 = Cian
- 2 = Other

LOOKUP КАТЕГОРИИ (из public.lookup_types):
- house_type: панельный, кирпичный, монолитный, газобетонный, монолитно-кирпичный, деревянный
- nedvigimost_type_id: 1=Продам, 2=Сдам, 3=Куплю, 4=Сниму
- object_type: 1=Новостройка, 2=Вторичка

PERSON_TYPE КОНВЕРТАЦИЯ:
1. Приоритет - строковое значение person_type от парсера:
   - 'агентство', 'agent', 'agency' → 2
   - 'собственник', 'owner', 'владелец', 'хозяин' → 3
   - 'частное лицо', 'private', 'частник' → 1
2. Fallback - анализ описания/тегов:
   - 2 = Агентство (если содержит: агент, агентство, риэлтор)
   - 3 = Собственник (если содержит: собственник, владелец, хозяин)
   - 1 = Частное лицо (по умолчанию)

ЛОГИКА РАБОТЫ:
- Если house_id уже есть → не дергает get_house_id_by_address
- Если person_type_id уже есть → не анализирует текст
- Если адрес не найден → объявление пропускается с NOTICE
- Если цифры не извлечены из URL → используется fallback ID
- После успешной синхронизации → обновляет поля кеша в users.ads
- house_type маппится через fuzzy поиск (ILIKE)

ОПТИМИЗАЦИЯ:
- Повторные вызовы процедуры работают быстрее благодаря кешированию
- Уменьшена нагрузка на get_house_id_by_address
- Централизованная логика конвертации person_type
*/