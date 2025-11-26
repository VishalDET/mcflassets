import { useState, useEffect } from "react";
import { getAssets } from "../services/db";

export default function Dashboard() {
    const [stats, setStats] = useState({
        total: 0,
        assigned: 0,
        available: 0,
        inRepair: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const assets = await getAssets();
                const total = assets.length;
                const assigned = assets.filter(a => a.status === "Assigned").length;
                const available = assets.filter(a => a.status === "Available").length;
                const inRepair = assets.filter(a => a.status === "In Repair").length; // Assuming 'In Repair' is a status

                setStats({ total, assigned, available, inRepair });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium">Total Assets</h3>
                    <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium">Assigned</h3>
                    <p className="text-3xl font-bold mt-2 text-blue-600">{stats.assigned}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium">Available</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">{stats.available}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 text-sm font-medium">In Repair</h3>
                    <p className="text-3xl font-bold mt-2 text-orange-600">{stats.inRepair}</p>
                </div>
            </div>
        </div>
    );
}
