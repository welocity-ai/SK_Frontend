import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const splineDist = path.join(
  __dirname,
  "node_modules/@splinetool/react-spline/dist",
);

const nextConfig = {
  turbopack: {},
  reactStrictMode: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@splinetool/react-spline$": path.join(splineDist, "react-spline.js"),
      "@splinetool/react-spline/next$": path.join(
        splineDist,
        "react-spline-next.js",
      ),
    };
    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "ncg-ifc-profiles.s3.ap-south-1.amazonaws.com" },
      { protocol: "https", hostname: "assets.welocity.ai" },
      { protocol: "https", hostname: "video.gumlet.io" },
      { protocol: "https", hostname: "vimeo.com" },
      { protocol: "https", hostname: "i.vimeocdn.com" },
    ],
  },
  env: {
    ENCRYPTION_KEY_HEX: process.env.ENCRYPTION_KEY_HEX,
    ENCRYPTION_IV_HEX: process.env.ENCRYPTION_IV_HEX,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK: process.env.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK,
    SANDBOX_API_KEY: process.env.SANDBOX_API_KEY,
    SANDBOX_API_SECRET: process.env.SANDBOX_API_SECRET,
    SANDBOX_API_BASE: process.env.SANDBOX_API_BASE,
    OCR_PIPELINE_URL: process.env.OCR_PIPELINE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=*, geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // For /api/verifications/123
        source: "/api/verifications/:path+",
        destination: "https://bgcapi.welocity.ai/api/verifications/:path+",
      },
      {
        // For /api/verifications (root collection) - MUST have a trailing slash for EC2 backend
        source: "/api/verifications",
        destination: "https://bgcapi.welocity.ai/api/verifications/",
      },
    ];
  },
};

export default nextConfig;
