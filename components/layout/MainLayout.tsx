
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "../shared/Footer";
import DatabaseStatus from "../shared/DatabaseStatus";

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
        <Footer />
      </div>
      
      {/* Database Status - Fixed position */}
      <div className="fixed bottom-4 right-4 z-50">
        <DatabaseStatus className="w-64" />
      </div>
    </div>
  );
};

export default MainLayout;
