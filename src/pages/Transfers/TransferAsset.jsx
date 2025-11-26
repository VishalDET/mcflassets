import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { addTransfer, getAssets, updateAsset } from "../../services/db";
import { useAuth } from "../../context/AuthContext";

export default function TransferAsset() {
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const selectedAssetId = watch("assetId");

    useEffect(() => {
        async function loadAssets() {
            const data = await getAssets();
            setAssets(data);
        }
        loadAssets();
    }, []);

    useEffect(() => {
        if (selectedAssetId) {
            const asset = assets.find(a => a.id === selectedAssetId);
            if (asset) {
                setValue("fromCompany", asset.company || "");
                setValue("fromDepartment", asset.department || "");
                setValue("currentAssignedTo", asset.assignedTo || "Unassigned");
            }
        }
    }, [selectedAssetId, assets, setValue]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // 1. Create Transfer Record
            await addTransfer({
                assetId: data.assetId,
                fromCompany: data.fromCompany,
                toCompany: data.toCompany,
                fromDepartment: data.fromDepartment,
                toDepartment: data.toDepartment,
                assignedBy: currentUser.email,
                assignedTo: data.assignedTo,
                reason: data.reason,
                transferDate: new Date()
            });

            // 2. Update Asset Status
            await updateAsset(data.assetId, {
                company: data.toCompany,
                department: data.toDepartment,
                assignedTo: data.assignedTo,
                status: "Assigned"
            });

            navigate("/assets");
        } catch (error) {
            console.error("Error transferring asset:", error);
            alert("Failed to transfer asset");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Transfer Asset</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Asset</label>
                        <select
                            {...register("assetId", { required: "Please select an asset" })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Asset</option>
                            {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} ({asset.serialNumber})
                                </option>
                            ))}
                        </select>
                        {errors.assetId && <p className="text-red-500 text-sm mt-1">{errors.assetId.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">From Company</label>
                            <input
                                {...register("fromCompany")}
                                readOnly
                                className="w-full bg-transparent border-none p-0 font-medium text-gray-900 focus:ring-0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">From Department</label>
                            <input
                                {...register("fromDepartment")}
                                readOnly
                                className="w-full bg-transparent border-none p-0 font-medium text-gray-900 focus:ring-0"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 uppercase">Currently Assigned To</label>
                            <input
                                {...register("currentAssignedTo")}
                                readOnly
                                className="w-full bg-transparent border-none p-0 font-medium text-gray-900 focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Company</label>
                            <input
                                {...register("toCompany", { required: "Destination company is required" })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="New Company"
                            />
                            {errors.toCompany && <p className="text-red-500 text-sm mt-1">{errors.toCompany.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Department</label>
                            <input
                                {...register("toDepartment", { required: "Destination department is required" })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="New Department"
                            />
                            {errors.toDepartment && <p className="text-red-500 text-sm mt-1">{errors.toDepartment.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign To (Person)</label>
                        <input
                            {...register("assignedTo", { required: "Assignee name is required" })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Employee Name"
                        />
                        {errors.assignedTo && <p className="text-red-500 text-sm mt-1">{errors.assignedTo.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Transfer</label>
                        <textarea
                            {...register("reason", { required: "Reason is required" })}
                            rows="3"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g. New joining, Replacement, etc."
                        ></textarea>
                        {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate("/assets")}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Transfer Asset"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
