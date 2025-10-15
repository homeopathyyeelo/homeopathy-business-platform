
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Inbox, 
  ShoppingCart, 
  Database, 
  ClipboardList, 
  Settings, 
  Calendar,
  Layers,
  Home,
  FileText,
  Truck,
  Send,
  Award,
  Mail
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  isActive: boolean;
  collapsed: boolean;
}

const SidebarItem = ({ icon, title, to, isActive, collapsed }: SidebarItemProps) => {
  return (
    <Link to={to} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 mb-1",
          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
        )}
      >
        {icon}
        {!collapsed && <span>{title}</span>}
      </Button>
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    {
      title: "Home",
      icon: <Home size={20} />,
      to: "/",
    },
    {
      title: "Dashboard",
      icon: <Calendar size={20} />,
      to: "/dashboard",
    },
    {
      title: "Master",
      icon: <Layers size={20} />,
      to: "/master",
    },
    {
      title: "Inventory",
      icon: <Database size={20} />,
      to: "/inventory",
    },
    {
      title: "Sales",
      icon: <ShoppingCart size={20} />,
      to: "/sales",
    },
    {
      title: "Purchases",
      icon: <Inbox size={20} />,
      to: "/purchase",
    },
    {
      title: "Customers",
      icon: <Users size={20} />,
      to: "/customers",
    },
    {
      title: "Loyalty",
      icon: <Award size={20} />,
      to: "/loyalty",
    },
    {
      title: "Prescriptions",
      icon: <FileText size={20} />,
      to: "/prescriptions",
    },
    {
      title: "Marketing",
      icon: <Send size={20} />,
      to: "/marketing",
    },
    {
      title: "Email",
      icon: <Mail size={20} />,
      to: "/email",
    },
    {
      title: "Delivery",
      icon: <Truck size={20} />,
      to: "/delivery",
    },
    {
      title: "Reports",
      icon: <ClipboardList size={20} />,
      to: "/reports",
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      to: "/settings",
    },
  ];

  return (
    <div className={cn(
      "h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className={cn("overflow-hidden", collapsed ? "w-0" : "w-full")}>
          <h1 className="text-xl font-bold">Homeopathy ERP</h1>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground"
        >
          {collapsed ? "→" : "←"}
        </Button>
      </div>
      <div className="p-2 overflow-y-auto h-[calc(100vh-64px)]">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            title={item.title}
            to={item.to}
            isActive={isActive(item.to)}
            collapsed={collapsed}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
