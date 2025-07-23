"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { UserCircleIcon, Bars3Icon, XMarkIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { menuItems } from "@/data/menu";

// --- NavLink Component with Sliding Indicator ---
const NavLink = ({
  item,
  isActive,
  onClick,
}: {
  item: typeof menuItems[0];
  isActive: boolean;
  onClick: () => void;
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={clsx(
      "relative z-10 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      {
        "text-primary font-semibold": isActive,
        "text-muted-foreground hover:text-primary": !isActive,
      }
    )}
  >
    <item.icon className="h-5 w-5" />
    <span>{item.name}</span>
  </Link>
);

// --- Sidebar Content ---
const SidebarContent = ({ onLinkClick, user, mounted, setUser }: { onLinkClick: () => void, user: any, mounted: boolean, setUser: (u: any) => void }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3 px-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-sm">
          🌱
        </span>
        <span className="text-lg font-bold tracking-wide text-foreground">เพราะกล้า</span>
      </div>

      {/* Navigation */}
      <nav className="relative flex flex-col gap-1">
        {menuItems.map((item) => (
          <div key={item.href} className="relative">
             {pathname === item.href && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 z-0 rounded-lg bg-primary/10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <NavLink
              item={item}
              isActive={pathname === item.href}
              onClick={onLinkClick}
            />
          </div>
        ))}
      </nav>

      {/* User Profile & Logout (client-only) */}
      {mounted && user && (
        <div className="mt-auto border-t pt-2">
          <div className="flex w-full items-center gap-3 rounded-lg p-2">
            <UserCircleIcon className="h-9 w-9 text-muted-foreground" />
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-foreground">ผู้ดูแลระบบ</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="relative z-10 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors duration-200 hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      )}
    </div>
  );
};


// --- Main DashboardShell ---
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let _mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (_mounted) setUser(data?.user || null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      _mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Static Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-background p-4 shadow-sm lg:flex">
        <SidebarContent onLinkClick={() => {}} user={user} mounted={mounted} setUser={setUser} />
      </aside>

      {/* Mobile Sidebar with Animation */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={toggleSidebar}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-50 h-full w-64 border-r bg-background p-4 lg:hidden"
            >
              <SidebarContent onLinkClick={closeSidebar} user={user} mounted={mounted} setUser={setUser} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <button
            onClick={toggleSidebar}
            className="p-2 text-muted-foreground hover:text-primary lg:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          {/* Spacer to push user menu to the right */}
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="ค้นหา..."
              className="w-32 rounded-md border bg-transparent px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:w-48"
            />
            {mounted && user ? (
              <UserCircleIcon className="h-8 w-8 cursor-pointer text-muted-foreground transition-colors hover:text-primary" />
            ) : mounted && !user ? (
              <Link href="/login">
                <button className="rounded-md border px-4 py-1.5 text-sm text-primary hover:bg-primary/10 transition-colors">เข้าสู่ระบบ</button>
              </Link>
            ) : null}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
