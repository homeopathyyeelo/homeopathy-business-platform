
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileBarChart,
  Database,
  Settings,
  Send,
  FileText,
  Receipt,
  BarChart3,
  Calculator,
  Leaf
} from "lucide-react";

export function MainNav() {
  const location = useLocation();

  const NavLink = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
  >(({ className, title, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        {...props}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {children}
        </p>
      </a>
    );
  });
  NavLink.displayName = "NavLink";

  const isPathActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <NavigationMenu className="mx-6">
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link 
            to="/dashboard" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/dashboard") && "bg-accent/50"
            )}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className={isPathActive("/inventory") ? "bg-accent/50" : ""}>
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <NavLink
                    title="Inventory Management"
                    href="/inventory"
                  >
                    Manage your medicine inventory, track batches, expiry dates, and stock levels.
                  </NavLink>
                </NavigationMenuLink>
              </li>
              <li>
                <Link to="/inventory" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <div className="text-sm font-medium leading-none">Stock Overview</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    View current stock levels and inventory valuation.
                  </p>
                </Link>
              </li>
              <li>
                <Link to="/master" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <div className="text-sm font-medium leading-none">Product Management</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Create and manage products, categories, and brands.
                  </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className={isPathActive("/sales") ? "bg-accent/50" : ""}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Sales
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <NavLink
                    title="Sales Management"
                    href="/sales"
                  >
                    Create invoices, manage orders, and process payments for both retail and wholesale customers.
                  </NavLink>
                </NavigationMenuLink>
              </li>
              <li>
                <Link to="/sales" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <div className="text-sm font-medium leading-none">New Invoice</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Create a new sales invoice for customer.
                  </p>
                </Link>
              </li>
              <li>
                <Link to="/sales?tab=returns" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <div className="text-sm font-medium leading-none">Returns</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Process customer returns and manage credits.
                  </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/purchase" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/purchase") && "bg-accent/50"
            )}
          >
            <Database className="mr-2 h-4 w-4" />
            Purchases
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className={isPathActive("/customers") || isPathActive("/marketing") || isPathActive("/prescriptions") ? "bg-accent/50" : ""}>
            <Users className="mr-2 h-4 w-4" />
            Customers
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <NavLink
                    title="Customer Management"
                    href="/customers"
                  >
                    Manage retail and wholesale customers, view their purchase history and outstanding balances.
                  </NavLink>
                </NavigationMenuLink>
              </li>
              <li>
                <Link to="/customers" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <div className="text-sm font-medium leading-none">Customer List</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    View and manage your customer database.
                  </p>
                </Link>
              </li>
              <li>
                <Link to="/marketing" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <div className="text-sm font-medium leading-none">Marketing</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Send promotional messages via WhatsApp and SMS.
                  </p>
                </Link>
              </li>
              <li>
                <Link to="/prescriptions" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  <div className="text-sm font-medium leading-none">Prescriptions</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Manage patient prescriptions and refill reminders.
                  </p>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/marketing" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/marketing") && "bg-accent/50"
            )}
          >
            <Send className="mr-2 h-4 w-4" />
            Marketing
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/prescriptions" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/prescriptions") && "bg-accent/50"
            )}
          >
            <FileText className="mr-2 h-4 w-4" />
            Prescriptions
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/daily-billing" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/daily-billing") && "bg-accent/50"
            )}
          >
            <Receipt className="mr-2 h-4 w-4" />
            Daily Billing
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/gst" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/gst") && "bg-accent/50"
            )}
          >
            <Calculator className="mr-2 h-4 w-4" />
            GST
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/business-intelligence" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/business-intelligence") && "bg-accent/50"
            )}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Business Intelligence
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/reports" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/reports") && "bg-accent/50"
            )}
          >
            <FileBarChart className="mr-2 h-4 w-4" />
            Reports
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/features" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/features") && "bg-accent/50"
            )}
          >
            <Leaf className="mr-2 h-4 w-4" />
            Features
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link 
            to="/settings" 
            className={cn(
              "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
              isPathActive("/settings") && "bg-accent/50"
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
