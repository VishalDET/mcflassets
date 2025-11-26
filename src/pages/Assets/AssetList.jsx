import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, MoreVertical } from "lucide-react";
import { getAssets } from "../../services/db";

export default function AssetList() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchAssets();
    }, []);

    async function fetchAssets() {
        try {
            const data = await getAssets();
            setAssets(data);
        } catch (error) {
            console.error("Failed to fetch assets", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredAssets = assets.filter(asset =>
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Assets</h1>
                <Link
                    to="/assets/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    <span>Add Asset</span>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex space-x-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-4 py-2 border rounded-lg flex items-center space-x-2 hover:bg-gray-50">
                        <Filter size={20} />
                        <span>Filter</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                            <tr>
                                <th className="p-4">Asset Name</th>
                                <th className="p-4">Serial Number</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Assigned To</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center">Loading...</td></tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No assets found</td></tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium">
                                            <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:underline">
                                                {asset.name}
                                            </Link>
                                        </td>
                                        <td className="p-4 text-gray-500">{asset.serialNumber}</td>
                                        <td className="p-4">{asset.type}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                                                asset.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">{asset.assignedTo || '-'}</td>
                                        <td className="p-4">
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreVertical size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
