 
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['socket.io']
  },  ignoreBuildErrors: true,
}
  

module.exports = nextConfig