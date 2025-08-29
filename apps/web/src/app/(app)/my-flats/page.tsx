'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { JSX } from 'react'
import Link from 'next/link'

import Page from '@acme/ui/components/page'
import { buttonVariants } from '@acme/ui/components/button'

import ViewFlats from './components/view-flats'

interface TelegramUser {
  id: string
  tgUserId: number
  firstName?: string
  lastName?: string
  username?: string
  photoUrl?: string
  createdAt: Date
  updatedAt: Date
}

export default function MyFlatsPage(): JSX.Element {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Проверяем существующую сессию
    const userData = localStorage.getItem('telegram_user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUser(user)
        setIsLoading(false)
      } catch (error) {
        console.error('Error parsing user data:', error)
        router.push('/auth-simple')
      }
    } else {
      // Нет сессии - перенаправляем на авторизацию
      router.push('/auth-simple')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('telegram_user')
    localStorage.removeItem('telegram_session_token')
    router.push('/auth-simple')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Пользователь не найден</div>
      </div>
    )
  }

  return (
    <Page>
      <Page.Header>
        <Page.Title>Мои квартиры</Page.Title>

        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {user.firstName} {user.lastName}
            </span>
          </div>

          <Link
            className={buttonVariants({
              className: 'ml-auto',
              variant: 'secondary',
            })}
            href='/my-flats/add'
          >
            Добавить квартиру
          </Link>

          <button
            onClick={handleLogout}
            className={buttonVariants({
              variant: 'outline',
            })}
          >
            Выйти
          </button>
        </div>
      </Page.Header>

      <Page.Content>
        <ViewFlats tgUserId={user.tgUserId} />
      </Page.Content>
    </Page>
  )
}
