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
  title: {
    default: "Skill Grill: Reviews and Ratings for AI Agent Skills",
    template: "%s | Skill Grill",
  },
  description: "Firsthand reviews and ratings for AI agent skills that need to deliver.",
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
    title: "Skill Grill: Reviews and Ratings for AI Agent Skills",
    description: "Firsthand reviews and ratings for AI agent skills that need to deliver.",
    images: [
      {
        url: "/assets/social-preview.png",
        width: 1280,
        height: 640,
        alt: "Skill Grill: reviews and ratings for AI agent skills",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Grill: Reviews and Ratings for AI Agent Skills",
    description: "Firsthand reviews and ratings for AI agent skills that need to deliver.",
    images: ["/assets/social-preview.png"],
  },
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
      <head>
        <link rel="describedby" href="/llms.txt" type="text/markdown" />
      </head>
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
