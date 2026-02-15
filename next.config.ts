import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep x402-stacks server-only — its barrel export pulls in
  // Node.js-specific code (crypto, Express middleware) that crashes
  // the browser bundle.
  serverExternalPackages: ["x402-stacks"],

  // Ensure @stacks/* packages are transpiled for consistent builds.
  transpilePackages: [
    "@stacks/connect",
    "@stacks/network",
    "@stacks/transactions",
  ],
};

export default nextConfig;
