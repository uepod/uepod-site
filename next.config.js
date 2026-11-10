/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // The share-card route uses sharp's native binary. Leave it unbundled.
    serverComponentsExternalPackages: ["sharp"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) config.externals.push("sharp");
    return config;
  },
  images: {
    domains: ['d3t3ozftmdmh3i.cloudfront.net', 'megaphone.imgix.net', 'i.scdn.co'],
    unoptimized: true,
  },
  async rewrites() {
    // Password-encrypted analytics dashboard (static file; only ciphertext is committed).
    return [{ source: '/dash', destination: '/dash/index.html' }];
  },
  async headers() {
    return [
      {
        source: '/dash/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        source: '/dash',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
};

module.exports = nextConfig;
