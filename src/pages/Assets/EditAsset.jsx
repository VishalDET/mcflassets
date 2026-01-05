import { useState, useEffect } from "react";
import { useDatabase } from "../../context/DatabaseContext";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, FileText, Upload, X } from "lucide-react";
import { getAssetById, updateAsset } from "../../services/db";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

export default function EditAsset() {
    const { id } = useParams();
    const { companies, brands, getBranches } = useDatabase();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [branches, setBranches] = useState([]);
    const [invoiceFile, setInvoiceFile] = useState(null);

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
        brandId: "",
        brandName: "",
        model: "",
        config: "",
        taggingNo: "",
        purchasedFrom: "",
        invoiceNumber: "",
        amount: "",
        warrantyExpiry: "",
        invoiceUrl: "",
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
                        brandId: asset.brandId || "",
                        brandName: asset.brandName || "",
                        model: asset.model || "",
                        config: asset.config || "",
                        taggingNo: asset.taggingNo || "",
                        purchasedFrom: asset.purchasedFrom || "",
                        invoiceNumber: asset.invoiceNumber || "",
                        amount: asset.amount || "",
                        warrantyExpiry: asset.warrantyExpiry || "",
                        invoiceUrl: asset.invoiceUrl || "",
                        status: asset.status || "Active",
                        employeeId: asset.employeeId || "",
                        employeeName: asset.employeeName || ""
                    });
                    // Fetch branches for existing company if needed
                    if (asset.companyId) {
                        try {
                            const fetchedBranches = await getBranches(asset.companyId);
                            setBranches(fetchedBranches);
                        } catch (e) { console.error(e) }
                    }
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

    // Handle File Selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setInvoiceFile(e.target.files[0]);
        }
    };

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
            let updatedData = { ...formData }; // Create a copy

            // Handle Invoice Upload if new file selected
            if (invoiceFile) {
                setUploading(true);
                const uploadData = new FormData();
                uploadData.append("file", invoiceFile);
                uploadData.append("upload_preset", "ml_default");

                const response = await fetch(
                    "https://api.cloudinary.com/v1_1/dhcskn7cd/auto/upload",
                    {
                        method: "POST",
                        body: uploadData,
                    }
                );

                if (!response.ok) throw new Error("Failed to upload invoice");

                const data = await response.json();
                updatedData.invoiceUrl = data.secure_url;
                setUploading(false);
            }

            // Automatically unassign if status is Scrapped
            if (updatedData.status === "Scrapped") {
                updatedData.assignedTo = "Stock";
                updatedData.employeeId = "N/A";
                updatedData.assignedDate = null;
            }

            await updateAsset(id, updatedData);
            toast.success("Asset updated successfully");
            navigate("/assets");
        } catch (error) {
            console.error("Error updating asset:", error);
            toast.error("Failed to update asset");
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Loader />;

    return (
        <div className="p-4 py-1 max-w-7xl mx-auto">
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
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
                            value={formData.urn}
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



                {/* Section 3.5: Brand & Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.brandId}
                            onChange={(e) => {
                                const selectedBrand = brands.find(b => b.id === e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    brandId: e.target.value,
                                    brandName: selectedBrand ? selectedBrand.name : ""
                                }));
                            }}
                        >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.model}
                            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
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

                {/* Tagging No - Read Only */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tagging No.</label>
                    <input
                        type="text"
                        required
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed font-mono text-lg font-bold"
                        value={formData.taggingNo}
                        placeholder="Auto-generated"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.invoiceNumber}
                            onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                            type="number"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
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

                {/* Invoice Attachment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Attachment</label>
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                        {formData.invoiceUrl && (
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-sm font-medium text-gray-700">Current Invoice:</span>
                                <a
                                    href={formData.invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                >
                                    View Invoice
                                </a>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100"
                                onChange={handleFileChange}
                            />
                        </div>
                        {invoiceFile && <p className="text-xs text-gray-500 mt-2">New file selected: {invoiceFile.name}</p>}
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
            </form >
        </div >
    );
}
