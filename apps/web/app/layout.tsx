import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });
const notoSerif = Noto_Serif({ subsets: ["latin"], variable: '--font-serif' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'St. Kizito Parish App',
  description: 'A modern, secure platform for managing parish activities, announcements, events, mass times, and community engagement.',
  generator: 'v0.app',
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
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${notoSerif.variable}`}>
      <body className="font-sans antialiased bg-surface text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
