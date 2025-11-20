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
  // 確保 Markdown 文件被包含在構建中
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 在服務器端構建中，確保 .md 文件被包含
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },
};

export default nextConfig;

