import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Eye, Edit, Trash2, Upload } from "lucide-react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { toast } from "react-toastify";
import ImportAssets from "./ImportAssets";
import Loader from "../../components/common/Loader";

export default function AssetList() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "assets"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAssets(data);
            // Add a small delay to prevent flicker and ensure loader is seen if it was too fast
            setTimeout(() => setLoading(false), 500);
        }, (error) => {
            console.error("Error fetching assets:", error);
            toast.error("Failed to fetch assets");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this asset?")) {
            try {
                await deleteDoc(doc(db, "assets", id));
                toast.success("Asset deleted successfully");
            } catch (error) {
                console.error("Error deleting asset:", error);
                toast.error("Failed to delete asset");
            }
        }
    };

    const filteredAssets = assets.filter(asset => {
        if (!searchTerm) return true;
        return (
            (asset.product && asset.product.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (asset.taggingNo && asset.taggingNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (asset.companyName && asset.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    if (loading) return <Loader />;

    return (
        <div className="p-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Assets Inventory</h2>
                    <p className="text-gray-500 mt-1">Manage and track all your organization's assets.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 border border-gray-300 transition shadow-sm"
                    >
                        <Upload size={20} /> Import
                    </button>
                    <Link
                        to="/assets/new"
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                    >
                        <Plus size={20} /> Add Asset
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4 border border-gray-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Product, Tag No, or Company..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Filter size={20} /> Filter
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Tagging No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAssets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No assets found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{asset.taggingNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{asset.product}</div>
                                            <div className="text-xs text-gray-500">{asset.productSerialNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.companyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${asset.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                    asset.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <Link to={`/assets/${asset.id}`} className="text-gray-400 hover:text-gray-800">
                                                    <Eye size={18} />
                                                </Link>
                                                <Link to={`/assets/${asset.id}/edit`} className="text-gray-400 hover:text-gray-600">
                                                    <Edit size={18} />
                                                </Link>
                                                <button onClick={() => handleDelete(asset.id)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isImportModalOpen && (
                <ImportAssets
                    onClose={() => setIsImportModalOpen(false)}
                    onImportSuccess={() => {
                        // Refresh logic handled by snapshot listener automatically
                    }}
                />
            )}
        </div>
    );
}
