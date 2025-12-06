import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addTransfer, getAssets, updateAsset } from "../../services/db";
import { useAuth } from "../../context/AuthContext";
import { useDatabase } from "../../context/DatabaseContext";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

export default function TransferAsset() {
    const [assets, setAssets] = useState([]);
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);

    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { companies, products, getBranches } = useDatabase();

    const [formData, setFormData] = useState({
        productId: "",
        assetId: "",
        fromCompany: "",
        fromBranch: "",
        fromLocation: "",
        currentAssignedTo: "",
        toCompanyId: "",
        toCompany: "",
        toCompanyCode: "",
        toBranch: "",
        toBranchCode: "",
        toLocation: "",
        toLocationCode: "",
        assignedTo: "",
        employeeId: "",
        assignedDate: new Date().toISOString().split('T')[0],
        reason: ""
    });

    // Load all assets
    useEffect(() => {
        async function loadAssets() {
            setLoading(true);
            try {
                const data = await getAssets();
                setAssets(data);
            } catch (error) {
                console.error("Failed to load assets", error);
                toast.error("Failed to load assets");
            } finally {
                setLoading(false);
            }
        }
        loadAssets();
    }, []);

    // Handle Product Selection
    const handleProductChange = (e) => {
        const productId = e.target.value;
        const product = products.find(p => p.id === productId);

        if (product) {
            setSelectedProduct(product);
            setFormData(prev => ({ ...prev, productId: product.id }));

            // Filter assets by product name
            const filtered = assets.filter(asset => asset.product === product.name);
            setFilteredAssets(filtered);
        } else {
            setSelectedProduct(null);
            setFilteredAssets([]);
            setFormData(prev => ({ ...prev, productId: "", assetId: "" }));
        }

        // Reset asset selection
        setSelectedAsset(null);
    };

    // Handle Device/Asset Selection
    const handleAssetChange = (e) => {
        const assetId = e.target.value;
        const asset = assets.find(a => a.id === assetId);

        if (asset) {
            setSelectedAsset(asset);
            setFormData(prev => ({
                ...prev,
                assetId: asset.id,
                fromCompany: asset.companyName || "",
                fromBranch: asset.branch || "",
                fromLocation: asset.location || "",
                currentAssignedTo: asset.assignedTo || "Unassigned"
            }));
        } else {
            setSelectedAsset(null);
            setFormData(prev => ({
                ...prev,
                assetId: "",
                fromCompany: "",
                fromBranch: "",
                fromLocation: "",
                currentAssignedTo: ""
            }));
        }
    };

    // Handle Company Selection
    const handleCompanyChange = async (e) => {
        const companyId = e.target.value;
        const company = companies.find(c => c.id === companyId);

        if (company) {
            setSelectedCompany(company);
            setFormData(prev => ({
                ...prev,
                toCompanyId: company.id,
                toCompany: company.name,
                toCompanyCode: company.companyCode || "",
                toBranch: "",
                toBranchCode: "",
                toLocation: "",
                toLocationCode: ""
            }));

            // Fetch branches for selected company
            try {
                const fetchedBranches = await getBranches(companyId);
                setBranches(fetchedBranches);
            } catch (error) {
                console.error("Error fetching branches:", error);
                setBranches([]);
            }
        } else {
            setSelectedCompany(null);
            setBranches([]);
            setFormData(prev => ({
                ...prev,
                toCompanyId: "",
                toCompany: "",
                toCompanyCode: "",
                toBranch: "",
                toBranchCode: "",
                toLocation: "",
                toLocationCode: ""
            }));
        }
    };

    // Handle Branch Selection
    const handleBranchChange = (e) => {
        const branchId = e.target.value;
        const branch = branches.find(b => b.id === branchId);

        if (branch) {
            setSelectedBranch(branch);
            setFormData(prev => ({
                ...prev,
                toBranch: branch.name,
                toBranchCode: branch.branchCode || "",
                toLocation: branch.location || "",
                toLocationCode: branch.locationCode || ""
            }));
        } else {
            setSelectedBranch(null);
            setFormData(prev => ({
                ...prev,
                toBranch: "",
                toBranchCode: "",
                toLocation: "",
                toLocationCode: ""
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.assetId) {
            toast.error("Please select a device");
            return;
        }

        if (!formData.toCompanyId || !formData.toBranch) {
            toast.error("Please select destination company and branch");
            return;
        }

        try {
            setLoading(true);

            // 1. Create Transfer Record
            await addTransfer({
                assetId: formData.assetId,
                fromCompany: formData.fromCompany,
                fromBranch: formData.fromBranch,
                fromLocation: formData.fromLocation,
                toCompany: formData.toCompany,
                toBranch: formData.toBranch,
                toLocation: formData.toLocation,
                assignedBy: currentUser.email,
                assignedTo: formData.assignedTo,
                employeeId: formData.employeeId,
                assignedDate: formData.assignedDate,
                reason: formData.reason,
                transferDate: new Date()
            });

            // 2. Update Asset Status and Location
            await updateAsset(formData.assetId, {
                companyId: formData.toCompanyId,
                companyName: formData.toCompany,
                companyCode: formData.toCompanyCode,
                branch: formData.toBranch,
                branchCode: formData.toBranchCode,
                location: formData.toLocation,
                locationCode: formData.toLocationCode,
                assignedTo: formData.assignedTo,
                employeeId: formData.employeeId,
                assignedDate: formData.assignedDate,
                status: "Assigned"
            });

            toast.success("Asset transferred successfully");
            navigate("/assets");
        } catch (error) {
            console.error("Error transferring asset:", error);
            toast.error("Failed to transfer asset");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-4 py-1 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transfer Asset</h2>
                    <p className="text-gray-500 mt-1">Move assets between companies or locations.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product and Device Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                value={formData.productId}
                                onChange={handleProductChange}
                            >
                                <option value="">Select Product Category</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} ({product.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Device</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                value={formData.assetId}
                                onChange={handleAssetChange}
                                disabled={!selectedProduct}
                            >
                                <option value="">Select Device</option>
                                {filteredAssets.map(asset => (
                                    <option key={asset.id} value={asset.id}>
                                        {asset.taggingNo} - S/N: {asset.productSerialNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Current Location Info */}
                    {selectedAsset && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">From Company</label>
                                <p className="font-medium text-gray-900">{formData.fromCompany || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">From Branch</label>
                                <p className="font-medium text-gray-900">{formData.fromBranch || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase">From Location</label>
                                <p className="font-medium text-gray-900">{formData.fromLocation || '-'}</p>
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 uppercase">Currently Assigned To</label>
                                <p className="font-medium text-gray-900">{formData.currentAssignedTo}</p>
                            </div>
                        </div>
                    )}

                    <hr className="border-gray-200" />

                    {/* Destination Company & Branch */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Company</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                value={formData.toCompanyId}
                                onChange={handleCompanyChange}
                            >
                                <option value="">Select Company</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} ({company.companyCode})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Branch</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                value={selectedBranch?.id || ""}
                                onChange={handleBranchChange}
                                disabled={!selectedCompany}
                            >
                                <option value="">Select Branch</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name} ({branch.branchCode}) - {branch.location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                            <input
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
                                value={formData.toLocation}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location Code</label>
                            <input
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 font-mono"
                                value={formData.toLocationCode}
                            />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Assignment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Person)</label>
                            <input
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                placeholder="Employee Name"
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <input
                                required
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                placeholder="EMP-001"
                                value={formData.employeeId}
                                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Date</label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                            value={formData.assignedDate}
                            onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Transfer</label>
                        <textarea
                            required
                            rows="3"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                            placeholder="e.g. New joining, Replacement, etc."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate("/assets")}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 shadow-sm"
                        >
                            {loading ? "Processing..." : "Transfer Asset"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
