/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'liga-os.vercel.app', 'utfs.io', 'i.pinimg.com'],
  },
  turbopack: {}
};

module.exports = withPWA(nextConfig);
