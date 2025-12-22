import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { Plus, Edit, Trash2, X } from "lucide-react";
import Loader from "../components/common/Loader";

export default function BrandMaster() {
    const { brands, addBrand, updateBrand, deleteBrand } = useDatabase();
    const [localLoading, setLocalLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
    });

    useEffect(() => {
        const timer = setTimeout(() => setLocalLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleOpenModal = (brand = null) => {
        if (brand) {
            setEditingId(brand.id);
            setFormData({
                name: brand.name,
                code: brand.code || "",
            });
        } else {
            setEditingId(null);
            setFormData({
                name: "",
                code: "",
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

        // Check for duplicates
        const isDuplicateName = brands.some(b =>
            b.name.toLowerCase() === formData.name.toLowerCase() &&
            b.id !== editingId
        );
        const isDuplicateCode = formData.code && brands.some(b =>
            b.code?.toLowerCase() === formData.code.toLowerCase() &&
            b.id !== editingId
        );

        if (isDuplicateName) {
            toast.error(`Brand name "${formData.name}" already exists.`);
            return;
        }
        if (isDuplicateCode) {
            toast.error(`Brand code "${formData.code}" already exists.`);
            return;
        }

        try {
            if (editingId) {
                await updateBrand(editingId, formData);
            } else {
                await addBrand(formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving brand:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this brand?")) {
            await deleteBrand(id);
        }
    };

    if (localLoading) return <Loader />;

    return (
        <div className="p-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Brand Master</h2>
                    <p className="text-gray-500 mt-1">Manage your asset brands.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                    >
                        <Plus size={20} /> Add Brand
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Brand Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-300">
                        {brands.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                    No brands found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            brands.map((brand) => (
                                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{brand.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{brand.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal(brand)}
                                            className="text-gray-600 hover:text-gray-900 mr-4"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(brand.id)}
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
                                {editingId ? "Edit Brand" : "Add Brand"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-white hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Code</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono uppercase"
                                    value={formData.code}
                                    placeholder="Optional"
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
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
        </div>
    );
}
