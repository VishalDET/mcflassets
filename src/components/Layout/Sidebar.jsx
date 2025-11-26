import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Monitor, ArrowRightLeft, FileText, Users, LogOut } from "lucide-react";
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
    ];

    return (
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold">Asset Manager</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                }`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}
