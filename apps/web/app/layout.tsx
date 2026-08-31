import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"

import { QueryProvider } from "@/components/query-provider"
import { AuthProvider } from "@/lib/auth/auth-provider"

import "./globals.css"

export const metadata: Metadata = {
  title: "Skill Grill",
  description: "Community reviews and practical feedback for AI agent skills.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
