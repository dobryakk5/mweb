'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

function AuthSimpleComponent() {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const userId = searchParams.get('i')
    
    if (!userId) {
      setError('Не указан параметр i в URL')
      setIsLoading(false)
      return
    }

    const userIdNumber = parseInt(userId)
    if (isNaN(userIdNumber)) {
      setError('Неверный формат параметра i')
      setIsLoading(false)
      return
    }

    // Создаем или получаем пользователя
    createOrGetUser(userIdNumber)
  }, [searchParams])

  const createOrGetUser = async (tgUserId: number) => {
    try {
      // Создаем простого пользователя для тестирования
      const mockUser: TelegramUser = {
        id: `user_${tgUserId}`,
        tgUserId,
        firstName: `Пользователь ${tgUserId}`,
        lastName: '',
        username: `user_${tgUserId}`,
        photoUrl: `https://ui-avatars.com/api/?name=User+${tgUserId}&background=random`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setUser(mockUser)
      
      // Сохраняем в localStorage для сессии
      localStorage.setItem('telegram_user', JSON.stringify(mockUser))
      localStorage.setItem('telegram_session_token', `session_${tgUserId}_${Date.now()}`)
      
      // Перенаправляем на страницу квартир пользователя
      router.push('/my-flats')
      
    } catch (error) {
      console.error('Error creating user:', error)
      setError('Ошибка создания пользователя')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Ошибка авторизации</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                <strong>Пример правильного URL:</strong><br/>
                <code className="text-sm">http://localhost:13000/link?i=123</code>
              </div>
              
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <strong>Для просмотра квартир:</strong><br/>
                <code className="text-sm">http://localhost:13000/link?i=1</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Перенаправление...</div>
    </div>
  )
}

export default function AuthSimplePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    }>
      <AuthSimpleComponent />
    </Suspense>
  )
}
