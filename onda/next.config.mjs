/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/settings", destination: "/dashboard/settings", permanent: false },
    ];
  },
};

export default nextConfig;
