import { useState, useEffect } from "react";
import { useDatabase } from "../../context/DatabaseContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { toast } from "react-toastify";
import { Upload, X, FileText } from "lucide-react";
import Loader from "../../components/common/Loader";
import { getAssets } from "../../services/db";

export default function AddAsset() {
    const { companies, products, suppliers, getBranches } = useDatabase();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [invoiceFile, setInvoiceFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        urn: "",
        dateOfAcquisition: "",
        yearOfAcquisition: "",
        companyId: "",
        companyName: "",
        companyCode: "",
        branch: "",
        branchCode: "",
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

    // Auto-generate URN on mount - DISABLED for manual entry of old data
    // useEffect(() => {
    //     const generateURN = async () => {
    //         try {
    //             const assets = await getAssets();
    //             const urns = assets.map(a => parseInt(a.urn)).filter(n => !isNaN(n));
    //             const maxURN = urns.length > 0 ? Math.max(...urns) : 2355;
    //             const nextURN = (maxURN + 1).toString();
    //             setFormData(prev => ({ ...prev, urn: nextURN }));
    //         } catch (error) {
    //             console.error("Error generating URN:", error);
    //             toast.error("Failed to generate URN");
    //         }
    //     };
    //     generateURN();
    // }, []);

    // Auto-calculate Year of Acquisition
    useEffect(() => {
        if (formData.dateOfAcquisition) {
            const year = new Date(formData.dateOfAcquisition).getFullYear();
            setFormData(prev => ({ ...prev, yearOfAcquisition: year }));
        }
    }, [formData.dateOfAcquisition]);

    // Auto-generate Tagging Number - DISABLED for manual entry of old data
    // useEffect(() => {
    //     if (formData.companyCode && formData.productCode && formData.urn) {
    //         const taggingNo = `${formData.companyCode}${formData.productCode}${formData.urn}`;
    //         setFormData(prev => ({ ...prev, taggingNo }));
    //     }
    // }, [formData.companyCode, formData.productCode, formData.urn]);

    // Handle Company Selection
    const handleCompanyChange = async (e) => {
        const companyId = e.target.value;
        const company = companies.find(c => c.id === companyId);

        if (company) {
            setSelectedCompany(company);
            setFormData(prev => ({
                ...prev,
                companyId: company.id,
                companyName: company.name,
                companyCode: company.companyCode || "",
                branch: "",
                branchCode: "",
                location: "",
                locationCode: ""
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
                companyId: "",
                companyName: "",
                companyCode: "",
                branch: "",
                branchCode: "",
                location: "",
                locationCode: ""
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
                branch: branch.name,
                branchCode: branch.branchCode || "",
                location: branch.location || "",
                locationCode: branch.locationCode || ""
            }));
        } else {
            setSelectedBranch(null);
            setFormData(prev => ({
                ...prev,
                branch: "",
                branchCode: "",
                location: "",
                locationCode: ""
            }));
        }
    };

    // Handle Product Selection
    const handleProductChange = (e) => {
        const productId = e.target.value;
        const product = products.find(p => p.id === productId);

        if (product) {
            setSelectedProduct(product);
            setFormData(prev => ({
                ...prev,
                product: product.name,
                productCode: product.code || ""
            }));
        } else {
            setSelectedProduct(null);
            setFormData(prev => ({
                ...prev,
                product: "",
                productCode: ""
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let invoiceUrl = "";

            // Upload Invoice if selected
            if (invoiceFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append("file", invoiceFile);
                formData.append("upload_preset", "ml_default");

                const response = await fetch(
                    "https://api.cloudinary.com/v1_1/dhcskn7cd/auto/upload",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to upload invoice");
                }

                const data = await response.json();
                invoiceUrl = data.secure_url;
                setUploading(false);
            }

            await addDoc(collection(db, "assets"), {
                ...formData,
                invoiceUrl,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast.success("Asset added successfully");
            navigate("/assets");
        } catch (error) {
            console.error("Error adding asset:", error);
            toast.error("Failed to add asset");
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-4 py-1 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Asset</h2>
                    <p className="text-gray-500 mt-1">Register a new asset into the system.</p>
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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-transparent focus:outline-none"
                            value={formData.urn}
                            onChange={e => setFormData({ ...formData, urn: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Acquisition</label>
                        <input
                            type="date"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-transparent focus:outline-none"
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

                {/* Section 2: Company & Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                            value={formData.companyId}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                            value={selectedProduct?.id || ""}
                            onChange={handleProductChange}
                        >
                            <option value="">Select Product</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                        <input
                            type="text"
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500 font-mono uppercase"
                            value={formData.productCode}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                            value={formData.productSerialNumber}
                            onChange={e => setFormData({ ...formData, productSerialNumber: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Configuration</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                            value={formData.config}
                            onChange={e => setFormData({ ...formData, config: e.target.value })}
                        />
                    </div>
                </div>

                {/* Tagging No - Manual Entry */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tagging No.</label>
                    <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none font-mono text-lg font-bold"
                        value={formData.taggingNo}
                        onChange={e => setFormData({ ...formData, taggingNo: e.target.value })}
                        placeholder="Enter Asset Tagging Number"
                    />
                </div>

                <hr className="border-gray-200" />

                {/* Section 4: Purchase & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchased From</label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                            value={formData.purchasedFrom}
                            onChange={e => setFormData({ ...formData, purchasedFrom: e.target.value })}
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map(supplier => (
                                <option key={supplier.id} value={supplier.companyName}>
                                    {supplier.companyName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                        <input
                            type="date"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                            value={formData.warrantyExpiry}
                            onChange={e => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:outline-none"
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice / Document</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                            {invoiceFile ? (
                                <div className="flex flex-col items-center">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                        <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                            {invoiceFile.name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{(invoiceFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        type="button"
                                        onClick={() => setInvoiceFile(null)}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                                    >
                                        <X size={16} /> Remove
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setInvoiceFile(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        <Save size={20} />
                        {loading ? (uploading ? "Uploading Invoice..." : "Saving...") : "Save Asset"}
                    </button>
                </div>
            </form>
        </div>
    );
}
