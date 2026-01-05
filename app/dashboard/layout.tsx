"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen flex-col bg-gray-50/50">
            <DashboardHeader />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
