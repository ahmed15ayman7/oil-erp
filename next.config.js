/**
* @type {import('next').NextConfig} 
*/
//next.config.js
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [{ type: 'host', value: 'sporton.website' }],
        destination: 'https://sporton.website/:path*',
        permanent: true,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // serverActions: true,
    serverComponentsExternalPackages: ["mongoose"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "sporton.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "mimg6cdn.haraj.com.sa",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "images.dubizzle.com.eg",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

module.exports = nextConfig;
