'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { MENU_STRUCTURE } from '@/lib/menu-structure';

interface MegaMenuProps {
  children: React.ReactNode;
}

export default function CompleteMegaMenuNew({ children }: MegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMenuEnter = (menuId: string) => {
    if (menuTimerRef.current) {
      clearTimeout(menuTimerRef.current);
    }
    setActiveMenu(menuId);
    setIsMenuOpen(true);
  };

  const handleMenuLeave = () => {
    menuTimerRef.current = setTimeout(() => {
      setActiveMenu(null);
      setIsMenuOpen(false);
    }, 200);
  };

  const handleMenuClick = () => {
    setActiveMenu(null);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    return () => {
      if (menuTimerRef.current) {
        clearTimeout(menuTimerRef.current);
      }
    };
  }, []);

  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  const activeMenuData = activeMenu 
    ? MENU_STRUCTURE.topMenu.find(m => m.id === activeMenu)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav 
        className="bg-white shadow-md relative z-50"
        onMouseLeave={handleMenuLeave}
      >
        <div className="max-w-full mx-auto px-4">
          {/* Logo and Main Menu */}
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-3xl">🏥</div>
              <div>
                <h1 className="text-xl font-bold text-blue-600">Yeelo</h1>
                <p className="text-xs text-gray-500">Homeopathy ERP</p>
              </div>
            </Link>

            {/* Main Navigation - All Parent Menus */}
            <div className="hidden md:flex items-center space-x-1 overflow-x-auto flex-1 justify-center">
              {MENU_STRUCTURE.topMenu.map((menu) => (
                <div
                  key={menu.id}
                  className="relative"
                  onMouseEnter={() => {
                    if (menu.hasSubmenu) {
                      handleMenuEnter(menu.id);
                    }
                  }}
                >
                  {menu.hasSubmenu ? (
                    <button
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 whitespace-nowrap ${
                        activeMenu === menu.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">{menu.icon}</span>
                      {menu.title}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        activeMenu === menu.id ? 'rotate-180' : ''
                      }`} />
                    </button>
                  ) : (
                    <Link
                      href={menu.path}
                      className="px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 whitespace-nowrap text-gray-700 hover:bg-gray-100"
                    >
                      <span className="text-base">{menu.icon}</span>
                      {menu.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <Link 
                href="/pos"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                + New Sale
              </Link>
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-lg transition-shadow">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown with All Child Submenus */}
        {isMenuOpen && activeMenuData && activeMenuData.hasSubmenu && activeMenuData.submenu && (
          <div
            className="absolute left-0 right-0 bg-white border-t-2 border-blue-100 shadow-2xl z-50"
            style={{ top: '100%' }}
            onMouseEnter={() => {
              if (menuTimerRef.current) {
                clearTimeout(menuTimerRef.current);
              }
              setIsMenuOpen(true);
            }}
            onMouseLeave={handleMenuLeave}
          >
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Category Header */}
              <div className="mb-8 flex items-center gap-3">
                <span className="text-4xl">{activeMenuData.icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {activeMenuData.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeMenuData.submenu?.length || 0} modules available
                  </p>
                </div>
              </div>

              {/* Menu Items Grid - All Child Submenus */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {activeMenuData.submenu?.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={handleMenuClick}
                      className={`group p-4 rounded-xl transition-all duration-200 border-2 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-lg'
                          : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <h4 className={`font-bold text-sm mb-1 transition-colors ${
                              isActive ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                            }`}>
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                            Active
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {activeMenuData.submenu?.length || 0}
                    </span> modules in {activeMenuData.title}
                  </div>
                </div>
                <button 
                  onClick={handleMenuClick}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 group"
                >
                  Close Menu
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
