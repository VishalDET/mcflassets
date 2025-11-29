import { useState, useEffect } from "react";
import { getAssets } from "../services/db";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from "recharts";
import { Building, Clock, Activity, Box, CheckCircle, AlertTriangle, Wrench } from "lucide-react";
import Loader from "../components/common/Loader";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
    const [stats, setStats] = useState({
        total: 0,
        assigned: 0,
        available: 0,
        inRepair: 0
    });
    const [chartsData, setChartsData] = useState({
        statusData: [],
        companyData: [],
        growthData: [],
        quarterlyData: []
    });
    const [recentAssets, setRecentAssets] = useState([]);
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

                setStats({ total, assigned, available, inRepair });

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

                setChartsData({ statusData, companyData, growthData, quarterlyData });

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
    }, []);

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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-2xl shadow-lg text-white transform hover:scale-105 transition-transform duration-300 animate-slide-up">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-100 font-medium mb-1">Total Assets</p>
                            <h3 className="text-4xl font-bold">{stats.total}</h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Box className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-100 flex items-center gap-1">
                        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">+12%</span> from last month
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-100 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium mb-1">Assigned</p>
                            <h3 className="text-4xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">{stats.assigned}</h3>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-gray-100 transition-colors">
                            <CheckCircle className="w-6 h-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#1F2937] via-[#6B7280] to-[#6B7280] h-1.5 rounded-full" style={{ width: `${(stats.assigned / stats.total) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-200 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium mb-1">Available</p>
                            <h3 className="text-4xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">{stats.available}</h3>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg group-hover:bg-green-100 transition-colors">
                            <Activity className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(stats.available / stats.total) * 100}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-slide-up delay-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 font-medium mb-1">In Repair</p>
                            <h3 className="text-4xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{stats.inRepair}</h3>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-lg group-hover:bg-orange-100 transition-colors">
                            <Wrench className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(stats.inRepair / stats.total) * 100}%` }}></div>
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
                                <Bar dataKey="count" fill="#1F2937" radius={[0, 6, 6, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>


            </div>

            <div className="grid grid-cols-1gap-6">
                {/* Quarterly Assets Breakdown */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-slide-up delay-200 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" /> Quarterly Assets Breakdown ({new Date().getFullYear()})
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData.quarterlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="quarter" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="assigned" stackId="a" fill="#6B7280" name="Assigned" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="available" stackId="a" fill="#10B981" name="Available" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="inRepair" stackId="a" fill="#F59E0B" name="In Repair" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="scrapped" stackId="a" fill="#df6f6fff" name="Scrapped" radius={[4, 4, 0, 0]} />
                            </BarChart>
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
        </div>
    );
}
