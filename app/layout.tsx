import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import DynamicLayout from '@/components/layout/DynamicLayout'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'
import PageLoader from '@/components/common/PageLoader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Yeelo Homeopathy Platform',
  description: 'Complete homeopathy business management platform',
  generator: 'Yeelo Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.className}`} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <PageLoader />
            <DynamicLayout>
              {children}
            </DynamicLayout>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
