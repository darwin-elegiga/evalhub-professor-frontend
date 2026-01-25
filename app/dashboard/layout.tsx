"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { AuthGuard } from "@/components/auth-guard"
import { HeaderActionsProvider } from "@/lib/header-actions-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <HeaderActionsProvider>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset>
            <DashboardHeader />
            <div className="flex-1 bg-gray-50/50">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </HeaderActionsProvider>
    </AuthGuard>
  )
}
