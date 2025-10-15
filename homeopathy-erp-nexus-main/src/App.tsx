
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Purchase from "./pages/Purchase";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import MasterManagement from "./pages/MasterManagement";
import Settings from "./pages/Settings";
import Customers from "./pages/Customers";
import Marketing from "./pages/Marketing";
import Prescriptions from "./pages/Prescriptions";
import Delivery from "./pages/Delivery";
import LoyaltyProgram from "./pages/LoyaltyProgram";
import Email from "./pages/Email";
import DailyBilling from "./pages/DailyBilling";
import GST from "./pages/GST";
import BusinessIntelligence from "./pages/BusinessIntelligence";
import Features from "./pages/Features";
import { initializeDatabase } from "@/lib/db";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize database connection on app start
  useEffect(() => {
    const initDb = async () => {
      try {
        const result = await initializeDatabase();
        if (!result) {
          setInitError("Failed to initialize database connection. Please check your settings.");
        }
      } catch (error) {
        console.error("Database initialization error:", error);
        setInitError("An error occurred while initializing the database.");
      } finally {
        setIsInitializing(false);
      }
    };
    
    initDb();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Initializing ERP System...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h2>
          <p className="mb-6">{initError}</p>
          <p className="mb-4">Please check your database settings in the Settings page.</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<Features />} />
              
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Master Management Routes */}
                <Route path="/master" element={<MasterManagement />} />
                
                {/* Inventory Routes */}
                <Route path="/inventory" element={<Inventory />} />
                
                {/* Sales Routes */}
                <Route path="/sales" element={<Sales />} />
                
                {/* Purchase Routes */}
                <Route path="/purchase" element={<Purchase />} />
                <Route path="/purchases" element={<Navigate to="/purchase" />} />
                
                {/* Customer Routes */}
                <Route path="/customers" element={<Customers />} />
                
                {/* Loyalty Program Route */}
                <Route path="/loyalty" element={<LoyaltyProgram />} />
                
                {/* Marketing Routes */}
                <Route path="/marketing" element={<Marketing />} />
                
                {/* Email Routes */}
                <Route path="/email" element={<Email />} />
                
                {/* Prescription Routes */}
                <Route path="/prescriptions" element={<Prescriptions />} />
                
                {/* Delivery Routes */}
                <Route path="/delivery" element={<Delivery />} />
                
                {/* Daily Billing Routes */}
                <Route path="/daily-billing" element={<DailyBilling />} />
                
                {/* GST Routes */}
                <Route path="/gst" element={<GST />} />
                
                {/* Business Intelligence Routes */}
                <Route path="/business-intelligence" element={<BusinessIntelligence />} />
                
                {/* Reports Routes */}
                <Route path="/reports" element={<Reports />} />
                
                {/* Settings Route */}
                <Route path="/settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
