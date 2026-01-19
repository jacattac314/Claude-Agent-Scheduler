/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'renderer/out',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'better-sqlite3': 'better-sqlite3' }];
    return config;
  },
}

module.exports = nextConfig
