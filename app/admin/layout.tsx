import type React from "react"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Package, 
  ClipboardList,
  LogOut
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Customer Leads", href: "/admin/leads", icon: ClipboardList },
    { label: "Manage Dealers", href: "/admin/dealers", icon: Users },
    { label: "Price Control", href: "/admin/pricing", icon: Settings },
    { label: "Inventory", href: "/admin/inventory", icon: Package },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold font-orbitron tracking-tighter text-primary">
            CCK ADMIN
          </h2>
          <p className="text-xs text-muted-foreground font-poppins">Control Panel</p>
        </div>
        
        <Separator />
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground font-poppins"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <Separator className="mb-4" />
          <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors font-poppins">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="font-poppins text-sm font-medium text-muted-foreground">
            Welcome back, Administrator
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-bold font-orbitron">
              AD
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <section className="flex-1 overflow-y-auto p-8 font-poppins">
          {children}
        </section>
      </main>
    </div>
  )
}