import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTransferById, updateTransfer, addTransfer, getAssetById, updateAsset } from "../../services/db";
import { useAuth } from "../../context/AuthContext";
import { useDatabase } from "../../context/DatabaseContext";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";
import { User, Building2, ArrowLeft } from "lucide-react";

export default function EditTransfer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { companies, products, getBranches, employees } = useDatabase();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [transfer, setTransfer] = useState(null);
    const [asset, setAsset] = useState(null);
    const [branches, setBranches] = useState([]);

    // Derived state for transfer type based on data
    const [transferType, setTransferType] = useState("employee");

    const [formData, setFormData] = useState({
        toCompanyId: "",
        toCompany: "",
        toCompanyCode: "",
        toBranch: "",
        toBranchCode: "",
        toLocation: "",
        toLocationCode: "",
        assignedTo: "",
        employeeId: "",
        assignedDate: "",
        reason: ""
    });

    // Load Transfer Data
    useEffect(() => {
        async function loadData() {
            try {
                const transferData = await getTransferById(id);
                if (!transferData) {
                    toast.error("Transfer record not found");
                    navigate("/assets");
                    return;
                }

                setTransfer(transferData);

                // Determine type
                if (transferData.employeeId && transferData.employeeId !== "N/A") {
                    setTransferType("employee");
                } else {
                    setTransferType("company");
                }

                // Load Asset to show details
                if (transferData.assetId) {
                    const assetData = await getAssetById(transferData.assetId);
                    setAsset(assetData);
                }

                // Initial Form Data
                setFormData({
                    toCompanyId: transferData.toCompanyId || "", // Note: Transfer might not have stored ID, relying on Name matching if ID missing is risky but consistent with potential legacy data. Added fallback lookup if needed.
                    // Actually, addTransfer didn't store toCompanyId in previous code, only Name. 
                    // We need to match Name to ID to populate dropdowns correctly.
                    toCompany: transferData.toCompany,
                    toBranch: transferData.toBranch,
                    toLocation: transferData.toLocation,
                    assignedTo: transferData.assignedTo,
                    employeeId: transferData.employeeId,
                    assignedDate: transferData.assignedDate, // Need to handle date format
                    reason: transferData.reason
                });

                // Match Company Name to ID for dropdown state
                // This is a bit inefficient but necessary if IDs weren't stored
                // Assuming companies are loaded from context
            } catch (error) {
                console.error("Error loading transfer:", error);
                toast.error("Failed to load transfer details");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, navigate]);

    // Effect to populate IDs once companies/transfer data are loaded
    useEffect(() => {
        if (!loading && transfer && companies.length > 0) {
            const company = companies.find(c => c.name === transfer.toCompany);
            if (company) {
                setFormData(prev => ({
                    ...prev,
                    toCompanyId: company.id,
                    toCompanyCode: company.companyCode
                }));
                getBranches(company.id).then(fetchedBranches => {
                    setBranches(fetchedBranches);
                    // Match branch name to get codes if needed
                    const branch = fetchedBranches.find(b => b.name === transfer.toBranch);
                    if (branch) {
                        setFormData(prev => ({
                            ...prev,
                            toBranchCode: branch.branchCode,
                            toLocationCode: branch.locationCode
                        }));
                    }
                });
            }
        }
    }, [loading, transfer, companies, getBranches]);


    // Handle Company Selection
    const handleCompanyChange = async (e) => {
        const companyId = e.target.value;
        const company = companies.find(c => c.id === companyId);

        if (company) {
            setFormData(prev => ({
                ...prev,
                toCompanyId: company.id,
                toCompany: company.name,
                toCompanyCode: company.companyCode || "",
                toBranch: "",
                toBranchCode: "",
                toLocation: "",
                toLocationCode: "",
                // Clear employee if company changes
                employeeId: "",
                assignedTo: ""
            }));

            try {
                const fetchedBranches = await getBranches(companyId);
                setBranches(fetchedBranches);
            } catch (error) {
                console.error("Error fetching branches:", error);
                setBranches([]);
            }
        } else {
            setBranches([]);
            setFormData(prev => ({
                ...prev,
                toCompanyId: "",
                toCompany: "",
                toBranch: "",
                assignedTo: "",
                employeeId: ""
            }));
        }
    };

    // Handle Branch Selection
    const handleBranchChange = (e) => {
        const branchId = e.target.value;
        const branch = branches.find(b => b.id === branchId); // Value is ID here? Or Name?
        // In TransferAsset we used ID for value. 
        // Here we might need to be careful matching existing data (Name) vs new selection (ID).
        // Let's assume we use ID for value in select.

        if (branch) {
            setFormData(prev => ({
                ...prev,
                toBranch: branch.name,
                toBranchCode: branch.branchCode || "",
                toLocation: branch.location || "",
                toLocationCode: branch.locationCode || ""
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (transferType === "employee" && (!formData.employeeId || !formData.assignedTo)) {
            toast.error("Please select an employee");
            return;
        }

        try {
            setSubmitting(true);

            // Step 1: Mark the old transfer record as superseded
            await updateTransfer(id, {
                isSuperseded: true,
                supersededAt: new Date(),
                supersededBy: currentUser.email
            });

            // Step 2: Create a new transfer record with updated information
            const newTransferData = {
                assetId: transfer.assetId,
                fromCompany: transfer.fromCompany,
                fromBranch: transfer.fromBranch,
                fromLocation: transfer.fromLocation,
                toCompany: formData.toCompany,
                toBranch: formData.toBranch,
                toLocation: formData.toLocation,
                assignedBy: currentUser.email,
                assignedTo: transferType === "employee" ? formData.assignedTo : "Stock",
                employeeId: transferType === "employee" ? formData.employeeId : "N/A",
                assignedDate: formData.assignedDate,
                reason: formData.reason,
                supersedes: id, // Link to the old transfer record
                transferDate: new Date()
            };

            await addTransfer(newTransferData);

            // Step 3: Update the asset with new assignment details
            // Only update if this appears to be the latest transfer for the asset
            if (asset && (asset.assignedTo === transfer.assignedTo || asset.lastTransferId === id)) {
                await updateAsset(asset.id, {
                    companyName: formData.toCompany,
                    branch: formData.toBranch,
                    location: formData.toLocation,
                    assignedTo: newTransferData.assignedTo,
                    employeeId: newTransferData.employeeId,
                    assignedDate: formData.assignedDate,
                    status: transferType === "employee" ? "Assigned" : "Active"
                });
                toast.success("Transfer updated successfully - new history record created");
            } else {
                toast.success("Transfer record updated - new history record created");
            }

            navigate(-1); // Go back
        } catch (error) {
            console.error("Error updating transfer:", error);
            toast.error("Failed to update transfer");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="p-4 py-1 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Transfer</h2>
                    <p className="text-gray-500 mt-1">Update transfer details.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {/* Asset Info Summary */}
                {asset && (
                    <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-2">Asset: {asset.product} ({asset.taggingNo})</h3>
                        <p className="text-sm text-blue-800">S/N: {asset.productSerialNumber}</p>
                    </div>
                )}

                <div className="mb-8 flex justify-center">
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                        <button
                            type="button"
                            onClick={() => setTransferType("employee")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${transferType === "employee"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            <User size={18} />
                            Employee Transfer
                        </button>
                        <button
                            type="button"
                            onClick={() => setTransferType("company")}
                            className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${transferType === "company"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            <Building2 size={18} />
                            Company Transfer
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                // We match by Name since existing data might only have Name. 
                                // But select value usually binds to ID if options use ID.
                                // Let's try to match selected branch object to get its ID, or use Name if that's what we store.
                                // Simplified: if we have branches, find the one with name === formData.toBranch and use its ID
                                value={branches.find(b => b.name === formData.toBranch)?.id || ""}
                                onChange={handleBranchChange}
                                disabled={!formData.toCompanyId}
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
                    </div>

                    <hr className="border-gray-200" />

                    {/* Employee Selection */}
                    {transferType === "employee" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Person)</label>
                                <select
                                    required={transferType === "employee"}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                    value={formData.employeeId}
                                    onChange={(e) => {
                                        const selectedEmployee = employees.find(emp => emp.employeeId === e.target.value);
                                        setFormData({
                                            ...formData,
                                            employeeId: e.target.value,
                                            assignedTo: selectedEmployee ? selectedEmployee.employeeName : ""
                                        });
                                    }}
                                    disabled={!formData.toCompanyId}
                                >
                                    <option value="">
                                        {!formData.toCompanyId
                                            ? "Select Company First"
                                            : "Select Employee"}
                                    </option>
                                    {employees
                                        .filter(emp => {
                                            if (emp.companyId !== formData.toCompanyId) return false;
                                            // Optional branch filter
                                            const currentBranchId = branches.find(b => b.name === formData.toBranch)?.id;
                                            if (currentBranchId && emp.branchId && emp.branchId !== currentBranchId) {
                                                return false;
                                            }
                                            return true;
                                        })
                                        .map(emp => (
                                            <option key={emp.id} value={emp.employeeId}>
                                                {emp.employeeName} ({emp.employeeId})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                                <input
                                    readOnly
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
                                    value={formData.employeeId || ""}
                                />
                            </div>
                        </div>
                    )}

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
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 shadow-sm"
                        >
                            {submitting ? "Updating..." : "Update Transfer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
