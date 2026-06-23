/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
module.exports = {
  output: 'export',
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
