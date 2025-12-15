/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:5328/api/:path*' // Untuk development lokal
            : '/api/', // Untuk produksi di Vercel
      },
    ]
  },
}

module.exports = nextConfig