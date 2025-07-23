"use client";
import { useState } from "react";
import { UserCircleIcon, HomeIcon, FireIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const menu = [
  { name: "แดชบอร์ด", href: "/admin", icon: HomeIcon },
  { name: "ข้อมูลต้นกล้า", href: "/admin/seedlings", icon: FireIcon },
  { name: "สถานะโครงการ", href: "/admin/status", icon: ChartBarIcon },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (responsive) */}
      <aside className={`fixed z-40 top-0 left-0 h-screen w-64 bg-white border-r flex flex-col justify-between py-6 px-4 shadow-sm transition-transform duration-300 md:static md:h-screen md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:flex`}>
        <div>
          <div className="flex items-center gap-2 mb-8">
            <span className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl">🌱</span>
            <span className="font-bold text-lg tracking-wide">เพราะกล้า</span>
          </div>
          <nav className="flex flex-col gap-2">
            {menu.map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition" onClick={() => setSidebarOpen(false)}>
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 mt-8 text-xs text-muted-foreground">
          <UserCircleIcon className="w-7 h-7" />
          <div>
            <div>ผู้ดูแลระบบ</div>
            <div>admin@example.com</div>
          </div>
        </div>
      </aside>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-0 ml-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center px-4 md:px-8 shadow-sm justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button className="md:hidden p-2 rounded hover:bg-muted focus:outline-none" onClick={() => setSidebarOpen(v => !v)} aria-label="เปิดเมนู">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="font-bold text-lg tracking-wide text-primary hidden md:block">แดชบอร์ดโครงการปลูกต้นกล้า</span>
          </div>
          <div className="flex items-center gap-4">
            <input type="text" placeholder="ค้นหา..." className="rounded-md border px-3 py-1.5 text-sm bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30 w-32 md:w-48" />
            <UserCircleIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        </header>
        <main className="flex-1 bg-muted px-2 py-4 md:px-8 md:py-8 w-full max-w-full">{children}</main>
      </div>
    </div>
  );
} 