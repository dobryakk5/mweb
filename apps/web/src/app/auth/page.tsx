'use client'

export default function AuthPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          {/* Logo */}
          <div className='mx-auto h-20 w-20 bg-red-800 rounded-lg flex items-center justify-center mb-8'>
            <span className='text-white text-3xl font-bold'>M</span>
          </div>

          {/* Title */}
          <h2 className='text-3xl font-extrabold text-gray-900 mb-6'>
            MRealty
          </h2>

          {/* Description */}
          <p className='text-lg text-gray-600 mb-8'>
            Личный кабинет для аналитики недвижимости
          </p>

          {/* Bot Link */}
          <div className='bg-white p-6 rounded-lg shadow-md border'>
            <h3 className='text-xl font-semibold text-gray-900 mb-4'>
              Получите доступ к кабинету
            </h3>

            <div className='space-y-4'>
              <a
                href='https://t.me/M_realty_bot'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
              >
                <svg
                  className='w-5 h-5 mr-2'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.61 7.586c-.121.574-.437.717-.884.446l-2.443-1.804-1.179 1.134c-.13.13-.241.241-.494.241l.176-2.491 4.552-4.117c.198-.176-.043-.275-.308-.099L9.73 13.448l-2.42-.757c-.526-.164-.536-.526.11-.779l9.46-3.648c.439-.164.825.108.683.778z' />
                </svg>
                Перейти к боту
              </a>

              <div className='text-sm text-gray-600'>
                <p className='mb-2'>
                  Для получения ссылки в ваш кабинет отправьте боту выше слово:
                </p>
                <div className='bg-gray-100 px-3 py-2 rounded font-mono text-center'>
                  кабинет
                </div>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <p className='mt-6 text-xs text-gray-500'>
            После отправки сообщения бот предоставит вам персональную ссылку для
            входа в кабинет
          </p>
        </div>
      </div>
    </div>
  )
}
