import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function MainLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="no-print">
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            </div>
            <main
                className={`flex-1 p-8 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "ml-20" : "ml-64"
                    }`}
            >
                <Outlet />
            </main>
        </div>
    );
}
