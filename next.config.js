/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mengarahkan request /api ke server Python
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5328/api/:path*',
      },
    ]
  },
};

export default nextConfig;