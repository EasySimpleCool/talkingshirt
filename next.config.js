/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enables static exports
  images: {
    unoptimized: true, // Required for static export
  },
  basePath: '',
  assetPrefix: '',
}

module.exports = nextConfig 