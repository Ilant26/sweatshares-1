/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'sweatshares.com',
          },
        ],
        destination: 'https://www.sweatshares.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig 