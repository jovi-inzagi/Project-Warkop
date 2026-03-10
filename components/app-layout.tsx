'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  FileBarChart,
  Coffee,
  Bell,
  User,
  Settings,
  Moon,
  Sun,
  Search,
  ChevronRight,
  Truck,
  Database,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/lib/auth-context'
import { LogOut } from 'lucide-react'

const mainNavItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, description: 'Ringkasan bisnis' },
  { label: 'Checklist', href: '/checklist', icon: CheckSquare, description: 'Eksekusi produk terjual' },
  { label: 'Logistik', href: '/logistic', icon: Truck, description: 'Pengadaan barang' },
  { label: 'DB Review', href: '/db-review', icon: Database, description: 'Tinjau model database' },
  { label: 'Inventory', href: '/inventory', icon: Package, description: 'Kelola stok barang' },
  { label: 'Cash Flow', href: '/cash-flow', icon: TrendingUp, description: 'Arus kas' },
  { label: 'Laporan', href: '/reports', icon: FileBarChart, description: 'Analisis & ekspor' },
]

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': { title: 'Dashboard', description: 'Ringkasan performa bisnis Anda' },
  '/checklist': { title: 'Checklist Penjualan', description: 'Ceklis produk terjual tanpa alur POS' },
  '/logistic': { title: 'Logistik', description: 'Kelola pengadaan bahan baku & makanan minuman' },
  '/db-review': { title: 'DB Review', description: 'Pratinjau struktur tabel dan relasi database' },
  '/inventory': { title: 'Inventory', description: 'Kelola stok dan persediaan barang' },
  '/cash-flow': { title: 'Cash Flow', description: 'Monitor arus kas masuk dan keluar' },
  '/reports': { title: 'Laporan', description: 'Analisis data dan ekspor laporan' },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const pageInfo = pageTitles[pathname] || { title: 'Halaman', description: '' }

  // Generate breadcrumb
  const breadcrumbs = pathname === '/' ? ['Dashboard'] : pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' '))

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="inset" collapsible="icon" className="border-r-0">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-all duration-300 group-hover:scale-105">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <h1 className="text-base font-bold tracking-tight text-sidebar-foreground">Kantor</h1>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Reborn</p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 mb-1">
              Menu Utama
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        size="default"
                        className={`transition-all duration-200 rounded-lg ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200/50 dark:border-amber-700/50 shadow-sm'
                            : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Link href={item.href}>
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-600 dark:text-amber-400' : ''}`} />
                          <span className="text-sm">{item.label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 ml-auto text-amber-500" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 mb-1">
              Pengaturan
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Pengaturan" className="hover:bg-muted/60 text-muted-foreground hover:text-foreground rounded-lg">
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Pengaturan</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarSeparator className="mb-2" />
          <div className="flex items-center gap-3 px-1">
            <Avatar className="h-8 w-8 border-2 border-amber-200/50">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KR'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.role || 'Kantor Reborn'}</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/40">
            <div className="flex items-center justify-between gap-4 px-4 md:px-6 h-14">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="shrink-0" />

                {/* Breadcrumb */}
                <nav className="hidden sm:flex items-center gap-1.5 text-sm">
                  <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                  </Link>
                  {breadcrumbs.map((crumb, idx) => (
                    <span key={idx} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                      <span className={idx === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                        {crumb}
                      </span>
                    </span>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="hidden md:flex relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari..."
                    className="w-56 h-8 pl-8 text-xs bg-muted/40 border-transparent focus:border-border focus:bg-background"
                  />
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-8 w-8">
                      <Bell className="w-4 h-4" />
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        3
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifikasi</TooltipContent>
                </Tooltip>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-bold">
                          {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'KR'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">
                      <div>
                        <p>{user?.name || 'User'}</p>
                        <p className="text-[10px] font-normal text-muted-foreground">{user?.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs">
                      <User className="w-3.5 h-3.5 mr-2" />
                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">
                      <Settings className="w-3.5 h-3.5 mr-2" />
                      Pengaturan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" onClick={logout}>
                      <LogOut className="w-3.5 h-3.5 mr-2" />
                      Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

