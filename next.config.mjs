const nextConfig = {
  turbopack: {},
  output: "standalone",

  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule) => rule.test?.test?.(".svg")
    )

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i
    }

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      resourceQuery: /component/,
      use: ["@svgr/webpack"],
    })

    return config
  },
}

export default nextConfig