/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/fantastic-breaks-/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/fantastic-breaks-' : '',
  experimental: {
    esmExternals: 'loose'
  }
}

export default nextConfig
