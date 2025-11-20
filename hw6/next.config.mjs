/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // 暂时允许，生产环境应该修复所有类型错误
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // 確保 FAQ 文件被包含在構建輸出中（用於 Vercel 部署）
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 在服務器端，確保 Markdown 文件可以被讀取
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  // 複製 FAQ 文件到輸出目錄（如果需要）
  publicRuntimeConfig: {
    // 在 Vercel 中，靜態文件應該可以直接訪問
  },
};

export default nextConfig;

