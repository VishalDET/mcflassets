import { useState, useEffect } from "react";
import { useDatabase } from "../../context/DatabaseContext";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { getAssetById, updateAsset } from "../../services/db";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

export default function EditAsset() {
    const { id } = useParams();
    const { companies } = useDatabase();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        urn: "",
        dateOfAcquisition: "",
        yearOfAcquisition: "",
        companyId: "",
        companyName: "",
        branch: "",
        location: "",
        locationCode: "",
        product: "",
        productCode: "",
        productSerialNumber: "",
        config: "",
        taggingNo: "",
        purchasedFrom: "",
        warrantyExpiry: "",
        status: "Active"
    });

    useEffect(() => {
        async function fetchAsset() {
            try {
                const asset = await getAssetById(id);
                if (asset) {
                    setFormData({
                        urn: asset.urn || "",
                        dateOfAcquisition: asset.dateOfAcquisition || "",
                        yearOfAcquisition: asset.yearOfAcquisition || "",
                        companyId: asset.companyId || "",
                        companyName: asset.companyName || "",
                        branch: asset.branch || "",
                        location: asset.location || "",
                        locationCode: asset.locationCode || "",
                        product: asset.product || "",
                        productCode: asset.productCode || "",
                        productSerialNumber: asset.productSerialNumber || "",
                        config: asset.config || "",
                        taggingNo: asset.taggingNo || "",
                        purchasedFrom: asset.purchasedFrom || "",
                        warrantyExpiry: asset.warrantyExpiry || "",
                        status: asset.status || "Active"
                    });
                } else {
                    toast.error("Asset not found");
                    navigate("/assets");
                }
            } catch (error) {
                console.error("Error fetching asset:", error);
                toast.error("Failed to load asset details");
            } finally {
                setFetching(false);
            }
        }
        fetchAsset();
    }, [id, navigate]);

    // Auto-calculate Year of Acquisition
    useEffect(() => {
        if (formData.dateOfAcquisition) {
            const year = new Date(formData.dateOfAcquisition).getFullYear();
            setFormData(prev => ({ ...prev, yearOfAcquisition: year }));
        }
    }, [formData.dateOfAcquisition]);

    // Handle Company Selection
    const handleCompanyChange = (e) => {
        const companyId = e.target.value;
        const selectedCompany = companies.find(c => c.id === companyId);

        if (selectedCompany) {
            setFormData(prev => ({
                ...prev,
                companyId: selectedCompany.id,
                companyName: selectedCompany.name,
                branch: selectedCompany.branch,
                location: selectedCompany.location,
                locationCode: selectedCompany.locationCode || ""
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                companyId: "",
                companyName: "",
                branch: "",
                location: "",
                locationCode: ""
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateAsset(id, formData);
            toast.success("Asset updated successfully");
            navigate("/assets");
        } catch (error) {
            console.error("Error updating asset:", error);
            toast.error("Failed to update asset");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Loader />;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Asset</h2>
                    <p className="text-gray-500 mt-1">Update asset details and information.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/assets")}
                        className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 border border-gray-300 transition shadow-sm"
                    >
                        <ArrowLeft size={20} /> Back to List
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6 border border-gray-200">
                {/* Section 1: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URN</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                            value={formData.urn}
                            onChange={e => setFormData({ ...formData, urn: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Acquisition</label>
                        <input
                            type="date"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                            value={formData.dateOfAcquisition}
                            onChange={e => setFormData({ ...formData, dateOfAcquisition: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year of Acquisition</label>
                        <input
                            type="number"
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                            value={formData.yearOfAcquisition}
                        />
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Section 2: Location & Company */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company (Select from Master)</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.companyId}
                            onChange={handleCompanyChange}
                        >
                            <option value="">Select Company</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.name} - {company.branch} ({company.location})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <input
                            type="text"
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                            value={formData.branch}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                            value={formData.location}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location Code</label>
                        <input
                            type="text"
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 font-mono"
                            value={formData.locationCode}
                        />
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Section 3: Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.product}
                            onChange={e => setFormData({ ...formData, product: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                            value={formData.productCode}
                            onChange={e => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.productSerialNumber}
                            onChange={e => setFormData({ ...formData, productSerialNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Configuration</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.config}
                            onChange={e => setFormData({ ...formData, config: e.target.value })}
                        />
                    </div>
                </div>

                {/* Tagging No Input */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tagging No.</label>
                    <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        value={formData.taggingNo}
                        onChange={e => setFormData({ ...formData, taggingNo: e.target.value })}
                        placeholder="Enter Tagging Number"
                    />
                </div>

                <hr className="border-gray-200" />

                {/* Section 4: Purchase & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchased From</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.purchasedFrom}
                            onChange={e => setFormData({ ...formData, purchasedFrom: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                        <input
                            type="date"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.warrantyExpiry}
                            onChange={e => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="In Repair">In Repair</option>
                            <option value="Scrapped">Scrapped</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        <Save size={20} />
                        {loading ? "Saving..." : "Update Asset"}
                    </button>
                </div>
            </form>
        </div>
    );
}
