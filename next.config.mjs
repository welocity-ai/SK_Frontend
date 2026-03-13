const nextConfig = {
  turbopack: {},
  env: {
    NEXT_PUBLIC_DIDIT_APP_ID: process.env.NEXT_PUBLIC_DIDIT_APP_ID,
    NEXT_PUBLIC_DIDIT_WORKFLOW_ID: process.env.NEXT_PUBLIC_DIDIT_WORKFLOW_ID,
    NEXT_PUBLIC_DIDIT_REDIRECT_URI: process.env.NEXT_PUBLIC_DIDIT_REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  output: "standalone",

  webpack(config) {
    // Exclude svg from Next's default loader
    const fileLoaderRule = config.module.rules.find(
      (rule) => rule.test?.test?.(".svg")
    )

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i
    }

    // Add SVGR loader
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: /component/, // <-- IMPORTANT
      use: ["@svgr/webpack"],
    })

    return config
  },
}

export default nextConfig;
