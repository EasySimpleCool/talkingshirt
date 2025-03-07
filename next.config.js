/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enables static exports
  images: {
    unoptimized: true, // Required for static export
  },
  basePath: '',
  assetPrefix: '',
  // Remove trailing slashes from URLs
  trailingSlash: false,
  // Disable server-side rendering for static export
  reactStrictMode: true,
}

module.exports = nextConfig 