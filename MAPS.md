# Карты - Документация

## Обзор системы карт

Система карт позволяет пользователям визуализировать объявления о недвижимости на интерактивной карте с различными маркерами и фильтрацией.

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

### `/map/address-coordinates`
Получение координат по адресу из `system.moscow_geo`.

### `/map/house-ads`
Получение объявлений конкретного дома из `public.flats_history`.

### `/map/poi`
Получение точек интереса (школы, детсады) из `system.moscow_geo`.

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

## Развитие

### Планируемые улучшения
- Кластеризация маркеров при большом количестве
- Фильтрация по цене/комнатам прямо на карте
- Сохранение позиции карты в localStorage
- Поддержка мобильных устройств