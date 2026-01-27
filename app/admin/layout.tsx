import type React from "react"
import Link from "next/link"
import { 
  LayoutDashboard, 
  ShoppingCart,
  Wallet,
  Headphones,
  LogIn,
  LogOut,
  ChevronDown,
  Settings
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      label: "D. SERVICE SUPPORT", 
      href: "/admin/service", 
      icon: Headphones,
      description: "Calls, AMC, Site Visits"
    },
    { 
      label: "E. LOGIN", 
      href: "/admin/access", 
      icon: LogIn,
      description: "Tele, Field, Marchent, Online Sales"
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 border-r bg-white shadow-sm hidden md:flex flex-col">
        <div className="p-6 border-b bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">◉</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-purple-600">
              Protechtur
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2">Admin Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
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
        
        <div className="p-4">
          <Link 
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shadow-sm">
          <div className="text-sm font-medium text-slate-600">
            Welcome back, <span className="font-bold text-slate-900">Administrator</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black text-white shadow-md">
                AD
              </div>
              <span className="text-sm font-semibold text-slate-700">Admin User</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <section className="flex-1 overflow-y-auto p-8">
          {children}
        </section>
      </main>
    </div>
  )
}