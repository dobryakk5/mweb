'use client'

import { useEffect, useState } from 'react'
import Button from '@acme/ui/components/button'

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

interface TelegramLoginProps {
  onLogin?: (user: TelegramUser, sessionToken: string) => void
  onLogout?: () => void
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: any) => void
    }
  }
}

export default function TelegramLogin({ onLogin, onLogout }: TelegramLoginProps) {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Загружаем Telegram Login Widget
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.onload = () => {
      if (window.TelegramLoginWidget) {
        window.TelegramLoginWidget.dataOnauth = handleTelegramAuth
      }
    }
    document.head.appendChild(script)

    // Проверяем существующую сессию
    checkExistingSession()

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const checkExistingSession = async () => {
    const token = localStorage.getItem('telegram_session_token')
    if (token) {
      try {
        const response = await fetch(`/api/auth/me?sessionToken=${token}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUser(data.user)
            setSessionToken(token)
            onLogin?.(data.user, token)
          } else {
            localStorage.removeItem('telegram_session_token')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('telegram_session_token')
      }
    }
  }

  const handleTelegramAuth = async (telegramUser: any) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramUser),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          setSessionToken(data.sessionToken)
          localStorage.setItem('telegram_session_token', data.sessionToken)
          onLogin?.(data.user, data.sessionToken)
        }
      } else {
        console.error('Telegram auth failed')
      }
    } catch (error) {
      console.error('Error during Telegram auth:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken }),
        })
      } catch (error) {
        console.error('Error during logout:', error)
      }
    }
    
    setUser(null)
    setSessionToken(null)
    localStorage.removeItem('telegram_session_token')
    onLogout?.()
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.photoUrl && (
            <img 
              src={user.photoUrl} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium">
            {user.firstName} {user.lastName}
          </span>
        </div>
        <Button 
          onClick={handleLogout} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          Выйти
        </Button>
      </div>
    )
  }

  return (
    <div 
      data-telegram-login="YOUR_BOT_NAME"
      data-size="large"
      data-auth-url="https://your-domain.com/auth"
      data-request-access="write"
      data-lang="ru"
      className="telegram-login-widget"
    >
      {isLoading && (
        <Button disabled variant="outline" size="lg">
          Загрузка...
        </Button>
      )}
    </div>
  )
}
