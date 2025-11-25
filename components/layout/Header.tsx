'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, User, Settings, LogOut, Package, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { golangAPI } from "@/lib/api";

interface SearchResult {
  id: string;
  name: string;
  type: string;
  module: string;
  navigate_url: string;
  brand?: string;
  category?: string;
  sku?: string;
  description?: string;
}

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_GOLANG_API_URL || 'http://localhost:3005';
  
  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    console.log('🔄 useEffect triggered with query:', searchQuery);
    const delayDebounceFn = setTimeout(() => {
      console.log('⏰ Debounce timeout finished. Query length:', searchQuery.trim().length);
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        console.log('🧹 Clearing results (query too short)');
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    console.log('🔍 Performing search for:', query);
    setIsSearching(true);
    try {
      const response = await golangAPI.get(`/api/erp/search?q=${encodeURIComponent(query)}&type=all&limit=10`);
      console.log('✅ Search response:', response);
      
      if (response.data && response.data.success && response.data.hits) {
        console.log('📈 Hits found:', response.data.hits.length);
        setSearchResults(response.data.hits);
        setShowResults(true);
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    router.push(result.navigate_url);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };
  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      toast({
        title: "Logout Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <header className="w-full h-16 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="w-1/3" ref={searchRef}>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
          )}
          <Input 
            placeholder="Search: SBL Mother Tincture, product name, customer..." 
            className="pl-10 pr-10 w-full max-w-md"
            value={searchQuery}
            onChange={(e) => {
              console.log('⌨️ Input change:', e.target.value);
              setSearchQuery(e.target.value);
            }}
            onFocus={() => {
              console.log('👀 Input focused');
              if (searchResults.length > 0) setShowResults(true);
            }}
          />
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <Card className="absolute top-full mt-2 w-full max-w-md z-50 shadow-lg">
              <CardContent className="p-2 max-h-96 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="flex items-start gap-3 p-3 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                  >
                    <div className="mt-1">
                      {result.type === 'product' ? (
                        <Package className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Users className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{result.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {result.module}
                        </Badge>
                      </div>
                      {result.brand && (
                        <p className="text-xs text-muted-foreground">
                          {result.brand} {result.category && `• ${result.category}`}
                        </p>
                      )}
                      {result.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {result.sku}</p>
                      )}
                      {result.description && (
                        <p className="text-xs text-muted-foreground">{result.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
            <Card className="absolute top-full mt-2 w-full max-w-md z-50 shadow-lg">
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{searchQuery}"
              </CardContent>
            </Card>
          )}
        </form>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => router.push('/notifications')}
        >
          <Bell className="h-5 w-5" />
          {/* <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            0
          </Badge> */}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName[0]}${user.lastName[0]}` 
                    : user?.displayName?.substring(0, 2) || "AD"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || 
                   (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Admin User")}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "admin@homeopathy-erp.com"}
                </p>
                {user?.roles && user.roles.length > 0 && (
                  <Badge variant="outline" className="text-[10px] w-fit mt-1">
                    {user.roles[0]}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
