"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU_STRUCTURE } from "@/lib/menu-structure";
import { ChevronDown, Menu, X, Search, Bell, Settings } from "lucide-react";

interface HybridMegaThreeLayoutProps {
  children: React.ReactNode;
}

export default function HybridMegaThreeLayout({ children }: HybridMegaThreeLayoutProps) {
  const pathname = usePathname();

  // Top mega menu state
  const [activeTop, setActiveTop] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sidebars
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    return () => {
      if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    };
  }, []);

  if (pathname === "/login" || pathname === "/") {
    return <>{children}</>;
  }

  const handleMenuEnter = (id: string) => {
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    setActiveTop(id);
    setIsMenuOpen(true);
  };
  const handleMenuLeave = () => {
    menuTimerRef.current = setTimeout(() => {
      setActiveTop(null);
      setIsMenuOpen(false);
    }, 220);
  };

  const activeMenuData = activeTop
    ? MENU_STRUCTURE.topMenu.find((m) => m.id === activeTop)
    : null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR - Quick access + important master menus */}
      <aside
        className={`${leftOpen ? "w-64" : "w-0"} transition-all duration-300 bg-white border-r shadow-sm overflow-hidden flex flex-col`}
      >
        {leftOpen && (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                <div>
                  <div className="text-sm font-bold text-blue-600">Yeelo ERP</div>
                  <div className="text-[11px] text-gray-500">Homeopathy</div>
                </div>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              <div className="px-4 mb-2 text-[11px] font-semibold text-gray-500 uppercase">
                Quick Access
              </div>
              {MENU_STRUCTURE.leftSidebar.map((item) => {
                const isActive =
                  pathname === item.path || pathname.startsWith(item.path + "/");
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="text-[10px] rounded-full bg-green-500 px-2 py-0.5 text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="px-4 mt-4 mb-2 text-[11px] font-semibold text-gray-500 uppercase">
                Masters
              </div>
              {/* Example masters shortcuts */}
              <div className="space-y-1">
                <Link href="/masters/branches/add" className="mx-2 block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  + Add Branch
                </Link>
                <Link href="/products/add" className="mx-2 block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  + Add Product
                </Link>
                <Link href="/customers/add" className="mx-2 block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  + Add Customer
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* MAIN COLUMN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR with Hover Mega Menu */}
        <header className="bg-white border-b relative z-50" onMouseLeave={handleMenuLeave}>
          <div className="h-14 px-3 flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftOpen(!leftOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Toggle Left Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Top Menus as triggers */}
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {MENU_STRUCTURE.topMenu.map((menu) => (
                  <div
                    key={menu.id}
                    className="relative"
                    onMouseEnter={() => menu.hasSubmenu && handleMenuEnter(menu.id)}
                  >
                    {menu.hasSubmenu ? (
                      <button
                        className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 transition-colors ${
                          activeTop === menu.id
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-base">{menu.icon}</span>
                        {menu.title}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            activeTop === menu.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={menu.path}
                        className="px-3 py-1.5 text-sm rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                      >
                        <span className="text-base">{menu.icon}</span>
                        {menu.title}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 relative" onClick={() => setRightOpen(!rightOpen)}>
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white text-xs font-bold flex items-center justify-center">
                A
              </div>
            </div>
          </div>

          {/* Hover Mega Menu Panel */}
          {isMenuOpen && activeMenuData && activeMenuData.hasSubmenu && activeMenuData.submenu && (
            <div
              className="absolute left-0 right-0 bg-white border-t shadow-2xl"
              style={{ top: "100%" }}
              onMouseEnter={() => {
                if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
                setIsMenuOpen(true);
              }}
              onMouseLeave={handleMenuLeave}
            >
              <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{activeMenuData.icon}</span>
                  <h3 className="text-xl font-bold text-gray-900">{activeMenuData.title}</h3>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {activeMenuData.submenu.map((item) => {
                    const isActive =
                      pathname === item.path || pathname.startsWith(item.path + "/");
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`group p-4 rounded-lg border transition-all ${
                          isActive
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => {
                          setActiveTop(null);
                          setIsMenuOpen(false);
                        }}
                      >
                        <div className="text-sm font-semibold mb-1 text-gray-900 group-hover:text-blue-700">
                          {item.title}
                        </div>
                        {item.desc && (
                          <div className="text-xs text-gray-600 leading-relaxed">{item.desc}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* RIGHT SIDEBAR - Quick actions */}
      <aside
        className={`${rightOpen ? "w-72" : "w-0"} transition-all duration-300 bg-white border-l shadow-sm overflow-hidden flex flex-col`}
      >
        {rightOpen && (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900">Quick Access</div>
                <div className="text-[11px] text-gray-500">Create & View</div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setRightOpen(false)}>
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              <div className="px-4 mb-2 text-[11px] font-semibold text-gray-500 uppercase">
                Create New
              </div>
              {MENU_STRUCTURE.rightSidebar.quickActions.map((qa) => (
                <Link
                  key={qa.path}
                  href={qa.path}
                  className="mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <span className="text-base">{qa.icon}</span>
                  <span>{qa.title}</span>
                </Link>
              ))}

              <div className="px-4 mt-4 mb-2 text-[11px] font-semibold text-gray-500 uppercase">
                Views
              </div>
              <Link href="/reports" className="mx-2 block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Reports
              </Link>
              <Link href="/analytics" className="mx-2 block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Analytics
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
