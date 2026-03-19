'use client'
import type React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  ShoppingCart,
  Wallet,
  Headphones,
  LogIn,
  LogOut,
  ChevronDown,
  Settings,
  Grid3x3,
  Package,
  Menu,
  X,
  Users,
  Moon,
  Sun,
  Boxes,
  Bell,
  Trash2
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { AdminAuthGuard } from "./AdminAuthGuard"
import { useEffect, useRef, useState } from "react"
import { ThemeProvider, useTheme } from "./ThemeProvider"

interface AdminNotification {
  id: number
  title: string
  message: string
  type: string
  priority: string
  is_read: boolean
  action_url?: string | null
  created_at: string
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [dealersOpen, setDealersOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const fetchAdminNotifications = async () => {
    try {
      const response = await fetch('/api/portal-notifications?portal=admin')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/portal-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark admin notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      const selected = notifications.find(n => n.id === notificationId)
      await fetch(`/api/portal-notifications?notificationId=${notificationId}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (selected && !selected.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete admin notification:', error)
    }
  }

  useEffect(() => {
    fetchAdminNotifications()
    const interval = setInterval(fetchAdminNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    // Redirect to main login page instead
    router.push('/login')
  }
  const navItems = [
    { 
      label: "A. DASHBOARD", 
      href: "/admin/dashboard", 
      icon: LayoutDashboard,
      description: "Total, Pending, Overview"
    },
    { 
      label: "B. ORDERS", 
      href: "/admin/orders", 
      icon: ShoppingCart,
      description: "Today, Pending, Closed, Monthly"
    },
    { 
      label: "C. STOCK", 
      href: "/admin/stock", 
      icon: Boxes,
      description: "Total value, dealer breakdown, urgency flags"
    },
    { 
      label: "D. ACCOUNTS", 
      href: "/admin/accounts", 
      icon: Wallet,
      description: "Summary, Sales, Purchase, Payments"
    },
    { 
      label: "E. SERVICE SUPPORT", 
      href: "/admin/service", 
      icon: Headphones,
      description: "Calls, AMC, Site Visits"
    },
    { 
      label: "F. LOGIN", 
      href: "/admin/access", 
      icon: LogIn,
      description: "Tele, Field, Marchent, Online Sales"
    },
  ];

  const dealerItems = [
    {
      label: "Dealer Management",
      href: "/admin/dealers",
      description: "Approve & manage dealers"
    },
    {
      label: "District Management",
      href: "/admin/district-management",
      description: "District-wise dealer management"
    },
    {
      label: "Dealer Rewards",
      href: "/admin/dealer-rewards",
      description: "Assign reward points & gifts"
    },
    {
      label: "Product Pricing",
      href: "/admin/dealers/product-pricing",
      description: "Manage dealer product pricing"
    },
    {
      label: "Dealer Invoices",
      href: "/admin/dealers/invoices",
      description: "View all dealer invoices"
    },
    {
      label: "Dealer Proformas",
      href: "/admin/dealers/proforma",
      description: "Generate & manage dealer proformas"
    },
    {
      label: "Admin Registrations",
      href: "/admin/pending-admins",
      description: "Approve pending admin accounts"
    },
  ];

  const categoryItems = [
    {
      label: "HD Combo",
      href: "/admin/categories/hd-combo",
      description: "Manage HD Combo products"
    },
    {
      label: "IP Combo",
      href: "/admin/categories/ip-combo",
      description: "Manage IP Combo products"
    },
    {
      label: "WiFi Camera",
      href: "/admin/categories/wifi-camera",
      description: "Manage WiFi Camera products"
    },
    {
      label: "4G SIM Camera",
      href: "/admin/categories/4g-sim-camera",
      description: "Manage 4G SIM Camera products"
    },
    {
      label: "Solar Camera",
      href: "/admin/categories/solar-camera",
      description: "Manage Solar Camera products"
    },
    {
      label: "Body Worn Camera",
      href: "/admin/categories/body-worn-camera",
      description: "Manage Body Worn Camera products"
    },
    {
      label: "HD Camera",
      href: "/admin/categories/hd-camera",
      description: "Manage HD Camera products"
    },
    {
      label: "IP Camera",
      href: "/admin/categories/ip-camera",
      description: "Manage IP Camera products"
    },
  ];

  const settingsItems = [
    { 
      label: "Quotation Management", 
      href: "/admin/quotation", 
      icon: Settings,
      description: "Edit automated quotation products & pricing"
    },
    { 
      label: "Pricing Management", 
      href: "/admin/pricing", 
      icon: Settings,
      description: "Complete pricing: cameras, accessories, cables, installation & AMC"
    },
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors overflow-hidden">  
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 sm:w-72 border-r bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
        overflow-hidden
      `} style={{ maxHeight: '100vh' }}>
        <div className="p-4 sm:p-6 border-b bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-700 dark:border-slate-700 shrink-0 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/logo2.png" 
                alt="Protechtur Logo" 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain"
              />
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-purple-600 dark:text-purple-400">
                Protechtur
              </h2>
            </div>
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 sm:p-2 hover:bg-purple-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-300 font-semibold mt-2">Admin Panel</p>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent overscroll-contain smooth-scroll" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
        <nav className="p-2 sm:p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 group"
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-700 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">{item.label}</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-400 font-normal line-clamp-1">{item.description}</div>
              </div>
            </Link>
          ))}
          
          {/* Dealers Section */}
          <div className="pt-2">
            <button
              onClick={() => setDealersOpen(!dealersOpen)}
              className="flex items-start gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 group w-full text-left"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              <div className="flex-1 text-left min-w-0">
                <div className="font-bold text-slate-700 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">D. DEALERS</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-400 font-normal line-clamp-1">Approve, Manage & Monitor Dealers</div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-700 dark:text-slate-100 transition-transform ${dealersOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dealersOpen && (
              <div className="ml-4 sm:ml-8 mt-1 space-y-1">
                {dealerItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-start gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all hover:bg-purple-50 dark:hover:bg-slate-700 ${
                      pathname === item.href ? 'bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-200'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{item.label}</div>
                      <div className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-400 font-normal line-clamp-1">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Categories Section */}
          <div className="pt-2">
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 group w-full text-left"
            >
              <Grid3x3 className="w-5 h-5 mt-0.5 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-700 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">F. CATEGORIES</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">Product Management</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-700 dark:text-slate-100 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {categoriesOpen && (
              <div className="ml-8 mt-1 space-y-1">
                {categoryItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-start gap-3 px-4 py-2 rounded-lg text-sm transition-all hover:bg-purple-50 dark:hover:bg-slate-700 ${
                      pathname === item.href ? 'bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-200'
                    }`}
                  >
                    <Package className="w-4 h-4 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-400 font-normal">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        
        <Separator className="dark:bg-slate-700" />
        
        <div className="p-4 space-y-1">
          <p className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">
            Settings
          </p>
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400 group"
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-slate-400 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-700 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">{item.label}</div>
                <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-400 font-normal line-clamp-1">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
        
        <Separator className="dark:bg-slate-700" />
        
        <div className="p-3 sm:p-4 pb-4 sm:pb-6">
          <Link 
            href="/login"
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all w-full"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            Logout
          </Link>
        </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`
        flex-1 flex flex-col
        transition-all duration-300
        ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}
        overflow-hidden h-screen
      `}>
        {/* Top Header */}
        <header className="h-14 sm:h-16 border-b bg-white dark:bg-slate-800 dark:border-slate-700 flex items-center justify-between px-3 sm:px-4 md:px-8 shadow-sm shrink-0 transition-colors">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 dark:text-slate-300" />
          </button>
          
          <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hidden md:block">
            Welcome back, <span className="font-bold text-slate-900 dark:text-white">Administrator</span>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 ml-auto">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-[360px] bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold">{unreadCount} unread</span>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer ${!n.is_read ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''}`}
                          onClick={() => {
                            if (!n.is_read) markNotificationAsRead(n.id)
                            if (n.action_url) {
                              setIsNotificationOpen(false)
                              router.push(n.action_url)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                              <p className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(n.id)
                              }}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-md">
                AD
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-100 hidden lg:inline">Admin User</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <section className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors overscroll-contain smooth-scroll" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
          {children}
        </section>
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthGuard>
      <ThemeProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ThemeProvider>
    </AdminAuthGuard>
  )
}