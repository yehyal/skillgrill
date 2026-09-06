import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { Toaster } from "sonner"

import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-provider"
import { siteConfig } from "@/lib/site-config"

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: siteConfig.siteUrl ? new URL(siteConfig.siteUrl) : undefined,
  title: siteConfig.name,
  description: "Firsthand reviews and ratings for AI agent skills that need to deliver.",
  ...(siteConfig.indexable
    ? {}
    : {
        robots: {
          index: false,
          follow: false,
          noarchive: true,
        },
      }),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster
                theme="system"
                position="bottom-right"
                closeButton
                toastOptions={{
                  style: { background: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)" },
                  classNames: {
                    toast: "border-border bg-card text-card-foreground",
                    description: "!text-muted-foreground",
                    closeButton: "!border-border !bg-popover !text-popover-foreground",
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
