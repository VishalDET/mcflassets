import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDatabase } from "../context/DatabaseContext";
import { Plus, Edit, Trash2, ArrowLeft, X, Building } from "lucide-react";
import Loader from "../components/common/Loader";
import { getAssets } from "../services/db";

export default function CompanyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { companies, getBranches, addBranch, updateBranch, deleteBranch } = useDatabase();

    // Local state
    const [company, setCompany] = useState(null);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "", // Branch Name
        branchCode: "",
        location: "",
        locationCode: ""
    });

    const [branchAssets, setBranchAssets] = useState({});
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchAssetsList, setBranchAssetsList] = useState([]);

    // Load company and branches
    useEffect(() => {
        const loadData = async () => {
            if (!companies.length) return; // Wait for companies to load from context if needed

            const foundCompany = companies.find(c => c.id === id);
            if (!foundCompany) {
                // If not found in loaded companies, might handle redirect or error
                // For now, assuming companies are loaded
                setLoading(false);
                return;
            }
            setCompany(foundCompany);

            // Fetch branches
            const fetchedBranches = await getBranches(id);
            setBranches(fetchedBranches);
            setLoading(false);
        };

        loadData();
    }, [id, companies, getBranches]); // Dependencies updated

    // Fetch asset counts for each branch
    useEffect(() => {
        const fetchAssetCounts = async () => {
            try {
                const assets = await getAssets();
                const counts = {};

                branches.forEach(branch => {
                    // Count assets that belong to this company and branch
                    const branchAssetCount = assets.filter(asset =>
                        asset.companyId === id && asset.branch === branch.name
                    ).length;
                    counts[branch.id] = branchAssetCount;
                });

                setBranchAssets(counts);
            } catch (error) {
                console.error('Error fetching asset counts:', error);
            }
        };

        if (branches.length > 0) {
            fetchAssetCounts();
        }
    }, [branches, id]);

    const refreshBranches = async () => {
        const fetchedBranches = await getBranches(id);
        setBranches(fetchedBranches);
    };

    const handleOpenModal = (branch = null) => {
        if (branch) {
            setEditingId(branch.id);
            setFormData({
                name: branch.name,
                branchCode: branch.branchCode || "",
                location: branch.location || "",
                locationCode: branch.locationCode || ""
            });
        } else {
            setEditingId(null);
            setFormData({
                name: "",
                branchCode: "",
                location: "",
                locationCode: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateBranch(id, editingId, formData);
            } else {
                await addBranch(id, formData);
            }
            await refreshBranches();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving branch:", error);
        }
    };

    const handleDelete = async (branchId) => {
        if (window.confirm("Are you sure you want to delete this branch?")) {
            await deleteBranch(id, branchId);
            await refreshBranches();
        }
    };

    const handleBranchClick = async (branch) => {
        try {
            const assets = await getAssets();
            const filteredAssets = assets.filter(asset =>
                asset.companyId === id && asset.branch === branch.name
            );
            setSelectedBranch(branch);
            setBranchAssetsList(filteredAssets);
        } catch (error) {
            console.error('Error fetching branch assets:', error);
        }
    };

    const handleCloseBranchAssets = () => {
        setSelectedBranch(null);
        setBranchAssetsList([]);
    };



    if (loading) return <Loader />;
    if (!company) return <div className="p-8 text-center">Company not found.</div>;

    return (
        <div className="p-0">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/companies')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building size={24} className="text-gray-500" />
                        {company.name}
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-2 border border-gray-200">
                            {company.companyCode}
                        </span>
                    </h2>
                    <p className="text-gray-500 text-sm">Manage branches for this company</p>
                </div>
                <div className="ml-auto">
                    <div className="flex gap-2">

                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                        >
                            <Plus size={20} /> Add Branch
                        </button>
                    </div>
                </div>
            </div>

            {/* Branches List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Branch Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Branch Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Location Code</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-100 uppercase tracking-wider">No. of Assets</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-300">
                        {branches.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                    No branches found. Add a branch to this company.
                                </td>
                            </tr>
                        ) : (
                            branches.map((branch) => (
                                <tr
                                    key={branch.id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => handleBranchClick(branch)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{branch.branchCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{branch.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{branch.locationCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                                            {branchAssets[branch.id] ?? 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleOpenModal(branch)}
                                            className="text-gray-600 hover:text-gray-900 mr-4"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(branch.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4 bg-gray-900 p-4 py-3 rounded-t-lg">
                            <h2 className="text-lg font-normal text-gray-200">
                                {editingId ? "Edit Branch" : "Add Branch"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-white hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono uppercase"
                                    value={formData.branchCode}
                                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Code (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono uppercase"
                                        value={formData.locationCode}
                                        onChange={(e) => setFormData({ ...formData, locationCode: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                                >
                                    {editingId ? "Update" : "Add"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Branch Assets Modal */}
            {selectedBranch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center mb-4 bg-gray-900 p-4 py-3 rounded-t-lg">
                            <h2 className="text-lg font-normal text-gray-200">
                                Assets in {selectedBranch.name} ({selectedBranch.branchCode})
                            </h2>
                            <button onClick={handleCloseBranchAssets} className="text-white hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {branchAssetsList.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No assets found in this branch.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">URN</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Tagging No</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Product</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Serial No</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Assigned To</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {branchAssetsList.map((asset) => (
                                                <tr key={asset.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{asset.urn || '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{asset.taggingNo || '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{asset.product || '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{asset.productSerialNumber || '-'}</td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${asset.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                            asset.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                                                                asset.status === 'In Repair' ? 'bg-yellow-100 text-yellow-800' :
                                                                    asset.status === 'Scrapped' ? 'bg-red-100 text-red-800' :
                                                                        asset.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {asset.status || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{asset.assignedTo || 'Unassigned'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
