import { withContentCollections } from "@content-collections/next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.invoicely.gg", // Cloudflare R2 Storage
      },
    ],
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["@react-pdf/renderer", "jotai-devtools"],
  productionBrowserSourceMaps: true,
  devIndicators: false,
};

export default withBundleAnalyzer({
  enabled: process.env.CONFIG_BUILD_ANALYZE === "true",
})(withContentCollections(nextConfig));
