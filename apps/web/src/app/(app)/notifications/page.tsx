'use client'

import { useState } from 'react'
import { buttonVariants } from '@acme/ui/components/button'
import { toast } from 'sonner'

interface TelegramUser {
  id: string
  tgUserId: number
  firstName?: string
  lastName?: string
  username?: string
}

export default function NotificationsPage() {
  const [isCheckingFlats, setIsCheckingFlats] = useState(false)
  const [isCheckingHouses, setIsCheckingHouses] = useState(false)
  const [isCheckingNearby, setIsCheckingNearby] = useState(false)
  const [days, setDays] = useState(1)

  const handleCheckFlats = async () => {
    const userData = localStorage.getItem('telegram_user')
    if (!userData) {
      toast.error('Пользователь не найден. Пожалуйста, авторизуйтесь.')
      return
    }

    const user: TelegramUser = JSON.parse(userData)
    setIsCheckingFlats(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:13001'
      const response = await fetch(`${apiUrl}/scheduler/check-flat-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tgUserId: user.tgUserId,
          checkType: 'flats',
          days,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check flats')
      }

      const result = await response.json()
      const totalChanges =
        (result.totalNewAdsFlat || 0) + (result.totalStatusChangesFlat || 0)

      if (totalChanges === 0) {
        toast.info('Нет изменений по квартирам за последние 24 часа')
      } else {
        toast.success(
          `✅ Проверка квартир завершена!\n\n` +
            `🆕 Новых объявлений: ${result.totalNewAdsFlat || 0}\n` +
            `🔄 Изменений статуса: ${result.totalStatusChangesFlat || 0}\n` +
            `📨 Уведомлений отправлено: ${result.notificationsSent || 0}`,
        )
      }
    } catch (error) {
      console.error('Error checking flats:', error)
      toast.error('Ошибка при проверке объявлений по квартирам')
    } finally {
      setIsCheckingFlats(false)
    }
  }

  const handleCheckHouses = async () => {
    const userData = localStorage.getItem('telegram_user')
    if (!userData) {
      toast.error('Пользователь не найден. Пожалуйста, авторизуйтесь.')
      return
    }

    const user: TelegramUser = JSON.parse(userData)
    setIsCheckingHouses(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:13001'
      const response = await fetch(`${apiUrl}/scheduler/check-flat-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tgUserId: user.tgUserId,
          checkType: 'houses',
          days,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to check houses')
      }

      const result = await response.json()
      const totalChanges =
        (result.totalNewAdsHouse || 0) + (result.totalStatusChangesHouse || 0)

      if (totalChanges === 0) {
        toast.info('Нет изменений по домам за последние 24 часа')
      } else {
        toast.success(
          `✅ Проверка домов завершена!\n\n` +
            `🆕 Новых объявлений: ${result.totalNewAdsHouse || 0}\n` +
            `🔄 Изменений статуса: ${result.totalStatusChangesHouse || 0}\n` +
            `📨 Уведомлений отправлено: ${result.notificationsSent || 0}`,
        )
      }
    } catch (error) {
      console.error('Error checking houses:', error)
      toast.error('Ошибка при проверке объявлений по домам')
    } finally {
      setIsCheckingHouses(false)
    }
  }

  const handleCheckNearby = async () => {
    const userData = localStorage.getItem('telegram_user')
    if (!userData) {
      toast.error('Пользователь не найден. Пожалуйста, авторизуйтесь.')
      return
    }

    const user: TelegramUser = JSON.parse(userData)
    setIsCheckingNearby(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:13001'
      const response = await fetch(`${apiUrl}/scheduler/check-nearby-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tgUserId: user.tgUserId, days }),
      })

      if (!response.ok) {
        throw new Error('Failed to check nearby ads')
      }

      const result = await response.json()
      const totalChanges =
        (result.totalNewAds || 0) + (result.totalStatusChanges || 0)

      if (totalChanges === 0) {
        toast.info('Нет изменений в радиусе 500м за последние 24 часа')
      } else {
        toast.success(
          `✅ Проверка в радиусе 500м завершена!\n\n` +
            `🆕 Новых объявлений: ${result.totalNewAds || 0}\n` +
            `🔄 Изменений статуса: ${result.totalStatusChanges || 0}\n` +
            `📨 Уведомлений отправлено: ${result.notificationsSent || 0}`,
        )
      }
    } catch (error) {
      console.error('Error checking nearby ads:', error)
      toast.error('Ошибка при проверке объявлений в радиусе 500м')
    } finally {
      setIsCheckingNearby(false)
    }
  }

  return (
    <div className='container mx-auto p-6 max-w-4xl'>
      <h1 className='text-3xl font-bold mb-6'>Уведомления</h1>

      <div className='bg-card rounded-lg shadow p-6 mb-6'>
        <h2 className='text-xl font-semibold mb-4'>Проверка изменений</h2>
        <p className='text-muted-foreground mb-6'>
          Нажмите кнопки ниже, чтобы получить уведомления о новых объявлениях и
          изменениях статусов по всем вашим квартирам. Уведомления будут
          отправлены в Telegram.
        </p>

        <div className='flex flex-col items-center gap-3'>
          <button
            type='button'
            className={buttonVariants({
              variant: 'default',
              size: 'lg',
              className: 'w-full max-w-md',
            })}
            onClick={handleCheckFlats}
            disabled={isCheckingFlats}
          >
            {isCheckingFlats ? 'Проверяю...' : '🏠 По квартирам'}
          </button>

          <button
            type='button'
            className={buttonVariants({
              variant: 'default',
              size: 'lg',
              className: 'w-full max-w-md',
            })}
            onClick={handleCheckHouses}
            disabled={isCheckingHouses}
          >
            {isCheckingHouses ? 'Проверяю...' : '🏢 По домам'}
          </button>

          <button
            type='button'
            className={buttonVariants({
              variant: 'default',
              size: 'lg',
              className: 'w-full max-w-md',
            })}
            onClick={handleCheckNearby}
            disabled={isCheckingNearby}
          >
            {isCheckingNearby ? 'Проверяю...' : '🗺️ В радиусе 500м'}
          </button>
        </div>

        {/* Поле выбора количества дней под кнопками */}
        <div className='flex justify-center items-center gap-2 mt-4 text-sm text-muted-foreground'>
          <span>Проверить изменения за последние:</span>
          <input
            type='number'
            min='1'
            max='30'
            value={days}
            onChange={(e) =>
              setDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))
            }
            className='w-16 px-2 py-1 border border-input rounded-md bg-background text-foreground'
          />
          <span>{days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</span>
        </div>
      </div>

      <div className='bg-muted/50 rounded-lg p-4'>
        <h3 className='text-sm font-semibold mb-2'>ℹ️ Как это работает?</h3>
        <ul className='text-sm text-muted-foreground space-y-1'>
          <li>
            • <strong>Уведомления по квартирам:</strong> Проверяются объявления
            по всем вашим квартирам (по этажу и количеству комнат)
          </li>
          <li>
            • <strong>Уведомления по домам:</strong> Проверяются все объявления
            в домах, где находятся ваши квартиры
          </li>
          <li>
            • <strong>Уведомления в радиусе 500м:</strong> Проверяются
            объявления в других домах в радиусе 500м от ваших квартир (дешевле,
            больше комнат, площадь ≥90%)
          </li>
          <li>
            • Уведомления отправляются в Telegram, если есть изменения за
            последние 24 часа
          </li>
          <li>
            • Scheduler автоматически выполняет эти проверки по расписанию
          </li>
        </ul>
      </div>
    </div>
  )
}
