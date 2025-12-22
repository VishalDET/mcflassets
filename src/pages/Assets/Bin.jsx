import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trash2, Search, Filter, CheckSquare, Square } from "lucide-react";
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import { useDatabase } from "../../context/DatabaseContext";
import { formatDate } from "../../utils/dateUtils";
import { useAuth } from "../../context/AuthContext";

export default function Bin() {
    const { companies, products } = useDatabase();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAssetIds, setSelectedAssetIds] = useState([]);

    // Check if user is Admin
    useEffect(() => {
        if (currentUser && currentUser.role !== 'Admin') {
            toast.error("Access denied. Admin only.");
            navigate("/assets");
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const q = query(
            collection(db, "assets"),
            where("isDeleted", "==", true),
            orderBy("deletedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAssets(data);
            setLoading(false);
            setSelectedAssetIds([]);
        }, (error) => {
            console.error("Error fetching deleted assets:", error);
            toast.error("Failed to fetch deleted assets");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRestore = async (id) => {
        if (window.confirm("Restore this asset to inventory?")) {
            try {
                await updateDoc(doc(db, "assets", id), {
                    isDeleted: false,
                    deletedAt: null,
                    updatedAt: serverTimestamp()
                });
                toast.success("Asset restored successfully");
            } catch (error) {
                console.error("Error restoring asset:", error);
                toast.error("Failed to restore asset");
            }
        }
    };

    const handlePermanentDelete = async (id) => {
        if (window.confirm("PERMANENTLY DELETE this asset? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "assets", id));
                toast.success("Asset permanently deleted");
            } catch (error) {
                console.error("Error deleting asset:", error);
                toast.error("Failed to delete asset permanently");
            }
        }
    };

    const handleBulkRestore = async () => {
        if (selectedAssetIds.length === 0) return;

        if (window.confirm(`Restore ${selectedAssetIds.length} selected assets?`)) {
            setLoading(true);
            try {
                const batch = writeBatch(db);
                selectedAssetIds.forEach(id => {
                    batch.update(doc(db, "assets", id), {
                        isDeleted: false,
                        deletedAt: null,
                        updatedAt: serverTimestamp()
                    });
                });
                await batch.commit();
                toast.success(`${selectedAssetIds.length} assets restored`);
                setSelectedAssetIds([]);
            } catch (error) {
                console.error("Error bulk restoring:", error);
                toast.error("Failed to restore assets");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkPermanentDelete = async () => {
        if (selectedAssetIds.length === 0) return;

        if (window.confirm(`PERMANENTLY DELETE ${selectedAssetIds.length} selected assets? This action cannot be undone.`)) {
            setLoading(true);
            try {
                const batch = writeBatch(db);
                selectedAssetIds.forEach(id => {
                    batch.delete(doc(db, "assets", id));
                });
                await batch.commit();
                toast.success(`${selectedAssetIds.length} assets permanently deleted`);
                setSelectedAssetIds([]);
            } catch (error) {
                console.error("Error bulk deleting permanently:", error);
                toast.error("Failed to delete assets permanently");
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleSelection = (id) => {
        setSelectedAssetIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (filteredData) => {
        const allFilteredIds = filteredData.map(a => a.id);
        const areAllSelected = allFilteredIds.every(id => selectedAssetIds.includes(id));

        if (areAllSelected) {
            setSelectedAssetIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
        } else {
            setSelectedAssetIds(prev => {
                const newIds = [...prev];
                allFilteredIds.forEach(id => {
                    if (!newIds.includes(id)) newIds.push(id);
                });
                return newIds;
            });
        }
    };

    const filteredAssets = assets.filter(asset =>
        String(asset.urn || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(asset.product || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(asset.productSerialNumber || "")?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(asset.taggingNo || "")?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loader />;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-red-500 pb-1">Recycle Bin</h2>
                    <p className="text-gray-500 mt-1">Manage deleted assets. Restore or permanently delete them.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/assets")}
                        className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 border border-gray-300 transition shadow-sm"
                    >
                        <ArrowLeft size={20} /> Back to Assets
                    </button>
                    {selectedAssetIds.length > 0 && (
                        <>
                            <button
                                onClick={handleBulkRestore}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition shadow-sm"
                            >
                                <RotateCcw size={20} /> Restore ({selectedAssetIds.length})
                            </button>
                            <button
                                onClick={handleBulkPermanentDelete}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition shadow-sm"
                            >
                                <Trash2 size={20} /> Delete ({selectedAssetIds.length})
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by URN, Serial, or Tag..."
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        Showing {filteredAssets.length} deleted assets
                    </div>
                </div>

                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-700 uppercase p-4">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <button
                                        onClick={() => toggleSelectAll(filteredAssets)}
                                        className="text-gray-500 hover:text-red-500"
                                    >
                                        {filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.includes(a.id)) ?
                                            <CheckSquare size={20} className="text-red-500" /> :
                                            <Square size={20} />
                                        }
                                    </button>
                                </th>
                                <th className="px-6 py-4">URN</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Serial / Tag</th>
                                <th className="px-6 py-4">Company/Branch</th>
                                <th className="px-6 py-4">Deleted At</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredAssets.length > 0 ? (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className={`hover:bg-red-50 transition-colors ${selectedAssetIds.includes(asset.id) ? 'bg-red-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleSelection(asset.id)}
                                                className="text-gray-500"
                                            >
                                                {selectedAssetIds.includes(asset.id) ?
                                                    <CheckSquare size={20} className="text-red-500" /> :
                                                    <Square size={20} />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{asset.urn}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{asset.product}</div>
                                            <div className="text-gray-500 text-xs">{asset.brandName} - {asset.model}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">S: {asset.productSerialNumber}</div>
                                            <div className="text-gray-500">T: {asset.taggingNo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{asset.companyName}</div>
                                            <div className="text-gray-500 text-xs">{asset.branch}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {formatDate(asset.deletedAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(asset.id)}
                                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                    title="Restore"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(asset.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Delete Permanently"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500 italic">
                                        Recycle bin is empty.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
