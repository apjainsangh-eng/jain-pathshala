/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongodb'],
  // Niyam Yatra is its own deployment (NIYAM_ORIGIN, served with basePath /niyam) shown on this site at
  // /niyam, so families and admins never leave the Pathshala website. beforeFiles: ahead of app/[slug].
  async rewrites() {
    const origin = (process.env.NIYAM_ORIGIN || '').replace(/\/+$/, '');
    // Android app link check (lib/server/androidApp.js)
    const assetLinks = { source: '/.well-known/assetlinks.json', destination: '/api/app/assetlinks' };
    if (!origin) return { beforeFiles: [assetLinks] };
    return {
      beforeFiles: [
        assetLinks,
        { source: '/niyam', destination: `${origin}/niyam` },
        { source: '/niyam/:path*', destination: `${origin}/niyam/:path*` },
      ],
    };
  },
};

export default nextConfig;
