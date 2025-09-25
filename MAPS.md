# Карты - Документация

## Обзор системы карт

Система карт позволяет пользователям визуализировать объявления о недвижимости на интерактивной карте с различными маркерами и фильтрацией.

Архитектура:

  1. Блок "Моя квартира" → определяет связку (house_id, floor, rooms)
  2. Таблица public.flats → содержит детали квартиры по связке (house_id, floor, rooms)
  3. Таблица flats_history → содержит детали объявлений
  4. Python API парсинг → если данных нет в БД

Процесс API:

  1. API endpoint /map/flat-full-data/:flatId получает данные квартиры
  2. Сначала ищет площади в public.flats через связку (house_id, floor, rooms)
  3. Если данные отсутствуют или неполные - запускает fallback:
    - Находит cian URL для той же связки в public.flats_history
    - Вызывает Python API: GET {PYTHON_API_URL}/api/parse/single?url={cianUrl}
    - Парсит ответ и извлекает area, kitchen_area, total_floors
    - Автоматически сохраняет данные в public.flats с ON CONFLICT DO UPDATE

## Архитектура данных

### ⚠️ ВАЖНО: Центральная роль house_id

**Главный объект системы - `house_id`**. Всё к нему привязано:

1. **Определение house_id по адресу**:
   ```sql
   SELECT house_id FROM "system".moscow_geo
   WHERE centroid_utm = point AND street = '...' AND housenum = '...'
   ```

2. **Все координаты дома в PostGIS схеме `system`**:
   - Координаты определяются по центроиду (`centroid_utm`)
   - PostGIS функции для конвертации UTM → WGS84
   - Все географические вычисления через `system.moscow_geo`

3. **Все объявления привязаны к house_id**:
   - Схема `public.flats_history` содержит только `house_id`
   - НЕТ прямых координат в `flats_history`
   - Координаты получаются через JOIN с `system.moscow_geo`

4. **Отображение на карте по house_id**:
   - Маркеры размещаются по `centroid_utm` из `system.moscow_geo`
   - Группировка объявлений по `house_id`
   - Один маркер = один дом = один `house_id`


5. **ФИЛЬТРЫ**:
    public.get_ads_in_bounds была создана для новой системы карты с preview панелью. Она используется для:

  Назначение функции:

  Получение объявлений в географических границах карты с фильтрацией по параметрам квартиры

  Где используется:

  1. API endpoint: /map/ads-in-bounds в services/api/src/routes/map.ts
  2. Компонент: useMapAdsFilter hook для preview панели
  3. Страница: Новая система карты с правой панелью объявлений

  Параметры и их роль:

  - p_north, p_south, p_east, p_west - границы видимой области карты (bounds)
  - p_rooms - минимальное количество комнат (≥ комнат текущей квартиры)
  - p_max_price - максимальная цена (< цены текущей квартиры)
  - p_min_area - минимальная площадь (90% от площади текущей квартиры)
  - p_min_kitchen_area - минимальная площадь кухни (≥ 90%кухни текущей квартиры)

  Логика работы:

  1. Получает дом по географическим границам через PostGIS
  2. Фильтрует объявления по параметрам квартиры пользователя
  3. Возвращает данные для отображения в preview панели справа от карты



### Основные таблицы

1. **`public.flats_history`** - основная таблица с объявлениями
   - `house_id` - **ГЛАВНЫЙ** ID дома для группировки по зданиям
   - ⚠️ **НЕТ координат** - они получаются через JOIN с `system.moscow_geo`
   - `is_actual` - статус активности (1 = активное, 0 = неактивное)
   - `price`, `rooms`, `floor` - основные характеристики
   - `url` - ссылка на источник объявления
   - `time_source_updated` - время последнего обновления

2. **`system.moscow_geo`** - геоданные домов Москвы
   - `house_id` - связка с flats_history
   - `street`, `housenum` - адресные данные
   - `centroid_utm` - координаты в UTM проекции
   - `building` - тип здания (для POI)

3. **`users.user_flats`** - квартиры пользователей
   - `address` - адрес квартиры пользователя
   - Используется для определения центральной точки карты

## API Endpoints

### Активные endpoints

### `/map/houses-in-bounds`
Получение домов с объявлениями в заданных границах карты.

**Параметры:**
- `north`, `south`, `east`, `west` - границы карты
- `flatId` - ID квартиры пользователя (для исключения совпадений)

**Логика:**
1. Получает адрес текущей квартиры из `users.user_flats`
2. Вызывает `public.get_houses_with_ads_by_coordinates()`
3. Фильтрует дома в пределах границ
4. **ИСКЛЮЧАЕТ дома по тому же адресу**, что и текущая квартира
5. Добавляет счетчик активных объявлений

### `/map/ads`
Получение объявлений с унифицированной фильтрацией - как для областей карты, так и для конкретных домов.

**Параметры:**
- Для поиска по области: `north`, `south`, `east`, `west` - границы карты
- Для поиска по дому: `houseId` - ID конкретного дома
- Общие фильтры: `rooms`, `maxPrice`, `minArea`, `minKitchenArea`, `limit`

### `/map/user-flats`
Получение квартир пользователя с координатами для отображения на карте.

### `/map/address-coordinates`
Получение координат по адресу из `system.moscow_geo`.

### `/map/address-to-house-id`
Получение house_id по адресу через функцию `get_house_id_by_address`.

### `/map/flat-full-data/:flatId`
Получение полных данных квартиры включая площади и цены с fallback на Python API.

### `/map/update-ads-statuses`
Обновление статусов объявлений через Python API для CIAN объявлений в заданных границах.

### `/map/house-info/:houseId`
Получение информации о доме (адрес, тип дома) по house_id.

### `/map/poi`
Получение точек интереса (школы, детсады) из `system.moscow_geo`.

### Удаленные endpoints (январь 2025)

В ходе оптимизации API были удалены неиспользуемые endpoints:

- **`/map/houses-by-ids`** - получение координат для конкретных house_id (заменен кэшированием координат)
- **`/map/house-prices`** - получение минимальных цен для домов (функциональность перенесена в `/map/ads`)
- **`/map/houses-coordinates`** - batch endpoint для координат домов (заменен внутренним кэшированием)
- **`/map/house-ads`** - получение объявлений конкретного дома (функциональность объединена в `/map/ads`)

Эти endpoints не использовались во frontend или дублировали функциональность основного endpoint `/map/ads`.

## Типы маркеров на карте

### 1. Красный маркер - Текущая квартира
- Координаты получаются через `/map/address-coordinates`
- Отображает местоположение квартиры пользователя
- Всегда показан поверх остальных маркеров

### 2. Оранжевые маркеры - Дома с активными объявлениями
- `has_active_ads: true`
- `active_ads_count > 0`
- Кликабельные - показывают список объявлений дома

### 3. Серые маркеры - Дома только с неактивными объявлениями
- `has_active_ads: false`
- `active_ads_count = 0`
- Менее приоритетные, но все еще полезные


## Предотвращение наложения маркеров

### Проблема
Оранжевые маркеры домов могут накладываться на красный маркер текущей квартиры, если они находятся по одному адресу.

### Решение (API-level)

1. GET /map/ads-in-bounds (строка 978) - основной эндпоинт для
  получения всех объявлений в границах карты с фильтрацией
    - Параметры: north, south, east, west, rooms, maxPrice, minArea,
  minKitchenArea, limit
    - Использует функцию public.get_ads_in_bounds()
  2. GET /map/houses-filtered (строка 553) - получение домов с
  объявлениями в границах карты с фильтрацией
    - Те же параметры + flatId для исключения текущей квартиры
  3. GET /map/houses-in-bounds (строка 402) - получение домов с
  объявлениями в границах карты без фильтрации по цене/площади
  4. GET /map/house-ads (строка 169) - получение объявлений конкретного
  дома по houseId

    Как формируются значения в фильтре:

  1. Базовые значения в nearby-ads-block.tsx:28-57:
    - Ищутся активные объявления CIAN для текущей квартиры
    - Берется объявление с минимальной ценой
    - Из него извлекаются площади: totalArea * 0.9 и kitchenArea * 0.9
  2. Инициализация фильтров в nearby-ads-block.tsx:62-67:
  const [mapFilters, setMapFilters] = useState<FlatFilters>(() => ({
    rooms: nearbyFilters?.rooms || flat.rooms || 3,
    maxPrice: nearbyFilters?.maxPrice || nearbyFilters?.currentPrice || 50000000,
    minArea: nearbyFilters?.minArea || baseAreaValues.minArea,
    minKitchenArea: nearbyFilters?.minKitchenArea || baseAreaValues.minKitchenArea,
  }))
  3. Компонент фильтра nearby-ads-filter.tsx:32-38:
    - Получает currentFilters и создает локальное состояние
    - Пользователь может редактировать поля ввода
    - При нажатии "Искать еще" вызывается onSearch
  4. Обновление фильтров в nearby-ads-block.tsx:70-91:
    - Обновляет mapFilters для карты
    - Вызывает onSearchWithFilters для поиска

  Источники значений по приоритету:
  1. nearbyFilters (если переданы извне)
  2. Данные квартиры (flat.rooms)
  3. Базовые значения из активных CIAN объявлений
  4. Fallback значения (50000000 для цены, 3 для комнат)


1. **В API endpoint `/map/houses-in-bounds`:**
   ```sql
   -- Получаем адрес текущей квартиры
   SELECT address FROM users.user_flats WHERE id = ${flatId}

   -- Исключаем дома с тем же адресом
   WHERE house.address !== currentFlatAddress
   ```

2. **Преимущества API-level фильтрации:**
   - Логика централизована
   - Меньше данных передается на фронтенд
   - Лучшая производительность
   - Проще тестировать и поддерживать

## Компоненты фронтенда

### `NearbyMapComponent`
Основной компонент карты с Leaflet.

**Ключевые особенности:**
- Динамическая загрузка домов при изменении границ карты
- Автоматическое получение координат адреса
- Разные иконки для разных типов маркеров
- Легенда для объяснения типов маркеров

### `NearbyMap`
Wrapper компонент с поддержкой:
- Server-side rendering (SSR) совместимости
- Клика по домам и загрузки объявлений
- Состояния загрузки

## Workflow работы с картой

1. **Инициализация:**
   - Загружается адрес квартиры пользователя
   - Получаются координаты через `/map/address-coordinates`
   - Устанавливается центр карты

2. **Загрузка домов:**
   - При изменении границ карты вызывается `/map/houses-in-bounds`
   - API исключает дома по адресу текущей квартиры
   - Отображаются маркеры с правильными иконками

3. **Интерактивность:**
   - Клик по дому → загрузка объявлений через `/map/house-ads`
   - Отображение деталей в боковой панели
   - Возможность перехода к объявлениям

## Производительность

### Оптимизации
- Лимит на количество домов (500)
- Кэширование координат адресов
- Debounce для изменений границ карты
- Ограничение объявлений из таблицы (20 шт)

### Мониторинг
- Логирование исключенных домов
- Счетчики запросов в API
- Отслеживание времени ответа

## Известные ограничения

1. **Точность координат:** Координаты из разных источников могут иметь разную точность
2. **Кэширование:** Изменения в базе могут не сразу отражаться на карте
3. **Масштабирование:** При большом количестве объявлений может быть медленно

## Новая логика фильтрации (Preview + Bounds)

### Требования
При первой загрузке экрана карты должны быть показаны **все объявления в области карты**, которые удовлетворяют фильтрам, в preview окне справа.

### 1. Двухуровневая фильтрация

#### Статические фильтры (на основе текущей квартиры)
Закреплены сверху, устанавливаются один раз при загрузке:
- **Количество комнат** - больше или равно текущей квартире
- **Максимальная цена** - меньше цены текущей квартиры
- **Минимальная общая площадь** - 95% от площади текущей квартиры
- **Минимальная площадь кухни** - равна или больше кухни текущей квартиры

#### Динамические фильтры (область карты)
Изменяются при движении карты:
- **Географические bounds** - север/юг/восток/запад координаты
- **Real-time обновление** при pan/zoom карты
- **Debounced запросы** (300-500ms) для производительности

### 2. API для фильтрации по bounds

#### Новый endpoint: `/map/ads-in-bounds`
```typescript
GET /map/ads-in-bounds
Query params:
- north: number        // северная граница карты
- south: number        // южная граница карты
- east: number         // восточная граница карты
- west: number         // западная граница карты
- rooms: number        // мин. количество комнат
- maxPrice: number     // макс. цена
- minArea?: number     // мин. общая площадь
- minKitchenArea?: number // мин. площадь кухни
- limit?: number       // лимит результатов (по умолчанию 100)
```

#### Database Function
```sql
CREATE OR REPLACE FUNCTION public.get_ads_in_bounds(
    p_north real,
    p_south real,
    p_east real,
    p_west real,
    p_rooms integer,
    p_max_price bigint,
    p_min_area real DEFAULT NULL,
    p_min_kitchen_area real DEFAULT NULL,
    p_limit integer DEFAULT 100
)
RETURNS TABLE(
    price bigint,
    lat real,
    lng real,
    rooms smallint,
    area numeric,
    kitchen_area numeric,
    floor smallint,
    total_floors smallint,
    house_id integer,
    url text,
    updated_at timestamp,
    distance_m integer
)
```

### 3. Preview окно (правая панель)

#### Функциональность
- **Источник данных**: Все объявления из текущих bounds + фильтры квартиры
- **Автообновление**: При изменении bounds карты
- **Сортировка**: По цене (от дешевых к дорогим)
- **Виртуальный скролл**: Для производительности при больших списках

#### Синхронизация с картой
- **Hover эффекты**: При наведении на объявление - подсветка маркера на карте
- **Клик синхронизация**: При клике на объявление - центрирование карты
- **Двусторонняя связь**: Клик на маркер → подсветка в preview списке

### 4. Компоненты Frontend

#### Hook для управления фильтрацией
```typescript
interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface FlatFilters {
  rooms: number;
  maxPrice: number;
  minArea?: number;
  minKitchenArea?: number;
}

const useMapAdsFilter = (flatFilters: FlatFilters) => {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced загрузка при изменении bounds
  const debouncedLoadAds = useCallback(
    debounce(async (bounds: MapBounds) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/map/ads-in-bounds?${new URLSearchParams({
          ...bounds,
          ...flatFilters
        })}`);
        const data = await response.json();
        setAds(data.ads || []);
      } finally {
        setLoading(false);
      }
    }, 300),
    [flatFilters]
  );

  useEffect(() => {
    if (bounds) {
      debouncedLoadAds(bounds);
    }
  }, [bounds, debouncedLoadAds]);

  return { ads, loading, setBounds };
};
```

#### Компонент Preview панели
```typescript
interface AdsPreviewProps {
  ads: AdInterface[];
  loading: boolean;
  onAdHover: (ad: AdInterface | null) => void;
  onAdClick: (ad: AdInterface) => void;
}

const AdsPreview: React.FC<AdsPreviewProps> = ({
  ads, loading, onAdHover, onAdClick
}) => {
  return (
    <div className="ads-preview">
      <div className="filters-display">
        {/* Отображение активных фильтров */}
      </div>

      {loading && <div className="loading-spinner" />}

      <VirtualizedList
        items={ads}
        renderItem={(ad) => (
          <AdItem
            ad={ad}
            onHover={() => onAdHover(ad)}
            onLeave={() => onAdHover(null)}
            onClick={() => onAdClick(ad)}
          />
        )}
      />
    </div>
  );
};
```
fix
  ✅ 1. Fixed map filter logic to match "Объявления в области" filter behavior

  - Added externalFilters prop to MapWithPreview component
  - Implemented filter synchronization between NearbyAdsFilter form and map preview
  - Map preview now uses the same filters as the "Объявления в области" block

  ✅ 2. Implemented automatic ad status updates via Python API for cian ads

  - Created new API endpoint /map/update-ads-statuses in map.ts
  - Added automatic status update functionality to use-map-ads-filter.ts hook
  - Status updates trigger automatically as a second step after loading data from database (no manual buttons as requested)
  - Updates run after 500ms delay to allow initial data to display first

### 5. Последовательность работы

1. **Инициализация**:
   - Получение данных currentFlat из `users.user_flats`
   - Установка статических фильтров (rooms, price, areas)
   - Инициализация карты с центром на адресе квартиры

2. **Первичная загрузка**:
   - Получение bounds карты после инициализации
   - Запрос объявлений с комбинированными фильтрами
   - Отображение результатов в preview панели

3. **Интерактивность**:
   - При движении карты → обновление bounds → новый запрос объявлений
   - Hover/click события между картой и preview
   - Синхронизация подсветки и центрирования

### 6. UI/UX улучшения

#### Фильтры badges (верх экрана)
```typescript
<div className="filters-badges">
  <Badge variant="primary">Комнат: {filters.rooms}+</Badge>
  <Badge variant="price">До: {formatPrice(filters.maxPrice)}</Badge>
  <Badge variant="area">Площадь: {filters.minArea}+ м²</Badge>
  <Badge variant="kitchen">Кухня: {filters.minKitchenArea}+ м²</Badge>
</div>
```

#### Loading состояния
- Спиннер в preview панели при загрузке
- Skeleton loader для списка объявлений
- Индикатор обновления карты

#### Empty состояния
- Сообщение "Нет объявлений в данной области"
- Предложения по изменению фильтров
- Кнопка "Сбросить фильтры"

### 7. Производительность

- **Виртуализация**: React-window для больших списков
- **Кэширование**: Query cache для повторных запросов
- **Debouncing**: 300ms для bounds изменений
- **Пагинация**: По 100 объявлений за запрос
- **Геоиндексы**: PostGIS индексы для быстрого поиска

## Кэширование координат домов (январь 2025)

### ✅ Реализованная оптимизация производительности

#### Проблема
Эндпоинт `/map/houses-in-bounds` делал отдельные SQL-запросы для получения координат каждого дома из PostGIS, что вызывало медленную работу карты при загрузке большого количества домов.

#### Решение
Создана система in-memory кэширования координат домов в API:

```typescript
// Кэш для координат домов в памяти
const houseCoordinatesCache = new Map<number, { lat: number; lng: number }>()

// Функция пакетной загрузки координат с кэшированием
async function getHouseCoordinates(houseIds: number[]): Promise<Map<number, { lat: number; lng: number }>> {
  const result = new Map<number, { lat: number; lng: number }>()
  const uncachedIds = houseIds.filter((id) => !houseCoordinatesCache.has(id))

  // Добавляем закэшированные координаты
  for (const id of houseIds) {
    const cached = houseCoordinatesCache.get(id)
    if (cached) {
      result.set(id, cached)
    }
  }

  // Загружаем незакэшированные координаты пакетом
  if (uncachedIds.length > 0) {
    const batchResult = await db.execute(sql`
      SELECT
        house_id,
        system.ST_Y(system.ST_Transform(centroid_utm, 4326)) as lat,
        system.ST_X(system.ST_Transform(centroid_utm, 4326)) as lng
      FROM "system".moscow_geo
      WHERE house_id = ANY(${uncachedIds})
    `)

    // Кэшируем и добавляем в результат
    const rows = Array.isArray(batchResult) ? batchResult : (batchResult as any).rows || []
    for (const row of rows) {
      const coords = { lat: row.lat, lng: row.lng }
      houseCoordinatesCache.set(row.house_id, coords)
      result.set(row.house_id, coords)
    }
  }

  return result
}
```

#### Интеграция в `/map/houses-in-bounds`
Обновлен эндпоинт для использования кэшированных координат:

```typescript
// Получаем список house_id с фильтрацией
const houseRows = await db.execute(sql`
  SELECT * FROM public.get_houses_in_bounds(...)
`)

// Извлекаем house_id из результатов
const houseIds = houseRows.map((row: any) => row.house_id)

// Получаем координаты из кэша (пакетно для незакэшированных)
const coordinates = await getHouseCoordinates(houseIds)

// Объединяем данные домов с координатами
const houses = houseRows.map((house: any) => {
  const coords = coordinates.get(house.house_id)
  return {
    ...house,
    lat: coords?.lat || null,
    lng: coords?.lng || null,
  }
}).filter((house: any) => house.lat && house.lng)
```

#### Характеристики производительности
- **Потребление памяти**: ~12 МБ для всех домов Москвы (~1M домов)
- **Ускорение**: В разы быстрее при повторных запросах
- **Кэш**: Постоянный (до перезапуска сервера), автоматическое заполнение
- **Масштабируемость**: Возможность расширения до LRU cache или Redis

#### Альтернативы для роста
- **LRU cache**: Ограниченный размер с вытеснением старых записей
- **TTL cache**: Автоматическое истечение через время
- **Redis**: Внешний кэш для кластерного развертывания

## Исправления состояния карты (январь 2025)

### ✅ Исправлена проблема центрирования карты

#### Проблема
При переключении между квартирами (например, с квартиры 20 на квартиру 18) карта оставалась центрированной на предыдущей квартире из-за сохранения состояния `mapCenter`.

#### Решение
Добавлен `useEffect` для сброса центра карты при смене `flatId`:

```typescript
// Reset map center when flatId changes
useEffect(() => {
  setMapCenter(null)
}, [flatId])
```

#### Результат
Теперь при переключении между квартирами карта корректно центрируется на новой выбранной квартире.

## Система кэширования объявлений на фронтенде (январь 2025)

### ✅ Реализована клиентская фильтрация с кэшированием

#### Проблема
Карта получала объявления с фильтрами от сервера, что требовало новый запрос при каждой смене фильтров. Пользователь ждал загрузки при изменении параметров поиска.

#### Решение
Создана система кэширования на стороне браузера с клиентской фильтрацией:

```typescript
// Новый хук для кэширования карты
export const useMapCache = () => {
  // Кэш в памяти браузера с TTL = 5 минут
  const [cache, setCache] = useState<CachedMapData | null>(null)

  // Загружает ВСЕ объявления без фильтров в расширенной области
  const fetchMapData = useCallback(async (bounds: MapBounds) => {
    const expandedBounds = { /* +10% для эффективности */ }
    const response = await fetch(`/map/ads?${expandedBounds}&limit=1000`)
    // Кэшируем на 5 минут
  }, [])

  // Фильтрация происходит на клиенте мгновенно
  const getFilteredData = useCallback(async (bounds, filters) => {
    if (isCacheValid(bounds)) {
      return {
        houses: filterAndColorHouses(cache.houses, filteredAds, bounds),
        ads: filterAds(cache.ads, filters)
      }
    }
    // Загружаем новые данные только если кэш невалиден
  }, [cache])
}
```

#### Архитектура кэширования

**Файлы системы:**
- `apps/web/src/hooks/use-map-cache.ts` - основной хук кэширования
- `apps/web/src/components/map-filter-demo.tsx` - демо-компонент с интерфейсом

**Логика работы:**
1. **Загрузка данных:** API возвращает все объявления без фильтров в расширенной области (+1км padding)
2. **Кэширование:** Данные хранятся в памяти браузера с TTL = 5 минут
3. **Фильтрация:** Применяется на клиенте мгновенно без запросов к серверу
4. **Окрашивание маркеров:**
   - 🟠 Оранжевые - дома с активными объявлениями среди отфильтрованных
   - ⚪ Серые - дома только с неактивными объявлениями
5. **Invalidation:** При смене области карты кэш обновляется

#### Исправление багов с активностью объявлений

**Проблема:** Все дома показывались серыми, хотя содержали активные объявления.

**Причины и исправления:**

1. **API не возвращал поле `is_actual`:**
```sql
-- Было (отсутствовало is_actual):
SELECT fh.price, fh.rooms, fh.floor, fh.house_id, fh.url, fh.time_source_updated as updated_at

-- Стало:
SELECT fh.price, fh.rooms, fh.floor, fh.house_id, fh.url, fh.time_source_updated as updated_at, fh.is_actual
```

2. **Неправильная логика определения активности:**
```typescript
// Было (строгая проверка):
const hasActiveAds = Boolean(house.has_active_ads === true)

// Стало (гибкая проверка):
const hasActiveAds = Boolean(house.has_active_ads || house.active_ads_count > 0)
```

3. **Создание домов без полей активности:**
```typescript
// Новая логика создания домов из объявлений:
const activeAds = ads.filter(ad => {
  return ad.is_active === true || ad.is_active === 1 || ad.is_active === '1'
})

return {
  house_id: houseId,
  has_active_ads: activeAds.length > 0,
  active_ads_count: activeAds.length,
  total_ads_count: ads.length,
  // ...
}
```

#### Преимущества системы

**UX улучшения:**
- ⚡ Мгновенная смена фильтров без ожидания
- 📊 Визуальные индикаторы состояния кэша
- 🎯 Правильное окрашивание маркеров по активности

**Производительность:**
- 🚀 Снижение нагрузки на API при смене фильтров
- 💾 Умное кэширование с расширенными границами
- 🔄 Автоматическое обновление через 5 минут

**Надежность:**
- 🛡️ Fallback на активные счетчики при отсутствии флагов
- 🔍 Подробные логи для отладки
- ⏰ TTL кэша предотвращает устаревание данных

#### Интеграция

Система интегрирована в страницу редактирования квартир (`/my-flats/[flatId]`) через компонент `nearby-map-component.tsx`. Поддерживается обратная совместимость со всеми существующими фильтрами и API.

## Развитие

### Планируемые улучшения
- Кластеризация маркеров при большом количестве
- Сохранение позиции карты в localStorage
- Поддержка мобильных устройств
- Миграция кэша координат на Redis для production
- Расширение системы кэширования на другие страницы приложения