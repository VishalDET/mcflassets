import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAssets } from "../services/db";
import { useDatabase } from "../context/DatabaseContext";
import { Users, Landmark, IndianRupee } from "lucide-react";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from "recharts";
import { Building, Clock, Activity, Box, CheckCircle, AlertTriangle, Wrench, Trash2, ShieldAlert, Calendar, History, X } from "lucide-react";
import Loader from "../components/common/Loader";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
    const [stats, setStats] = useState({
        total: 0,
        assigned: 0,
        available: 0,
        inRepair: 0,
        scrapped: 0,
        totalCompanies: 0,
        totalBranches: 0,
        totalEmployees: 0,
        totalWorth: 0,
        warranty30: 0,
        warranty60: 0,
        warranty90: 0
    });
    const { companies, employees, getBranches } = useDatabase();
    const [chartsData, setChartsData] = useState({
        statusData: [],
        companyData: [],
        growthData: [],
        quarterlyData: [],
        ageData: []
    });
    const [recentAssets, setRecentAssets] = useState([]);
    const [warrantyAssets, setWarrantyAssets] = useState({ 30: [], 60: [], 90: [] });
    const [selectedBucket, setSelectedBucket] = useState(null); // '30', '60', or '90'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const assets = await getAssets();

                // 1. Basic Stats
                const total = assets.length;
                const assigned = assets.filter(a => a.status === "Assigned").length;
                const available = assets.filter(a => a.status === "Active" || a.status === "Available").length;
                const inRepair = assets.filter(a => a.status === "In Repair").length;
                const scrappedCount = assets.filter(a => a.status === "Scrapped").length;

                const totalWorth = assets.reduce((sum, asset) => {
                    const amt = parseFloat(asset.amount) || 0;
                    return sum + amt;
                }, 0);

                const totalCompanies = companies.length;
                const totalEmployees = employees.length;

                // Fetch branch count
                let branchCount = 0;
                try {
                    const branchPromises = companies.map(c => getBranches(c.id));
                    const branchResults = await Promise.all(branchPromises);
                    branchCount = branchResults.reduce((sum, branches) => sum + branches.length, 0);
                } catch (error) {
                    console.error("Error calculating branch count:", error);
                }

                // Calculate Warranty Alerts
                const now = new Date();
                const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);
                const sixtyDays = new Date(); sixtyDays.setDate(now.getDate() + 60);
                const ninetyDays = new Date(); ninetyDays.setDate(now.getDate() + 90);

                let warranty30 = [];
                let warranty60 = [];
                let warranty90 = [];

                // Calculate Age Distribution
                let ageNew = 0; // < 1 year
                let ageGood = 0; // 1-3 years
                let ageOld = 0; // > 3 years

                assets.forEach(asset => {
                    // Warranty
                    if (asset.warrantyExpiry) {
                        const expiry = new Date(asset.warrantyExpiry);
                        if (expiry > now) {
                            if (expiry <= thirtyDays) warranty30.push(asset);
                            else if (expiry <= sixtyDays) warranty60.push(asset);
                            else if (expiry <= ninetyDays) warranty90.push(asset);
                        }
                    }

                    // Age
                    if (asset.dateOfAcquisition) {
                        const acquisition = new Date(asset.dateOfAcquisition);
                        const ageInYears = (now - acquisition) / (1000 * 60 * 60 * 24 * 365.25);
                        if (ageInYears < 1) ageNew++;
                        else if (ageInYears <= 3) ageGood++;
                        else ageOld++;
                    }
                });

                setStats({
                    total,
                    assigned,
                    available,
                    inRepair,
                    scrapped: scrappedCount,
                    totalCompanies,
                    totalEmployees,
                    totalBranches: branchCount,
                    totalWorth,
                    warranty30: warranty30.length,
                    warranty60: warranty60.length,
                    warranty90: warranty90.length
                });

                setWarrantyAssets({
                    30: warranty30,
                    60: warranty60,
                    90: warranty90
                });

                const ageData = [
                    { name: 'New (<1yr)', value: ageNew },
                    { name: 'Good (1-3yrs)', value: ageGood },
                    { name: 'Old (>3yrs)', value: ageOld }
                ].filter(d => d.value > 0);

                // 2. Status Distribution (Pie Chart)
                const statusCounts = assets.reduce((acc, asset) => {
                    const status = asset.status || "Unknown";
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {});
                const statusData = Object.keys(statusCounts).map(key => ({
                    name: key,
                    value: statusCounts[key]
                }));

                // 3. Assets by Company (Bar Chart)
                const companyCounts = assets.reduce((acc, asset) => {
                    const company = asset.companyName || "Unknown";
                    acc[company] = (acc[company] || 0) + 1;
                    return acc;
                }, {});
                const companyData = Object.keys(companyCounts).map(key => ({
                    name: key,
                    count: companyCounts[key]
                })).sort((a, b) => b.count - a.count).slice(0, 5);

                // 4. Asset Growth (Area Chart)
                const growthMap = assets.reduce((acc, asset) => {
                    if (asset.dateOfAcquisition) {
                        const date = new Date(asset.dateOfAcquisition);
                        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        acc[key] = (acc[key] || 0) + 1;
                    }
                    return acc;
                }, {});

                const sortedKeys = Object.keys(growthMap).sort();
                let cumulative = 0;
                const growthData = sortedKeys.map(key => {
                    cumulative += growthMap[key];
                    return {
                        date: key,
                        assets: cumulative
                    };
                });

                // 5. Quarterly Breakdown by Status (showing current status distribution)
                const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                const totalAssets = assets.length;
                const assetsPerQuarter = Math.ceil(totalAssets / 4);

                const quarterlyData = quarters.map((quarter, index) => {
                    // Distribute assets evenly across quarters for visualization
                    const startIdx = index * assetsPerQuarter;
                    const endIdx = Math.min(startIdx + assetsPerQuarter, totalAssets);
                    const quarterAssets = assets.slice(startIdx, endIdx);

                    const assigned = quarterAssets.filter(a => a.status === "Assigned").length;
                    const available = quarterAssets.filter(a => a.status === "Active" || a.status === "Available").length;
                    const inRepair = quarterAssets.filter(a => a.status === "In Repair").length;
                    const scrapped = quarterAssets.filter(a => a.status === "Scrapped").length;
                    const total = quarterAssets.length;

                    return {
                        quarter,
                        total,
                        assigned,
                        available,
                        inRepair,
                        scrapped
                    };
                });

                setChartsData({ statusData, companyData, growthData, quarterlyData, ageData });

                // 5. Recent Activity
                const sortedAssets = [...assets].sort((a, b) => {
                    const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
                    const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
                    return dateB - dateA;
                });
                setRecentAssets(sortedAssets.slice(0, 5));

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [companies, employees]); // Added companies/employees to dependency since we use them for stats

    const handleWarrantyClick = (bucket) => {
        setSelectedBucket(bucket);
        setIsModalOpen(true);
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your assets.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Dashboard Stats - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Asset Metrics */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-gray-400" /> Asset Lifecycle
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Total Assets */}
                        <div className="bg-gradient-to-br from-gray-500 to-gray-800 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300 animate-slide-up h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-100 font-medium mb-1 text-sm">Total Assets</p>
                                    <h3 className="text-3xl font-bold">{stats.total}</h3>
                                </div>
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Box className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-100 flex items-center gap-1 opacity-80">
                                <span className="bg-white/20 px-1 py-0.5 rounded text-[10px]">+12%</span> from last month
                            </div>
                        </div>

                        {/* Assigned */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-100 group h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1 text-sm">Assigned</p>
                                    <h3 className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{stats.assigned}</h3>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-gray-100 transition-colors">
                                    <CheckCircle className="w-5 h-5 text-gray-600" />
                                </div>
                            </div>
                            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-800 to-gray-400 h-1.5 rounded-full" style={{ width: `${(stats.assigned / stats.total) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Available */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-200 group h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1 text-sm">Available</p>
                                    <h3 className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{stats.available}</h3>
                                </div>
                                <div className="bg-green-50 p-2 rounded-lg group-hover:bg-green-100 transition-colors">
                                    <Activity className="w-5 h-5 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(stats.available / stats.total) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Combined In-Repair / Scrapped */}
                        <div className="grid grid-cols-1 gap-2">
                            <div className="bg-white p-3 py-2 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-300 group h-full">

                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs text-gray-400 font-medium">Repairing</span>
                                    <Wrench size={14} className="text-orange-500" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{stats.inRepair}</h4>

                            </div>
                            <div className="bg-white p-3 py-2 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-300 group h-full">

                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs text-gray-400 font-medium">Scrapped</span>
                                    <Trash2 size={14} className="text-red-500" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">{stats.scrapped}</h4>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Column 2: Business Metrics */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <Building className="w-5 h-5 text-gray-400" /> Ecosystem Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Companies */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-400 group h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1 text-sm">Total Companies</p>
                                    <h3 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{stats.totalCompanies}</h3>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <Building className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-400">
                                Registered entities
                            </div>
                        </div>

                        {/* Branches */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-500 group h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1 text-sm">Total Branches</p>
                                    <h3 className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{stats.totalBranches}</h3>
                                </div>
                                <div className="bg-indigo-50 p-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                    <Landmark className="w-5 h-5 text-indigo-600" />
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-400">
                                Locations across all companies
                            </div>
                        </div>

                        {/* Employees */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-600 group h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 font-medium mb-1 text-sm">Total Employees</p>
                                    <h3 className="text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{stats.totalEmployees}</h3>
                                </div>
                                <div className="bg-purple-50 p-2 rounded-lg group-hover:bg-purple-100 transition-colors">
                                    <Users className="w-5 h-5 text-purple-600" />
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-400">
                                Active system users
                            </div>
                        </div>

                        {/* Total Worth */}
                        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300 animate-slide-up delay-700 h-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-green-50 font-medium mb-1 text-sm">Asset Worth (Approx)</p>
                                    <h3 className="text-2xl font-bold text-white">₹ {stats.totalWorth.toLocaleString('en-IN')}</h3>
                                </div>
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <IndianRupee className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-4 text-[10px] text-green-50 flex items-center gap-1 opacity-80 uppercase tracking-wider font-semibold">
                                Financial Snapshot
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-200 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" /> Asset Status Distribution
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartsData.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartsData.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Assets by Company */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-200 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Building className="w-5 h-5 text-gray-400" /> Top Companies
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData.companyData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <defs>
                                    <linearGradient id="gradCompany" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#4B5563" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#111827" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <Bar dataKey="count" fill="url(#gradCompany)" radius={[0, 6, 6, 0]} barSize={24} stroke="#111827" strokeWidth={1} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>


            </div>

            <div className="grid grid-cols-7 gap-6">
                {/* Quarterly Assets Breakdown */}
                <div className="bg-white col-span-3 p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-200 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" /> Quarterly Assets Breakdown ({new Date().getFullYear()})
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData.quarterlyData} barSize={70}>
                                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="quarter" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <defs>
                                    <linearGradient id="gradAssigned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#b2b2b2ff" stopOpacity={1} />
                                        <stop offset="70%" stopColor="#303030ff" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradAvailable" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradInRepair" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FBBF24" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#D97706" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradScrapped" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F87171" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <Legend iconType="circle" />
                                <Bar dataKey="assigned" stackId="a" fill="url(#gradAssigned)" name="Assigned" radius={[0, 0, 0, 0]} stroke="#1F2937" strokeWidth={1} />
                                <Bar dataKey="available" stackId="a" fill="url(#gradAvailable)" name="Available" radius={[0, 0, 0, 0]} stroke="#059669" strokeWidth={1} />
                                <Bar dataKey="inRepair" stackId="a" fill="url(#gradInRepair)" name="In Repair" radius={[0, 0, 0, 0]} stroke="#B45309" strokeWidth={1} />
                                <Bar dataKey="scrapped" stackId="a" fill="url(#gradScrapped)" name="Scrapped" radius={[6, 6, 0, 0]} stroke="#B91C1C" strokeWidth={1} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                {/* Warranty Alerts Widget */}
                <div className="bg-white col-span-2 p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-300 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-500" /> Warranty Expirations
                    </h3>
                    <div className="space-y-4">
                        <div
                            onClick={() => handleWarrantyClick('30')}
                            className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100 group hover:bg-red-100 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-red-900">Next 30 Days</p>
                                    <p className="text-xs text-red-600">Immediate attention</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-red-700">{stats.warranty30}</span>
                        </div>

                        <div
                            onClick={() => handleWarrantyClick('60')}
                            className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100 group hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-orange-900">Next 60 Days</p>
                                    <p className="text-xs text-orange-600">Upcoming renewals</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-orange-700">{stats.warranty60}</span>
                        </div>

                        <div
                            onClick={() => handleWarrantyClick('90')}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 group hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500 p-2 rounded-lg text-white group-hover:scale-110 transition-transform">
                                    <Activity size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">Next 90 Days</p>
                                    <p className="text-xs text-blue-600">Planning phase</p>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-blue-700">{stats.warranty90}</span>
                        </div>
                    </div>
                </div>
                {/* Asset Age Distribution */}
                <div className="bg-white col-span-2 p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-300 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" /> Inventory Ageing
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
                                    <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#2563EB" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradGood" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradOld" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F87171" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <Pie
                                    data={chartsData.ageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartsData.ageData.map((entry, index) => {
                                        let fill = "url(#gradNew)";
                                        if (entry.name.includes("Good")) fill = "url(#gradGood)";
                                        if (entry.name.includes("Old")) fill = "url(#gradOld)";
                                        return <Cell key={`cell-${index}`} fill={fill} strokeWidth={0} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Section 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


                {/* Asset Growth */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-300 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" /> Growth Trends
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartsData.growthData}>
                                <defs>
                                    <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="assets" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAssets)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-300 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" /> Recent Activity
                    </h3>
                    <div className="space-y-2">
                        {recentAssets.map((asset, index) => (
                            <div key={asset.id} className="flex items-start gap-4 group bg-gray-50 p-2 rounded-2xl">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${index % 2 === 0 ? 'bg-gray-200 text-gray-600' : 'bg-white text-purple-600'
                                    }`}>
                                    <Box className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-600 transition-colors">{asset.product}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {asset.companyName}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-400 whitespace-nowrap">
                                    {asset.createdAt?.seconds ? new Date(asset.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                                </div>
                            </div>
                        ))}
                        {recentAssets.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>}
                    </div>
                    {/* <button className="w-full mt-6 py-2 text-sm text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                        View All Activity
                    </button> */}
                </div>
            </div>

            <WarrantyDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                bucket={selectedBucket}
                assets={warrantyAssets[selectedBucket] || []}
            />
        </div>
    );
}

function WarrantyDetailsModal({ isOpen, onClose, bucket, assets }) {
    if (!isOpen) return null;

    const navigate = useNavigate();

    const bucketStyles = {
        '30': { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200', icon: <Clock className="text-red-500" /> },
        '60': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', icon: <Calendar className="text-orange-500" /> },
        '90': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', icon: <Activity className="text-blue-500" /> }
    };

    const style = bucketStyles[bucket] || bucketStyles['30'];

    return (
        <div className="fixed mt-0 inset-0 z-[60]  flex h-full items-center justify-center p-4 pt-0 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
                {/* Header */}
                <div className={`p-6 ${style.bg} border-b ${style.border} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm">
                            {style.icon}
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${style.text}`}>Warranty Expirations: Next {bucket} Days</h2>
                            <p className="text-sm opacity-70">Showing {assets.length} assets</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {assets.length === 0 ? (
                        <div className="text-center py-12">
                            <Box className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500">No assets found for this period.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="pb-4 font-semibold text-gray-600 text-sm">URN</th>
                                        <th className="pb-4 font-semibold text-gray-600 text-sm">Product</th>
                                        <th className="pb-4 font-semibold text-gray-600 text-sm">Company</th>
                                        <th className="pb-4 font-semibold text-gray-600 text-sm">Branch</th>
                                        <th className="pb-4 font-semibold text-gray-600 text-sm">Expiry Date</th>
                                        <th className="pb-4 font-semibold text-gray-600 text-sm">Status</th>
                                        <th className="pb-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {assets.map((asset) => (
                                        <tr key={asset.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 text-sm font-medium text-gray-900">#{asset.urn}</td>
                                            <td className="py-4">
                                                <div className="text-sm font-semibold text-gray-900">{asset.product}</div>
                                                <div className="text-xs text-gray-400 capitalize">{asset.brandName} - {asset.model}</div>
                                            </td>
                                            <td className="py-4 text-sm text-gray-600">{asset.companyName}</td>
                                            <td className="py-4 text-sm text-gray-600">{asset.branch}</td>
                                            <td className="py-4 font-medium text-sm">
                                                <span className={`${new Date(asset.warrantyExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-red-600' : 'text-gray-900'
                                                    }`}>
                                                    {new Date(asset.warrantyExpiry).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${asset.status === 'Scrapped' ? 'bg-red-100 text-red-600' :
                                                    asset.status === 'In Repair' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-green-100 text-green-600'
                                                    }`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/assets/${asset.id}`)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                    title="View Asset Details"
                                                >
                                                    <Box size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
