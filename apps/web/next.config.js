/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // MetaMask SDK references this React Native module; web build can safely stub it.
      '@react-native-async-storage/async-storage': false,
    };
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;