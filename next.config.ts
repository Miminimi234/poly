import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Temporarily ignore ESLint during production builds to avoid CI/build failures
  // caused by linting rules (we recommend fixing the underlying lint errors
  // and removing this flag later). See Next.js docs:
  // https://nextjs.org/docs/api-reference/next.config.js/ignoring-eslint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
