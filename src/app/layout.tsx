import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import './globals.css'
import { UserProvider } from '@/hooks/use-user'
import { ProjectProvider } from '@/context/project-context'
import { I18nProvider } from '@/context/i18n-context'
import { FirebaseClientProvider } from '@/firebase/client-provider'
import { SessionManager } from '@/components/session-manager'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontHeadline = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-headline',
});

export const metadata: Metadata = {
    title: 'Kuntala Pro Studio',
    description: 'A powerful web-based 2D Animation Studio with AI capabilities.',
    icons: {
        icon: '/Logo.png',
    },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeadline.variable
        )}
      >
        <FirebaseClientProvider>
          <UserProvider>
            <SessionManager />
            <I18nProvider>
              <ProjectProvider>
                {children}
              </ProjectProvider>
            </I18nProvider>
          </UserProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  )
}
