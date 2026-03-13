import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  turbopack: {},
  output: "standalone",

  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");

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