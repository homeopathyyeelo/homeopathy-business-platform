'use client';

import { useState } from "react";
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
import { Search, Bell, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlobalSearch } from "@/lib/utils/global-search";

const Header = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const globalSearch = new GlobalSearch(router);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use universal search to determine the best module
      globalSearch.universalSearch(searchQuery);
      
      // Only show toast if not already on a relevant page
      const currentPath = window.location.pathname;
      if (!['/products', '/batches', '/sales', '/purchases'].some(path => currentPath.includes(path))) {
        toast({
          title: "Searching...",
          description: `Looking for "${searchQuery.trim()}"`
        });
      }
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
      <div className="w-1/3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search products, SKU, barcode..." 
            className="pl-10 w-full max-w-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
          />
        </form>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => {
            toast({
              title: "Notifications",
              description: "No new notifications"
            });
          }}
        >
          <Bell className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            0
          </Badge>
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
