import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Eye, Edit, Trash2, Upload } from "lucide-react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, writeBatch, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { toast } from "react-toastify";
import ImportAssets from "./ImportAssets";
import Loader from "../../components/common/Loader";
import AssignmentDetailsModal from "../../components/Assets/AssignmentDetailsModal";
import { useDatabase } from "../../context/DatabaseContext";
import { formatDate } from "../../utils/dateUtils";
import { AlertTriangle, TrendingUp, Calendar, CheckCircle, XCircle, Clock, CheckSquare, Square, Trash, History } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AssetList() {
    const { companies, products } = useDatabase();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedAssetForAssignment, setSelectedAssetForAssignment] = useState(null);
    const [selectedAssetIds, setSelectedAssetIds] = useState([]);

    // Filters & Sorting State
    const [filters, setFilters] = useState({
        companyId: "",
        status: "",
        productId: ""
    });
    const [sortBy, setSortBy] = useState("newest"); // newest, oldest, assigned, warranty, warranty_near
    const [showFilters, setShowFilters] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const q = query(collection(db, "assets"), orderBy("createdAt", "desc")); // Default fetch order
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(asset => !asset.isDeleted); // Soft-delete filter
            setAssets(data);
            setSelectedAssetIds([]); // Clear selection on data change
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
                await updateDoc(doc(db, "assets", id), {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                toast.success("Asset deleted successfully");
                setSelectedAssetIds(prev => prev.filter(item => item !== id));
            } catch (error) {
                console.error("Error deleting asset:", error);
                toast.error("Failed to delete asset");
            }
        }
    };

    const handleBulkDelete = async () => {
        const activeIds = paginatedAssets
            .filter(a => selectedAssetIds.includes(a.id) && a.status === 'Active')
            .map(a => a.id);

        if (activeIds.length === 0) {
            toast.warning("No active assets selected for deletion.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${activeIds.length} selected active assets? Assigned assets will be skipped.`)) {
            setLoading(true);
            try {
                const batch = writeBatch(db);
                activeIds.forEach(id => {
                    batch.update(doc(db, "assets", id), {
                        isDeleted: true,
                        deletedAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                });
                await batch.commit();
                toast.success(`${activeIds.length} assets deleted successfully`);
                setSelectedAssetIds([]);
            } catch (error) {
                console.error("Error in bulk delete:", error);
                toast.error("Failed to delete assets");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkUnassign = async () => {
        const assignedIds = paginatedAssets
            .filter(a => selectedAssetIds.includes(a.id) && a.status === 'Assigned')
            .map(a => a.id);

        if (assignedIds.length === 0) {
            toast.warning("No assigned assets selected for unassignment.");
            return;
        }

        if (window.confirm(`Are you sure you want to unassign ${assignedIds.length} selected assets and return them to Stock?`)) {
            setLoading(true);
            try {
                const batch = writeBatch(db);
                assignedIds.forEach(id => {
                    batch.update(doc(db, "assets", id), {
                        status: 'Active',
                        assignedTo: 'Stock',
                        employeeId: 'N/A',
                        assignedDate: null,
                        updatedAt: serverTimestamp()
                    });
                });
                await batch.commit();
                toast.success(`${assignedIds.length} assets unassigned successfully`);
                setSelectedAssetIds([]);
            } catch (error) {
                console.error("Error in bulk unassign:", error);
                toast.error("Failed to unassign assets");
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleSelection = (id, status) => {
        const isAuthorizedForUnassign = currentUser?.email === 'vishal@digitaledgetech.in';

        if (status !== 'Active' && !(status === 'Assigned' && isAuthorizedForUnassign)) {
            toast.info(isAuthorizedForUnassign ?
                "Only 'Active' or 'Assigned' assets can be selected." :
                "Only 'Active' assets can be selected for deletion.");
            return;
        }
        setSelectedAssetIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const isAuthorizedForUnassign = currentUser?.email === 'vishal@digitaledgetech.in';

        const selectablePaginatedIds = paginatedAssets
            .filter(a => a.status === 'Active' || (a.status === 'Assigned' && isAuthorizedForUnassign))
            .map(a => a.id);

        const areAllSelectableSelected = selectablePaginatedIds.every(id => selectedAssetIds.includes(id));

        if (areAllSelectableSelected) {
            // Unselect selectable assets on current page
            setSelectedAssetIds(prev => prev.filter(id => !selectablePaginatedIds.includes(id)));
        } else {
            // Select all selectable assets on current page
            setSelectedAssetIds(prev => {
                const newIds = [...prev];
                selectablePaginatedIds.forEach(id => {
                    if (!newIds.includes(id)) newIds.push(id);
                });
                return newIds;
            });
        }
    };

    // Derived Data: Assets nearing warranty (within 30 days)
    const warrantyNearAssets = assets.filter(asset => {
        if (!asset.warrantyExpiry || asset.status === 'Scrapped' || asset.status === 'Inactive') return false;
        const expiryDate = new Date(asset.warrantyExpiry);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    });

    const filteredAssets = assets.filter(asset => {
        // Search Term
        const matchesSearch = !searchTerm || (
            String(asset.product || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(asset.taggingNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(asset.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(asset.productSerialNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(asset.urn || "").toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Filters
        const matchesCompany = !filters.companyId || asset.companyId === filters.companyId;
        const matchesStatus = !filters.status || asset.status === filters.status;
        const matchesProduct = !filters.productId || (assets.find(a => a.id === asset.id)?.product === products.find(p => p.id === filters.productId)?.name); // Matching by name as asset stores product name, verify if ID is better if stored

        // Note: Asset currently stores `product` (name) and `productCode`. It might not store `productId`. 
        // Checking schema: AddAsset stores `product` name. Let's filter by matching name if productId not available, or use product name in filter if safer.
        // Actually AddAsset stores `product` (name) and `productCode`. It does NOT explicitly store `productId`.
        // So we should filter by comparing product name.
        const selectedProduct = products.find(p => p.id === filters.productId);
        const matchesProductLogic = !filters.productId || (selectedProduct && asset.product === selectedProduct.name);

        return matchesSearch && matchesCompany && matchesStatus && matchesProductLogic;
    }).sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
            case "oldest":
                return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
            case "status":
                return a.status.localeCompare(b.status);
            case "warranty_near":
                // Sort by warranty expiry (asc), nulls last
                if (!a.warrantyExpiry) return 1;
                if (!b.warrantyExpiry) return -1;
                return new Date(a.warrantyExpiry) - new Date(b.warrantyExpiry);
            default:
                return 0;
        }
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filters, sortBy]);

    if (loading) return <Loader />;

    return (
        <div className="p-0">
            {/* Warranty Alert Banner */}
            {warrantyNearAssets.length > 0 && (
                <div className="mb-6 bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-start justify-between shadow-sm animate-fade-in">
                    <div className="flex gap-3">
                        <AlertTriangle className="text-orange-500 mt-0.5" size={24} />
                        <div>
                            <h3 className="font-bold text-orange-900">Warranty Expiry Alert</h3>
                            <p className="text-orange-700 text-sm mt-1">
                                <span className="font-bold">{warrantyNearAssets.length}</span> asset(s) are nearing their warranty expiry within 30 days.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSortBy("warranty_near")}
                        className="text-orange-700 font-medium text-sm hover:underline px-3 py-1 bg-orange-100 rounded-md hover:bg-orange-200 transition"
                    >
                        View Assets
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Assets Inventory</h2>
                    <p className="text-gray-500 mt-1">Manage and track all your organization's assets.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Total: {filteredAssets.length}
                    </span>
                    {selectedAssetIds.length > 0 && (
                        <div className="flex gap-2">
                            {paginatedAssets.some(a => selectedAssetIds.includes(a.id) && a.status === 'Active') && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-100 border border-red-200 transition shadow-sm font-medium"
                                >
                                    <Trash2 size={20} /> Delete ({selectedAssetIds.filter(id => paginatedAssets.find(a => a.id === id)?.status === 'Active').length})
                                </button>
                            )}
                            {currentUser?.email === 'vishal@digitaledgetech.in' && paginatedAssets.some(a => selectedAssetIds.includes(a.id) && a.status === 'Assigned') && (
                                <button
                                    onClick={handleBulkUnassign}
                                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-100 border border-blue-200 transition shadow-sm font-medium"
                                >
                                    <History size={20} /> Unassign ({selectedAssetIds.filter(id => paginatedAssets.find(a => a.id === id)?.status === 'Assigned').length})
                                </button>
                            )}
                        </div>
                    )}
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
                    {currentUser?.role === 'Admin' && (
                        <Link
                            to="/assets/bin"
                            className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-800 transition shadow-sm font-medium"
                            title="Recycle Bin"
                        >
                            <History size={20} /> Recycle Bin
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters & Search - Improved UI */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Product, Tag, Serial or Company..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                    >
                        <Filter size={20} /> {showFilters ? 'Hide Filters' : 'Filters'}
                    </button>
                </div>

                {/* Collapsible Advanced Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 animate-slide-down">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.companyId}
                                onChange={(e) => setFilters(prev => ({ ...prev, companyId: e.target.value }))}
                            >
                                <option value="">All Companies</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Assigned">Assigned</option>
                                <option value="In Repair">In Repair</option>
                                <option value="Scrapped">Scrapped</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Product</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.productId}
                                onChange={(e) => setFilters(prev => ({ ...prev, productId: e.target.value }))}
                            >
                                <option value="">All Products</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sort By</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newly Added</option>
                                <option value="oldest">Oldest First</option>
                                <option value="status">Status</option>
                                <option value="warranty_near">Warranty Expiring Soon</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={paginatedAssets.length > 0 && paginatedAssets.filter(a => a.status === 'Active').every(a => selectedAssetIds.includes(a.id))}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Tagging No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">AssignID</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedAssets.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                        No assets found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAssets.map((asset) => (
                                    <tr key={asset.id} className={`${selectedAssetIds.includes(asset.id) ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer 
                                                    ${(asset.status !== 'Active' && !(asset.status === 'Assigned' && currentUser?.email === 'vishal@digitaledgetech.in')) ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                checked={selectedAssetIds.includes(asset.id)}
                                                onChange={() => toggleSelection(asset.id, asset.status)}
                                                disabled={asset.status !== 'Active' && !(asset.status === 'Assigned' && currentUser?.email === 'vishal@digitaledgetech.in')}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{asset.taggingNo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{asset.product}</div>
                                            <div className="text-xs text-gray-500">{asset.productSerialNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.companyName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {asset.status === 'Active' ? (
                                                <button
                                                    onClick={() => navigate("/transfers", { state: { preselectedAssetId: asset.id } })}
                                                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors"
                                                    title="Click to Transfer Asset"
                                                >
                                                    {asset.status}
                                                </button>
                                            ) : asset.status === 'Assigned' ? (
                                                <button
                                                    onClick={() => setSelectedAssetForAssignment(asset)}
                                                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors"
                                                    title="Click to View Assignment Details"
                                                >
                                                    {asset.status}
                                                </button>
                                            ) : (
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${asset.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                    {asset.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {asset.status === 'Assigned' ? asset.employeeId : '-'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <Link to={`/assets/${asset.id}`} className="text-gray-400 hover:text-gray-800">
                                                    <Eye size={18} />
                                                </Link>
                                                <Link to={`/assets/${asset.id}/edit`} className="text-gray-400 hover:text-gray-600">
                                                    <Edit size={18} />
                                                </Link>
                                                {asset.status === 'Active' && (
                                                    <button onClick={() => handleDelete(asset.id)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredAssets.length > 0 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAssets.length)}</span> of <span className="font-medium">{filteredAssets.length}</span> results
                                </p>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="ml-2 pl-3 pr-8 py-1 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md bg-gray-50"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={25}>25 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={100}>100 per page</option>
                                </select>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Page Numbers - Simplified for now to showing current page context */}
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isImportModalOpen && (
                <ImportAssets
                    onClose={() => setIsImportModalOpen(false)}
                    onImportSuccess={() => {
                        // Refresh logic handled by snapshot listener automatically
                    }}
                />
            )}

            {selectedAssetForAssignment && (
                <AssignmentDetailsModal
                    asset={selectedAssetForAssignment}
                    onClose={() => setSelectedAssetForAssignment(null)}
                />
            )}
        </div>
    );
}
