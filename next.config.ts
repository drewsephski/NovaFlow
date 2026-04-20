import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const internalHost = process.env.TAURI_DEV_HOST || 'localhost';
const isVercel = process.env.VERCEL === '1';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // No assetPrefix on Vercel (it handles CDN), use internal host for Tauri dev
  assetPrefix: isVercel ? undefined : (isProd ? undefined : `http://${internalHost}:3456`),
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
  reactStrictMode: false,
  turbopack: {},
  devIndicators: false,
  // Trailing slash for static export consistency
  trailingSlash: true,
  webpack: (config) => {
    // Filter flushSync warnings from Tiptap editor
    config.stats = {
      ...config.stats,
      warningsFilter: (warning: string) => {
        return !warning.includes('flushSync');
      }
    };
    return config;
  }
};

export default withNextIntl(nextConfig);
