import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
