/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['d3t3ozftmdmh3i.cloudfront.net', 'megaphone.imgix.net', 'i.scdn.co'],
    unoptimized: true,
  },
};

module.exports = nextConfig;
