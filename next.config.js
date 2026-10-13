/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['d3t3ozftmdmh3i.cloudfront.net', 'megaphone.imgix.net', 'i.scdn.co'],
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/rho',
        destination: 'https://www.rho.co/partner/unit-economics',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
