/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:5328/api/:path*' // Dev: Arahkan ke Flask lokal
            : '/api/:path*', // Prod: Pertahankan path asli agar dibaca Vercel Function
      },
    ]
  },
}

module.exports = nextConfig