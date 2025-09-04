'use client'

import React from 'react'

interface DataPoint {
  date: string
  value: number
}

interface TrendChartProps {
  data: DataPoint[]
  title: string
  type: 'price' | 'views'
  width?: number
  height?: number
}

export default function TrendChart({ data, title, type, width = 300, height = 200 }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Нет данных для графика
      </div>
    )
  }

  // Сортируем данные по дате
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Находим минимальное и максимальное значение
  const values = sortedData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1 // Избегаем деления на 0

  // Размеры графика с отступами
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Функция для форматирования значений
  const formatValue = (value: number) => {
    if (type === 'price') {
      return `${value.toLocaleString('ru-RU')} ₽`
    }
    return value.toString()
  }

  // Функция для форматирования даты
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    })
  }

  // Генерируем точки для линии
  const points = sortedData.map((point, index) => {
    const x = padding + (index / (sortedData.length - 1)) * chartWidth
    const y = padding + ((maxValue - point.value) / valueRange) * chartHeight
    return { x, y, ...point }
  })

  // Генерируем путь для SVG линии
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  // Синий цвет для линии
  const lineColor = '#3b82f6' // blue-500
  const fillColor = 'rgba(59, 130, 246, 0.1)' // blue-500 with opacity

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium mb-3 text-center">{title}</h4>
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Градиентная заливка под линией */}
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Сетка по горизонтали */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding + ratio * chartHeight
            const value = maxValue - ratio * valueRange
            return (
              <g key={index}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                />
                <text
                  x={padding - 8}
                  y={y + 4}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="end"
                >
                  {type === 'price' ? `${Math.round(value).toLocaleString()}₽` : Math.round(value)}
                </text>
              </g>
            )
          })}

          {/* Заливка под линией */}
          <path
            d={`${linePath} L ${points[points.length - 1]?.x ?? 0} ${padding + chartHeight} L ${points[0]?.x ?? 0} ${padding + chartHeight} Z`}
            fill={`url(#gradient-${type})`}
          />

          {/* Основная линия тренда */}
          <path
            d={linePath}
            stroke={lineColor}
            strokeWidth={2}
            fill="none"
            className="drop-shadow-sm"
          />

          {/* Точки на графике */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={3}
                fill={lineColor}
                stroke="white"
                strokeWidth={1}
                className="drop-shadow-sm"
              />
              {/* Tooltip на hover */}
              <circle
                cx={point.x}
                cy={point.y}
                r={8}
                fill="transparent"
                className="cursor-pointer hover:fill-black hover:fill-opacity-5"
              >
                <title>{`${formatDate(point.date)}: ${formatValue(point.value)}`}</title>
              </circle>
            </g>
          ))}

          {/* Подписи дат по оси X */}
          {points.map((point, index) => {
            // Показываем только каждую вторую дату если точек много
            if (points.length > 5 && index % 2 === 1) return null
            
            return (
              <text
                key={index}
                x={point.x}
                y={height - padding + 15}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {formatDate(point.date)}
              </text>
            )
          })}
        </svg>

      </div>
    </div>
  )
}