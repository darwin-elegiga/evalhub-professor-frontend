import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"
import "katex/dist/katex.min.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "EVALHUB - Sistema de Evaluación Universitaria",
    template: "%s | EVALHUB",
  },
  description:
    "Plataforma de evaluación académica para profesores universitarios. Crea exámenes, gestiona estudiantes y califica de manera eficiente.",
  icons: {
    icon: "/isotipo.png",
    apple: "/isotipo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
