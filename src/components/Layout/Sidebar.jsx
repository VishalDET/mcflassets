import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Monitor, ArrowRightLeft, FileText, Users, LogOut, Building2, Box } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
    const location = useLocation();
    const { logout } = useAuth();

    const navItems = [
        { path: "/", label: "Dashboard", icon: LayoutDashboard },
        { path: "/assets", label: "Assets", icon: Monitor },
        { path: "/transfers", label: "Transfers", icon: ArrowRightLeft },
        { path: "/reports", label: "Reports", icon: FileText },
        { path: "/users", label: "Users", icon: Users },
        { path: "/companies", label: "Company Master", icon: Building2 },
    ];

    return (
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 shadow-lg">
            <div className="p-0 border-b border-gray-800 flex flex-col items-center">
                <div className="w-auto h-full bg-white flex items-center justify-center mb-0 overflow-hidden
                    rounded-b-lg
                    shadow-md border-r-4 border-l-4 border-gray-800">
                    <img src="/niyantra.jpeg" alt="Niyantra Logo" className="w-full h-full object-cover" />
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 
                            ${location.pathname === item.path
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </nav>
            <div className="p-2 border-t border-gray-800">
                <div className="text-center text-gray-400 text-[11px] py-2">
                    Niyantra — Smart Asset Management System
                </div>
            </div>
            <div className="p-2 border-t border-gray-800 text-center bg-gray-200 border-r-4 border-gray-800 rounded-t-lg">
                <a href="https://digitaledgetech.in/" className="text-gray-600 font-light py-2 text-[10px]">© 2025 Digital Edge Technologies</a>
            </div>
        </div>
    );
}
