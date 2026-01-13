"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  MapPin, 
  UserCircle, 
  ShieldCheck,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dealer/dashboard" },
    { icon: ClipboardList, label: "Assigned Jobs", href: "/dealer/assigned-jobs" },
    { icon: MapPin, label: "Service Areas", href: "/dealer/service-areas" },
    { icon: UserCircle, label: "Dealer Profile", href: "/dealer/profile" },
  ];

  const handleLogout = () => {
    // Clear any stored auth data and redirect to login page
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Mobile Header - Visible only on mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-[#facc15] w-6 h-6" />
          <span className="font-bold text-lg tracking-tighter uppercase font-orbitron text-white">
            Security<span className="text-[#facc15]">.</span>
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 hover:bg-slate-800 rounded-md transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar - Desktop and Mobile Overlay */}
      <aside className={`
        w-64 bg-[#0f172a] text-white flex flex-col fixed h-full border-r border-slate-800 shadow-2xl z-40 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700 hidden md:flex items-center gap-2">
          <ShieldCheck className="text-[#facc15] w-8 h-8" />
          <span className="font-bold text-xl tracking-tighter uppercase font-orbitron">
            Security<span className="text-[#facc15]">.</span>
          </span>
        </div>

        {/* Mobile Spacer (Account for mobile header height) */}
        <div className="h-16 md:hidden"></div>
        
        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                  ? "bg-[#facc15] text-[#0f172a] font-bold shadow-lg shadow-[#facc15]/10" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-[#0f172a]" : "group-hover:text-[#facc15]"} />
                <span className="font-poppins text-xs uppercase tracking-widest font-semibold">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-700 bg-[#0a1120]">
          <div className="mb-4 px-3 flex items-center gap-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
             <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center text-[#0f172a] font-bold text-xs shrink-0 shadow-inner">
                N
             </div>
             <div className="overflow-hidden">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter truncate">Northern Dealer</p>
                <p className="text-xs text-white truncate font-poppins font-medium">Dealer Center</p>
             </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg w-full transition-all group font-bold font-poppins text-xs uppercase tracking-widest"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0">
        {/* Mobile Overlay for Sidebar */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}