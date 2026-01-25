"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  Library,
  LogOut,
  ChevronUp,
  Plus,
  Layers,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navigationItems = [
  {
    title: "Panel Principal",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Exámenes",
    url: "/dashboard/exams",
    icon: BookOpen,
  },
  {
    title: "Banco de Preguntas",
    url: "/dashboard/questions",
    icon: Library,
  },
  {
    title: "Mis Asignaturas",
    url: "/dashboard/subjects",
    icon: Layers,
  },
  {
    title: "Estudiantes",
    url: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Calificaciones",
    url: "/dashboard/grades",
    icon: GraduationCap,
  },
]

const quickActions = [
  {
    title: "Nuevo Examen",
    url: "/dashboard/exams/create",
    icon: Plus,
  },
  {
    title: "Nueva Pregunta",
    url: "/dashboard/questions/create",
    icon: Plus,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { setOpen, setOpenMobile, isMobile } = useSidebar()

  const handleMouseEnter = () => {
    setOpen(true)
  }

  const handleMouseLeave = () => {
    setOpen(false)
  }

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(url)
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-200 bg-white"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarHeader className="border-b border-gray-100">
        <Link href="/dashboard" className="flex h-8 items-center" onClick={handleNavigation}>
          <Image
            src="/isotipo.png"
            alt="EVALHUB"
            width={32}
            height={32}
            className="hidden h-8 w-8 shrink-0 object-contain transition-transform duration-200 md:block"
          />
          <span className="overflow-hidden transition-all duration-200 ease-linear md:ml-2 md:group-data-[collapsible=icon]:ml-0 md:group-data-[collapsible=icon]:w-0 md:group-data-[collapsible=icon]:opacity-0">
            <Image
              src="/logotipo.png"
              alt="EVALHUB"
              width={110}
              height={28}
              className="h-7 w-auto object-contain"
            />
          </span>
        </Link>
      </SidebarHeader>
      <SidebarRail />

      <SidebarContent >
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="transition-colors hover:bg-gray-100 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  >
                    <Link href={item.url} onClick={handleNavigation}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Acciones Rápidas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="transition-colors hover:bg-gray-100"
                  >
                    <Link href={item.url} onClick={handleNavigation}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-100 ">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full transition-colors hover:bg-gray-100"
                >
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {user?.full_name ? getInitials(user.full_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-gray-900">
                      {user?.full_name}
                    </span>
                    <span className="truncate text-xs text-gray-500">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] min-w-56"
                align="start"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
