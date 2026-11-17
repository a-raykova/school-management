/** @type {import('next').NextConfig} */

// basic protection headers on every response
const securityHeaders = [
  // the app can't be shown inside a frame on another site (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // the browser must not guess file types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // don't send full URLs (which can contain ids) to other sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // the app doesn't use the camera, microphone or location
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // once served over HTTPS, browsers stay on HTTPS (ignored on plain http://localhost)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

const nextConfig = {
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig