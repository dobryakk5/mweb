/**
 * @type { import('next').NextConfig }
 */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:13001/:path*',
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: '', // Отключаем CSP
          },
        ],
      },
    ]
  },
}

export default nextConfig
