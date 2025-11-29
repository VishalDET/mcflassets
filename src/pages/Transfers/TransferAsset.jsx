import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { addTransfer, getAssets, updateAsset } from "../../services/db";
import { useAuth } from "../../context/AuthContext";
import { useDatabase } from "../../context/DatabaseContext";
import { toast } from "react-toastify";
import Loader from "../../components/common/Loader";

export default function TransferAsset() {
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { companies } = useDatabase();

    const selectedAssetId = watch("assetId");

    useEffect(() => {
        async function loadAssets() {
            setLoading(true);
            try {
                const data = await getAssets();
                setAssets(data);
            } catch (error) {
                console.error("Failed to load assets", error);
                toast.error("Failed to load assets");
            } finally {
                setLoading(false);
            }
        }
        loadAssets();
    }, []);

    useEffect(() => {
        if (selectedAssetId) {
            const asset = assets.find(a => a.id === selectedAssetId);
            if (asset) {
                setValue("fromCompany", asset.companyName || "");
                setValue("fromBranch", asset.branch || "");
                setValue("fromLocation", asset.location || "");
                setValue("currentAssignedTo", asset.assignedTo || "Unassigned");
            }
        }
    }, [selectedAssetId, assets, setValue]);

    const handleCompanyChange = (e) => {
        const companyId = e.target.value;
        const selectedCompany = companies.find(c => c.id === companyId);

        if (selectedCompany) {
            setValue("toCompany", selectedCompany.name);
            setValue("toBranch", selectedCompany.branch);
            setValue("toLocation", selectedCompany.location);
            setValue("toLocationCode", selectedCompany.locationCode || "");
        } else {
            setValue("toCompany", "");
            setValue("toBranch", "");
            setValue("toLocation", "");
            setValue("toLocationCode", "");
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // 1. Create Transfer Record
            await addTransfer({
                assetId: data.assetId,
                fromCompany: data.fromCompany,
                fromBranch: data.fromBranch,
                fromLocation: data.fromLocation,
                toCompany: data.toCompany,
                toBranch: data.toBranch,
                toLocation: data.toLocation,
                assignedBy: currentUser.email,
                assignedTo: data.assignedTo,
                employeeId: data.employeeId,
                assignedDate: data.assignedDate,
                reason: data.reason,
                transferDate: new Date() // System timestamp of transfer
            });

            // 2. Update Asset Status and Location
            await updateAsset(data.assetId, {
                companyName: data.toCompany,
                branch: data.toBranch,
                location: data.toLocation,
                locationCode: data.toLocationCode,
                assignedTo: data.assignedTo,
                employeeId: data.employeeId,
                assignedDate: data.assignedDate,
                status: "Assigned"
            });

            toast.success("Asset transferred successfully");
            navigate("/assets");
        } catch (error) {
            console.error("Error transferring asset:", error);
            toast.error("Failed to transfer asset");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Transfer Asset</h2>
                    <p className="text-gray-500 mt-1">Move assets between companies or locations.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset</label>
                        <select
                            {...register("assetId", { required: "Please select an asset" })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                        >
                            <option value="">Select Asset</option>
                            {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.product} ({asset.productSerialNumber}) - {asset.taggingNo}
                                </option>
                            ))}
                        </select>
                        {errors.assetId && <p className="text-red-500 text-sm mt-1">{errors.assetId.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">From Company</label>
                            <input
                                {...register("fromCompany")}
                                readOnly
                                className="w-full bg-transparent border-none p-0 font-medium text-gray-900 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">From Branch</label>
                            <input
                                {...register("fromBranch")}
                                readOnly
                                className="w-full bg-transparent border-none p-0 font-medium text-gray-900 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">From Location</label>
                            <input
                                {...register("fromLocation")}
                                readOnly
                                className="w-full bg-transparent border-none p-0 font-medium text-gray-900 focus:ring-0"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 uppercase">Currently Assigned To</label>
                            <input
                                {...register("currentAssignedTo")}
                                readOnly
                                className="w-full bg-transparent border-none p-0 font-medium text-gray-900 focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Company</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                onChange={handleCompanyChange}
                                required
                            >
                                <option value="">Select New Company</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} - {company.branch}
                                    </option>
                                ))}
                            </select>
                            {/* Hidden inputs to store the actual values */}
                            <input type="hidden" {...register("toCompany", { required: true })} />
                            <input type="hidden" {...register("toLocationCode")} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Branch</label>
                            <input
                                {...register("toBranch", { required: "Destination branch is required" })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500 bg-gray-50"
                                readOnly
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                            <input
                                {...register("toLocation", { required: "Destination location is required" })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500 bg-gray-50"
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Person)</label>
                            <input
                                {...register("assignedTo", { required: "Assignee name is required" })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                placeholder="Employee Name"
                            />
                            {errors.assignedTo && <p className="text-red-500 text-sm mt-1">{errors.assignedTo.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                            <input
                                {...register("employeeId", { required: "Employee ID is required" })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                                placeholder="EMP-001"
                            />
                            {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Date</label>
                        <input
                            type="date"
                            {...register("assignedDate", { required: "Assigned Date is required" })}
                            defaultValue={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                        />
                        {errors.assignedDate && <p className="text-red-500 text-sm mt-1">{errors.assignedDate.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Transfer</label>
                        <textarea
                            {...register("reason", { required: "Reason is required" })}
                            rows="3"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-gray-500 focus:border-gray-500"
                            placeholder="e.g. New joining, Replacement, etc."
                        ></textarea>
                        {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate("/assets")}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 shadow-sm"
                        >
                            {loading ? "Processing..." : "Transfer Asset"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
