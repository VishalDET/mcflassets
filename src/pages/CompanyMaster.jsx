import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { Plus, Edit, Trash2, X, Building2 } from "lucide-react";
import Loader from "../components/common/Loader";

export default function CompanyMaster() {
    const { companies, addCompany, updateCompany, deleteCompany, getBranches } = useDatabase();
    const [localLoading, setLocalLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        companyCode: "",
    });
    const [companyCounts, setCompanyCounts] = useState({});

    useEffect(() => {
        // Simulate a quick check or wait for data
        const timer = setTimeout(() => setLocalLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Fetch branch and asset counts for each company
        const fetchCounts = async () => {
            const counts = {};
            for (const company of companies) {
                try {
                    const branches = await getBranches(company.id);
                    counts[company.id] = {
                        branches: branches.length,
                        assets: 0 // Will be updated when we integrate with assets
                    };
                } catch (error) {
                    console.error(`Error fetching data for ${company.name}:`, error);
                    counts[company.id] = { branches: 0, assets: 0 };
                }
            }
            setCompanyCounts(counts);
        };

        if (companies.length > 0) {
            fetchCounts();
        }
    }, [companies, getBranches]);

    const handleOpenModal = (company = null) => {
        if (company) {
            setEditingId(company.id);
            setFormData({
                name: company.name,
                companyCode: company.companyCode || "",
            });
        } else {
            setEditingId(null);
            setFormData({
                name: "",
                companyCode: "",
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
                await updateCompany(editingId, formData);
            } else {
                await addCompany(formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving company:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this company?")) {
            await deleteCompany(id);
        }
    };

    if (localLoading) return <Loader />;

    return (
        <div className="p-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Company Master</h2>
                    <p className="text-gray-500 mt-1">Manage your companies, branches, and locations.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                    >
                        <Plus size={20} /> Add Company
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Company Code</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-100 uppercase tracking-wider">No. of Branches</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-100 uppercase tracking-wider">Total Assets</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-300">
                        {companies.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No companies found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            companies.map((company) => (
                                <tr
                                    key={company.id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => window.location.href = `/companies/${company.id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{company.companyCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                            {companyCounts[company.id]?.branches ?? 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                                            {companyCounts[company.id]?.assets ?? 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenModal(company);
                                            }}
                                            className="text-gray-600 hover:text-gray-900 mr-4"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(company.id);
                                            }}
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
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4 bg-gray-900 p-4 py-3 rounded-t-lg">
                            <h2 className="text-lg font-normal text-gray-200">
                                {editingId ? "Edit Company" : "Add Company"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-white hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono uppercase"
                                        value={formData.companyCode}
                                        onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
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
        </div >
    );
}
