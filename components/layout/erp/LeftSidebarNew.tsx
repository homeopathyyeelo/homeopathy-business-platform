'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Search, X, Menu } from 'lucide-react';
import { navigationMenu, filterMenuByRole, MenuItem } from '@/lib/navigation-config';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole?: string;
  userPermissions?: string[];
}

export default function LeftSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  userRole = 'admin',
  userPermissions = []
}: LeftSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['dashboard']));

  // Filter menu based on role and permissions
  const filteredMenu = useMemo(() => {
    return filterMenuByRole(navigationMenu, userRole, userPermissions);
  }, [userRole, userPermissions]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return filteredMenu;

    const query = searchQuery.toLowerCase();
    const results: MenuItem[] = [];

    const searchInMenu = (items: MenuItem[]) => {
      items.forEach(item => {
        const matchesLabel = item.label.toLowerCase().includes(query);
        const matchesPath = item.path?.toLowerCase().includes(query);
        
        if (matchesLabel || matchesPath) {
          results.push(item);
        }
        
        if (item.children) {
          searchInMenu(item.children);
        }
      });
    };

    searchInMenu(filteredMenu);
    return results;
  }, [searchQuery, filteredMenu]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + '/');
  };

  const hasActiveChild = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.path) || hasActiveChild(child.children));
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.id);
    const isItemActive = isActive(item.path);
    const hasActiveChildren = hasActiveChild(item.children);
    const Icon = item.icon;

    return (
      <div key={item.id} className="w-full">
        {/* Menu Item */}
        <div
          className={cn(
            'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'hover:bg-accent/50 cursor-pointer',
            isItemActive && 'bg-primary/10 text-primary font-medium',
            hasActiveChildren && !isItemActive && 'bg-accent/30',
            level > 0 && 'ml-4'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            }
          }}
        >
          {/* Icon */}
          {!isCollapsed && (
            <Icon
              className={cn(
                'h-5 w-5 shrink-0 transition-colors',
                isItemActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
          )}

          {/* Collapsed Icon Only */}
          {isCollapsed && (
            <div className="flex items-center justify-center w-full">
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isItemActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
            </div>
          )}

          {/* Label and Badge */}
          {!isCollapsed && (
            <>
              {item.path ? (
                <Link href={item.path} className="flex-1 flex items-center justify-between">
                  <span className="text-sm truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ) : (
                <span className="flex-1 text-sm truncate">{item.label}</span>
              )}

              {/* Expand/Collapse Icon */}
              {hasChildren && (
                <div className="ml-auto">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </>
          )}

          {/* Active Indicator */}
          {isItemActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-card border-r border-border z-50 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">H</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">HomeoERP</span>
                  <span className="text-xs text-muted-foreground">v2.1.0</span>
                </div>
              </div>
            )}

            {isCollapsed && (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="text-primary-foreground font-bold text-lg">H</span>
              </div>
            )}

            {/* Toggle Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="hidden lg:flex h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {!isCollapsed && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {searchQuery ? (
                // Search Results
                <>
                  {searchResults.length > 0 ? (
                    searchResults.map(item => renderMenuItem(item))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No results found
                    </div>
                  )}
                </>
              ) : (
                // Full Menu
                <>
                  {filteredMenu.map(item => renderMenuItem(item))}
                </>
              )}
            </nav>
          </ScrollArea>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>System Online</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
