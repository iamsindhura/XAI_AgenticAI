"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Info, 
  GraduationCap, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "About Project", href: "/about", icon: Info },
    { name: "Counselling Portal", href: "/start", icon: GraduationCap },
    { name: "Student Dashboard", href: "/dashboard", icon: TrendingUp },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-100 bg-white pt-16 transition-all duration-300 ease-in-out md:sticky md:top-16 md:h-[calc(100vh-4rem)]
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 ${sidebarWidth}
      `}
    >
      {/* Collapse Toggle Trigger (Desktop only) */}
      <div className="hidden justify-end px-3 py-2 md:flex">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-slate-100 bg-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group relative
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
                
                {/* Collapsed Tooltip fallback */}
                {collapsed && (
                  <span className="absolute left-14 z-50 rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer-section info inside sidebar */}
      {!collapsed && (
        <div className="border-t border-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500">Fully Deterministic Engine Active</span>
          </div>
        </div>
      )}
    </aside>
  );
};
