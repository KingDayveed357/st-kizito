import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ServiceWorkerRegistrar } from '@/components/pwa/service-worker-registrar'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });
const notoSerif = Noto_Serif({ subsets: ["latin"], variable: '--font-serif' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // `maximumScale: 1` / `userScalable: false` were removed: they block pinch-zoom, which is a WCAG
  // 1.4.4 failure and a real problem for a parish audience that skews older. See
  // docs/ACCESSIBILITY-STANDARDS.md — scalable text is a stated requirement, not a nicety.
  themeColor: '#4A7C59',
}

export const metadata: Metadata = {
  title: 'St. Kizito Parish App',
  description: 'A modern, secure platform for managing parish activities, announcements, events, mass times, and community engagement.',
  generator: 'v0.app',
  applicationName: 'Kizito Admin',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kizito Admin',
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stkizito-parish.app',
    siteName: 'St. Kizito Parish App',
    title: 'St. Kizito Parish App',
    description: 'A modern platform for parish management and community engagement',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // `suppressHydrationWarning` is required by next-themes: it sets `class` and `color-scheme` on
    // <html> before React hydrates, which the server HTML cannot know about. It suppresses the
    // warning for this element's attributes only, not for the tree beneath it.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSerif.variable}`}
    >
      <body className="font-sans antialiased bg-surface text-foreground">
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
        <ServiceWorkerRegistrar />
        <Analytics />
      </body>
    </html>
  )
}
