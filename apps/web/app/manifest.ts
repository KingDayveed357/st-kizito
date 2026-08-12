import type { MetadataRoute } from 'next'

/**
 * PWA manifest (served at /manifest.webmanifest; Next injects the <link> automatically).
 * Makes the admin portal installable on desktop and Android with a standalone window.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'St. Kizito Parish Admin',
    short_name: 'Kizito Admin',
    description:
      'Manage parish announcements, events, Mass bookings, donations, sacramental requests and more.',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    background_color: '#0F1117',
    theme_color: '#4A7C59',
    orientation: 'portrait-primary',
    categories: ['productivity', 'business'],
    icons: [
      { src: '/favicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/favicon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }
}
