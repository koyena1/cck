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
  Users
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { AdminAuthGuard } from "./AdminAuthGuard"
import { useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    router.push('/admin/login')
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
      label: "C. ACCOUNTS", 
      href: "/admin/accounts", 
      icon: Wallet,
      description: "Summary, Sales, Purchase, Payments"
    },
    { 
      label: "D. DEALERS", 
      href: "/admin/dealers", 
      icon: Users,
      description: "Approve, Manage & Monitor Dealers"
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

  // If on login or register page, show minimal layout
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return <AdminAuthGuard>{children}</AdminAuthGuard>
  }

  return (
    <AdminAuthGuard>
      <div className="flex h-screen bg-slate-50">
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
        w-72 border-r bg-white shadow-lg
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
        overflow-hidden
      `}>
        <div className="p-6 border-b bg-gradient-to-br from-purple-50 to-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-black text-sm">◉</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-purple-600">
                Protechtur
              </h2>
            </div>
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2">Admin Panel</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all hover:bg-purple-50 hover:text-purple-600 group"
            >
              <item.icon className="w-5 h-5 mt-0.5 text-slate-400 group-hover:text-purple-600" />
              <div className="flex-1">
                <div className="font-bold text-slate-700 group-hover:text-purple-600">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
              </div>
            </Link>
          ))}
          
          {/* Categories Section */}
          <div className="pt-2">
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all hover:bg-purple-50 hover:text-purple-600 group w-full text-left"
            >
              <Grid3x3 className="w-5 h-5 mt-0.5 text-slate-400 group-hover:text-purple-600" />
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-700 group-hover:text-purple-600">F. CATEGORIES</div>
                <div className="text-[10px] text-slate-400 font-normal">Product Management</div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {categoriesOpen && (
              <div className="ml-8 mt-1 space-y-1">
                {categoryItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-start gap-3 px-4 py-2 rounded-lg text-sm transition-all hover:bg-purple-50 ${
                      pathname === item.href ? 'bg-purple-50 text-purple-600' : 'text-slate-600'
                    }`}
                  >
                    <Package className="w-4 h-4 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        
        <Separator />
        
        <div className="p-4 space-y-1">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
            Settings
          </p>
          {settingsItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all hover:bg-purple-50 hover:text-purple-600 group"
            >
              <item.icon className="w-5 h-5 mt-0.5 text-slate-400 group-hover:text-purple-600" />
              <div className="flex-1">
                <div className="font-bold text-slate-700 group-hover:text-purple-600">{item.label}</div>
                <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>
        
        <Separator />
        
        <div className="p-4 pb-6">
          <Link 
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
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
        h-screen overflow-hidden
      `}>
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 shadow-sm flex-shrink-0">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          
          <div className="text-sm font-medium text-slate-600 hidden sm:block">
            Welcome back, <span className="font-bold text-slate-900">Administrator</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg hover:bg-slate-50 transition-all">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white shadow-md">
                AD
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:inline">Admin User</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <section className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </section>
      </main>
    </div>
    </AdminAuthGuard>
  )
}