import { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { Plus, Edit, Trash2, X, Building2 } from "lucide-react";
import Loader from "../components/common/Loader";
import { toast } from "react-toastify";

export default function SupplierMaster() {
    const [suppliers, setSuppliers] = useState([]);
    const [localLoading, setLocalLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        companyName: "",
        contactNumber: "",
        email: "",
        address: "",
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
                setSuppliers(supplierData);
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
            });
        } else {
            setEditingId(null);
            setFormData({
                companyName: "",
                contactNumber: "",
                email: "",
                address: "",
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
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                    >
                        <Plus size={20} /> Add Supplier
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Company Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Contact Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-300">
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contactNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{supplier.address || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal(supplier)}
                                            className="text-gray-600 hover:text-gray-900 mr-4"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(supplier.id)}
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
                                {editingId ? "Edit Supplier" : "Add Supplier"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-white hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="tel"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={formData.contactNumber}
                                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address"
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
