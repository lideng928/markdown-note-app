/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors must fail the build; `npm run typecheck` runs the same check in CI.
  images: {
    unoptimized: true,
  },
}

export default nextConfig
