'use client'

import { useState } from 'react'
import cn from '../utils/cn'
import { LogoMark } from './logo'
import ThemeToggle from './theme-toggle'

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Burger button */}
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='fixed top-2 right-4 z-50 flex flex-col gap-1.5 p-3 rounded-lg hover:bg-muted transition-colors bg-background/80 backdrop-blur-sm border shadow-sm'
        aria-label='Toggle menu'
      >
        <span
          className={cn(
            'block h-0.5 w-6 bg-foreground transition-all duration-300',
            isOpen && 'rotate-45 translate-y-2',
          )}
        />
        <span
          className={cn(
            'block h-0.5 w-6 bg-foreground transition-all duration-300',
            isOpen && 'opacity-0',
          )}
        />
        <span
          className={cn(
            'block h-0.5 w-6 bg-foreground transition-all duration-300',
            isOpen && '-rotate-45 -translate-y-2',
          )}
        />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/60 z-40 transition-opacity'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu panel */}
      <div
        className={cn(
          'fixed top-0 left-0 bottom-0 z-50 w-64 bg-card border-r-2 border-border shadow-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className='flex flex-col h-full p-6 pt-20'>
          {/* Logo */}
          <a href='/' className='flex items-center gap-3 mb-8'>
            <LogoMark className='size-8' />
            <span className='text-xl font-semibold'>MRealty</span>
          </a>

          {/* Navigation */}
          <nav className='flex-1 space-y-2'>
            <a
              href='/my-flats'
              className='block px-4 py-2 rounded-md hover:bg-muted transition-colors'
            >
              Мои квартиры
            </a>
            <a
              href='/notifications'
              className='block px-4 py-2 rounded-md hover:bg-muted transition-colors'
            >
              Уведомления
            </a>
            <a
              href='/districts'
              className='block px-4 py-2 rounded-md hover:bg-muted transition-colors'
            >
              Статистика районов
            </a>
          </nav>

          {/* Theme toggle at bottom */}
          <div className='pt-6 border-t'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-muted-foreground'>Тема</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
