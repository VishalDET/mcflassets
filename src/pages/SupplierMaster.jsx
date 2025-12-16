import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { Plus, Edit, Trash2, X, Eye } from "lucide-react";
import Loader from "../components/common/Loader";
import { toast } from "react-toastify";

export default function SupplierMaster() {
    const [suppliers, setSuppliers] = useState([]);
    const [localLoading, setLocalLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        companyName: "",
        contactNumber: "",
        email: "",
        address: "",
        gst: "",
    });

    // Fetch suppliers in real-time
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "suppliers"),
            (snapshot) => {
                const supplierData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort locally by name for better UX if firestore sort changes
                setSuppliers(supplierData.sort((a, b) => a.companyName.localeCompare(b.companyName)));
                setLocalLoading(false);
            },
            (error) => {
                console.error("Error fetching suppliers:", error);
                toast.error("Failed to fetch suppliers");
                setLocalLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingId(supplier.id);
            setFormData({
                companyName: supplier.companyName,
                contactNumber: supplier.contactNumber || "",
                email: supplier.email || "",
                address: supplier.address || "",
                gst: supplier.gst || "",
            });
        } else {
            setEditingId(null);
            setFormData({
                companyName: "",
                contactNumber: "",
                email: "",
                address: "",
                gst: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (supplier) => {
        setCurrentSupplier(supplier);
        setIsViewModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDoc(doc(db, "suppliers", editingId), {
                    ...formData,
                    updatedAt: serverTimestamp()
                });
                toast.success("Supplier updated successfully");
            } else {
                await addDoc(collection(db, "suppliers"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });
                toast.success("Supplier added successfully");
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving supplier:", error);
            toast.error("Failed to save supplier");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            try {
                await deleteDoc(doc(db, "suppliers", id));
                toast.success("Supplier deleted successfully");
            } catch (error) {
                console.error("Error deleting supplier:", error);
                toast.error("Failed to delete supplier");
            }
        }
    };

    if (localLoading) return <Loader />;

    return (
        <div className="p-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Supplier Master</h2>
                    <p className="text-gray-500 mt-1">Manage your supplier companies and contacts.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Total: {suppliers.length}
                    </span>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                    >
                        <Plus size={20} /> Add Supplier
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Company Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">GST No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {suppliers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No suppliers found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            suppliers.map((supplier) => (
                                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.companyName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.gst || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col">
                                            <span>{supplier.contactNumber || '-'}</span>
                                            <span className="text-xs text-blue-500">{supplier.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={supplier.address}>{supplier.address || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleOpenViewModal(supplier)}
                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(supplier)}
                                                className="text-blue-400 hover:text-blue-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-0 bg-gray-900 p-4 rounded-t-lg">
                            <h2 className="text-lg font-semibold text-white">
                                {editingId ? "Edit Supplier" : "Add Supplier"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition uppercase"
                                        value={formData.gst}
                                        onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                                        placeholder="e.g. 22AAAAA0000A1Z5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm"
                                >
                                    {editingId ? "Update Supplier" : "Add Supplier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewModalOpen && currentSupplier && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-fade-in-up">
                        <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">
                                {currentSupplier.companyName}
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">GST Number</label>
                                <p className="text-gray-900 font-medium bg-gray-50 p-2 rounded border border-gray-100">{currentSupplier.gst || "N/A"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contact Number</label>
                                    <p className="text-gray-900">{currentSupplier.contactNumber || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                    <p className="text-gray-900 break-all">{currentSupplier.email || "N/A"}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Address</label>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{currentSupplier.address || "N/A"}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => {
                                    handleOpenModal(currentSupplier);
                                    setIsViewModalOpen(false);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-auto"
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

