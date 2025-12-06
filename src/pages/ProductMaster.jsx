import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { Plus, Edit, Trash2, X, Package } from "lucide-react";
import Loader from "../components/common/Loader";

export default function ProductMaster() {
    const { products, addProduct, updateProduct, deleteProduct } = useDatabase();
    const [localLoading, setLocalLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
    });
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        // Simulate a quick check or wait for data
        const timer = setTimeout(() => setLocalLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingId(product.id);
            setFormData({
                name: product.name,
                code: product.code || "",
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
        try {
            if (editingId) {
                await updateProduct(editingId, formData);
            } else {
                await addProduct(formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving product:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await deleteProduct(id);
        }
    };

    // const handleBulkImport = async () => {
    //     const initialProducts = [
    //         { name: "CPU", code: "DT" },
    //         { name: "Desktop/Monitor", code: "TFT" },
    //         { name: "Mouse", code: "103" },
    //         { name: "Keyboard", code: "104" },
    //         { name: "Laptop", code: "LP" },
    //         { name: "Adaptor", code: "ADP" },
    //         { name: "Printer", code: "PRI" },
    //         { name: "Scanner", code: "SCAN" },
    //         { name: "Mobile", code: "MOB" },
    //         { name: "CCTV Camera", code: "CAM" },
    //         { name: "CCTV", code: "NVR" },
    //         { name: "Biomax", code: "BIO" },
    //         { name: "Firewall", code: "FW" },
    //         { name: "Server", code: "SVR" },
    //         { name: "All In One", code: "115" },
    //         { name: "Switch", code: "SWI" },
    //         { name: "Router", code: "ROU" },
    //         { name: "Webcam", code: "WEB" },
    //         { name: "NAS Box", code: "NAS" },
    //         { name: "Mobile Charger", code: "MCHG" },
    //         { name: "TAB", code: "TAB" },
    //         { name: "External HDD", code: "EHDD" },
    //         { name: "Headset", code: "123" },
    //         { name: "Weighing Machine", code: "124" },
    //         { name: "Note Counting Machine", code: "125" },
    //         { name: "Landline Phone", code: "TEL" },
    //         { name: "Access Point", code: "AP" },
    //         { name: "Guardwell Vault", code: "128" },
    //         { name: "UPS", code: "UPS" },
    //         { name: "UPS Battery", code: "UPSB" },
    //         { name: "HDD", code: "131" },
    //         { name: "SSD", code: "132" },
    //         { name: "Alarm System", code: "AS" },
    //         { name: "IPAD", code: "IPAD" },
    //         { name: "IPAD Charger", code: "IPADC" }
    //     ];

    //     if (!window.confirm(`This will add ${initialProducts.length} products to the database. Continue?`)) {
    //         return;
    //     }

    //     setImporting(true);
    //     let successCount = 0;
    //     let errorCount = 0;

    //     for (const product of initialProducts) {
    //         try {
    //             await addProduct(product);
    //             successCount++;
    //         } catch (error) {
    //             console.error(`Failed to add ${product.name}:`, error);
    //             errorCount++;
    //         }
    //     }

    //     setImporting(false);
    //     alert(`Import complete! Added: ${successCount}, Failed: ${errorCount}`);
    // };

    if (localLoading) return <Loader />;

    return (
        <div className="p-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Product Master</h2>
                    <p className="text-gray-500 mt-1">Manage your product catalog.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    {/* <button
                        onClick={handleBulkImport}
                        disabled={importing}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                    >
                        <Package size={20} /> {importing ? "Importing..." : "Bulk Import Initial Data"}
                    </button> */}
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                    >
                        <Plus size={20} /> Add Product
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Product Code</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Count</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>

                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-300">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                    No products found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{product.count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenModal(product)}
                                            className="text-gray-600 hover:text-gray-900 mr-4"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
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
                                {editingId ? "Edit Product" : "Add Product"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-white hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono uppercase"
                                    value={formData.code}
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
