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
    FolderOpen,
    ChevronLeft,
    Menu
} from "lucide-react";

export default function Sidebar({ isCollapsed, toggleSidebar }) {
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
        { path: "/companies", label: "Company", icon: Building2, roles: ['Admin'] },
        { path: "/products", label: "Product", icon: Package, roles: ['Admin'] },
        { path: "/brands", label: "Brand", icon: Package, roles: ['Admin'] },
        { path: "/suppliers", label: "Supplier", icon: Truck, roles: ['Admin'] },
        { path: "/employees", label: "Employee", icon: Users, roles: ['Admin'] },
    ];

    const filteredNavItems = navItems.filter(item =>
        currentUser && item.roles.includes(currentUser.role)
    );

    const filteredMasterItems = masterItems.filter(item =>
        currentUser && item.roles.includes(currentUser.role)
    );

    const isMasterActive = masterItems.some(item => location.pathname.startsWith(item.path));

    // Handle Masters Click: If collapsed, expand sidebar. If expanded, toggle submenu.
    const handleMastersClick = () => {
        if (isCollapsed) {
            toggleSidebar();
            setMastersOpen(true);
        } else {
            setMastersOpen(!mastersOpen);
        }
    };

    return (
        <div
            className={`h-screen bg-gray-900 text-white flex flex-col fixed left-0 top-0 shadow-xl transition-all duration-300 ease-in-out z-50
            ${isCollapsed ? "w-20" : "w-64"}`}
        >
            {/* Header / Logo */}
            <div className={`h-20 flex items-center justify-center bg-gray-100 border-b border-r-2 border-gray-800 relative transition-all duration-300 w-full overflow-hidden
                ${isCollapsed ? 'px-2' : 'px-6'}`}>
                {isCollapsed ? (
                    <div className="flex items-center justify-center w-full h-full overflow-hidden">
                        <img src="/Niyantra_600x600.png" alt="Logo" className="w-full h-auto object-cover" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full gap-4">
                        <div className="flex items-center justify-center">
                            <img src="/niyantra.jpeg" alt="Logo" className="w-full h-auto object-contain" />
                        </div>
                    </div>
                )}

                {/* Toggle Button - Absolute positioned on the edge */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-24 bg-gray-800 text-gray-400 hover:text-white border border-gray-700 rounded-full p-1.5 shadow-md z-50 transition-transform hover:scale-110 hidden md:flex"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 space-y-2 overflow-y-auto no-scrollbar scroll-smooth px-3">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={isCollapsed ? item.label : ""}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                            ${isActive
                                    ? "bg-gray-800 text-white shadow-sm"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <Icon size={22} className={`min-w-[22px] transition-colors ${isActive ? "text-blue-400" : "group-hover:text-blue-400"}`} />

                            {!isCollapsed && (
                                <span className="truncate font-medium text-sm transition-opacity duration-300">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip for Collapsed State */}
                            {isCollapsed && (
                                <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[60] pointer-events-none border border-gray-700">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}

                {/* Masters Submenu */}
                {filteredMasterItems.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-gray-800/50">
                        <button
                            onClick={handleMastersClick}
                            title={isCollapsed ? "Masters" : ""}
                            className={`flex items-center justify-between w-full gap-3 px-3 py-3 rounded-lg transition-colors duration-200 group relative
                            ${isMasterActive
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <FolderOpen size={22} className={`min-w-[22px] ${isMasterActive ? "text-blue-400" : "group-hover:text-blue-400"}`} />
                                {!isCollapsed && <span className="font-medium text-sm">Masters</span>}
                            </div>
                            {!isCollapsed && (
                                <span className="text-gray-500 group-hover:text-white transition-colors">
                                    {mastersOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </span>
                            )}
                        </button>

                        {/* Submenu Items */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out
                            ${mastersOpen && !isCollapsed ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                            <div className="ml-5 pl-3 border-l border-gray-800 space-y-1 py-1">
                                {filteredMasterItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname.startsWith(item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm
                                            ${isActive
                                                    ? "text-blue-400 bg-gray-800/50"
                                                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"}`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                <Link to="/profile" className={`flex items-center gap-3 transition-all duration-300 rounded-lg p-2
                    ${isCollapsed ? 'justify-center' : 'hover:bg-gray-800'}`}>

                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shadow-md shrink-0 cursor-default">
                        {currentUser?.email?.[0].toUpperCase()}
                    </div>

                    {!isCollapsed && (
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-gray-200 truncate">{currentUser?.email}</p>
                            <p className="text-xs text-gray-500 capitalize">{currentUser?.role || 'No Role'}</p>
                        </div>
                    )}

                </Link>
            </div>
        </div>
    );
}
