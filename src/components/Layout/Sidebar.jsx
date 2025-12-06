import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import {
    LayoutDashboard,
    Box,
    Users,
    FileBarChart,
    LogOut,
    Building2,
    ArrowRightLeft,
    Monitor,
    FileText,
    Package,
    Truck,
    ChevronDown,
    ChevronRight,
    FolderOpen
} from "lucide-react";

export default function Sidebar() {
    const location = useLocation();
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const [mastersOpen, setMastersOpen] = useState(true);

    const navItems = [
        { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['Admin', 'Staff', 'Viewer'] },
        { path: "/assets", label: "Assets", icon: Monitor, roles: ['Admin', 'Staff', 'Viewer'] },
        { path: "/transfers", label: "Transfers", icon: ArrowRightLeft, roles: ['Admin', 'Staff'] },
        { path: "/reports", label: "Reports", icon: FileText, roles: ['Admin', 'Staff', 'Viewer'] },
        { path: "/users", label: "Users", icon: Users, roles: ['Admin'] },
    ];

    const masterItems = [
        { path: "/companies", label: "Company Master", icon: Building2, roles: ['Admin'] },
        { path: "/products", label: "Product Master", icon: Package, roles: ['Admin'] },
        { path: "/suppliers", label: "Supplier Master", icon: Truck, roles: ['Admin'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        currentUser && item.roles.includes(currentUser.role)
    );

    const filteredMasterItems = masterItems.filter(item =>
        currentUser && item.roles.includes(currentUser.role)
    );

    const isMasterActive = masterItems.some(item => location.pathname.startsWith(item.path));

    return (
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 shadow-lg">
            <div className="p-0 border-b border-gray-800 flex flex-col items-center">
                <div className="w-auto h-full bg-white flex items-center justify-center mb-0 overflow-hidden
                    rounded-b-lg
                    shadow-md border-r-4 border-l-4 border-gray-800">
                    <img src="/niyantra.jpeg" alt="Niyantra Logo" className="w-full h-full object-cover" />
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {filteredNavItems.map((item) => {
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

                {/* Masters Submenu */}
                {filteredMasterItems.length > 0 && (
                    <div>
                        <button
                            onClick={() => setMastersOpen(!mastersOpen)}
                            className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 
                            ${isMasterActive
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
                        >
                            <div className="flex items-center gap-3">
                                <FolderOpen size={20} />
                                <span>Masters</span>
                            </div>
                            {mastersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {mastersOpen && (
                            <div className="ml-4 mt-1 space-y-1">
                                {filteredMasterItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname.startsWith(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 text-sm
                                            ${isActive
                                                    ? "bg-gray-800 text-white"
                                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
                                        >
                                            <Icon size={18} />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </nav>
            <div className="px-0 py-2">
                <div className="flex items-center gap-3 mb-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold">
                        {currentUser?.email?.[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-300 truncate">{currentUser?.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{currentUser?.role || 'No Role'}</p>
                    </div>
                </div>
            </div>
            <button
                onClick={logout}
                className="flex items-center space-x-3 px-4 py-3 w-full text-left text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
                <LogOut size={20} />
                <span>Logout</span>
            </button>
            <div className="p-2 border-t border-gray-800">
                <div className="text-center text-gray-400 text-[11px] py-2">
                    Niyantra — Smart Asset Management System
                </div>
            </div>
            <div className="p-2 border-t border-gray-800 text-center bg-gray-200 border-r-4 border-gray-800 rounded-t-lg">
                <a href="https://digitaledgetech.in/" target="_blank" className="text-gray-600 font-light py-2 text-[10px]">© 2025 Digital Edge Technologies</a>
            </div>
        </div>
    );
}
