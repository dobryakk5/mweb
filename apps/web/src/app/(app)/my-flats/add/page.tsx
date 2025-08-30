'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { JSX } from 'react'

import AddFlatForm from './components/add-flat-form'

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

export default function AddFlatPage(): JSX.Element {
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
        router.push('/link')
      }
    } else {
      // Нет сессии - перенаправляем на авторизацию
      router.push('/auth-simple')
    }
  }, [router])

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

  return <AddFlatForm tgUserId={user.tgUserId} />
}
