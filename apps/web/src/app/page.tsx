'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated (has session in localStorage)
    const userSession = localStorage.getItem('userSession')

    if (userSession) {
      // If authenticated, redirect to my-flats
      router.push('/my-flats')
    } else {
      // If not authenticated, redirect to auth page
      router.push('/auth')
    }
  }, [router])

  // Show loading while checking authentication
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='mx-auto h-16 w-16 bg-red-800 rounded-lg flex items-center justify-center mb-4 animate-pulse'>
          <span className='text-white text-2xl font-bold'>M</span>
        </div>
        <p className='text-gray-600'>Загрузка...</p>
      </div>
    </div>
  )
}
