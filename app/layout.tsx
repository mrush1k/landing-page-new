import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
// ThemeProvider removed to disable dark-mode toggling
import { DiagnosticProvider } from '@/components/diagnostic-provider';
import { Toaster } from '@/components/ui/toaster';

// Auto-initialize PDF generator for instant performance
if (typeof window === 'undefined') {
  import('@/lib/pdf-auto-init').catch(console.error)
}

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Invoice Easy - Simple Invoice Management',
  description: 'Professional invoice management for solo operators, contractors, and small businesses',
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Font is provided via next/font/google (Inter). next/font injects preload links automatically; */}
        {/* removed manual /fonts/inter-var.woff2 preload to avoid 404 during local dev */}
      </head>
      <body className={`${inter.className} no-scroll-x`}>
        <AuthProvider>
          <DiagnosticProvider>
            {children}
            <Toaster />
          </DiagnosticProvider>
        </AuthProvider>
        {/* Non-critical script: defer to avoid blocking initial render. TODO: remove in production if unnecessary */}
        <script src="/scripts/iframe-navigation.js" defer></script>
      </body>
    </html>
  );
}
