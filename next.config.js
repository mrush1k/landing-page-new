/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable optimized images with Next.js Image component
  images: { 
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'recharts', 'date-fns'],
  },
  
  // Compression and caching
  compress: true,
  
  // Static generation optimizations
  generateEtags: true,
  poweredByHeader: false,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Code splitting optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize client-side bundle splitting
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for react/next
          vendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'vendor',
            chunks: 'all',
          },
          ui: {
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui|recharts|date-fns)[\\/]/,
            name: 'ui',
            chunks: 'all',
          },
        },
      }
    }
    return config
  },
  
  // Output optimization
  output: 'standalone'
};

module.exports = nextConfig;
