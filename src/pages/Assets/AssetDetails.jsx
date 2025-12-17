import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAssetHistory, getAssetById, addTransfer, updateAsset } from "../../services/db";
import { ArrowLeft, Calendar, User, Building, FileText, ExternalLink, MapPin, Pencil, UserMinus } from "lucide-react";
import Loader from "../../components/common/Loader";
import { formatDate } from "../../utils/dateUtils";
import ServiceCenterModal from "../../components/Assets/ServiceCenterModal";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

export default function AssetDetails() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const [asset, setAsset] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unassigning, setUnassigning] = useState(false);
    const [isServiceCenterModalOpen, setIsServiceCenterModalOpen] = useState(false);
    const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const foundAsset = await getAssetById(id);
                setAsset(foundAsset);

                if (foundAsset) {
                    const historyData = await getAssetHistory(id);
                    setHistory(historyData);
                }
            } catch (error) {
                console.error("Error loading asset details:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    const handleUnassign = () => {
        if (!asset || asset.status !== "Assigned") {
            toast.error("Asset is not currently assigned");
            return;
        }
        setIsUnassignModalOpen(true);
    };

    const confirmUnassign = async () => {
        try {
            setUnassigning(true);
            setIsUnassignModalOpen(false);

            // Create transfer record for audit trail
            await addTransfer({
                assetId: id,
                fromCompany: asset.companyName,
                fromBranch: asset.branch,
                fromLocation: asset.location,
                toCompany: asset.companyName, // Same company
                toBranch: asset.branch, // Same branch
                toLocation: asset.location, // Same location
                assignedBy: currentUser.email,
                assignedTo: "Stock",
                employeeId: "N/A",
                assignedDate: new Date().toISOString().split('T')[0],
                reason: `Unassigned from ${asset.assignedTo} (${asset.employeeId})`,
                transferDate: new Date()
            });

            // Update asset to Active status and clear assignment
            await updateAsset(id, {
                status: "Active",
                assignedTo: "Stock",
                employeeId: "N/A",
                assignedDate: null
            });

            toast.success("Asset unassigned successfully");

            // Reload data
            const updatedAsset = await getAssetById(id);
            setAsset(updatedAsset);
            const historyData = await getAssetHistory(id);
            setHistory(historyData);
        } catch (error) {
            console.error("Error unassigning asset:", error);
            toast.error("Failed to unassign asset");
        } finally {
            setUnassigning(false);
        }
    };

    if (loading) return <Loader />;
    if (!asset) return <div className="p-8 text-center">Asset not found</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Asset Details</h2>
                    <p className="text-gray-500 mt-1">View complete history and specifications.</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/assets"
                        className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 border border-gray-300 transition shadow-sm"
                    >
                        <ArrowLeft size={20} /> Back to List
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Asset Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{asset.product}</h1>
                                <p className="text-gray-500 font-mono">{asset.productCode}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${asset.status === 'Assigned' ? 'bg-gray-100 text-gray-800' :
                                asset.status === 'Active' ? 'bg-green-100 text-green-800' : // Changed 'Available' to 'Active'
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                {asset.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Identification */}
                            <div className="col-span-2 border-b border-gray-100 pb-4 mb-2">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Identification</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Tagging No</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium font-mono">{asset.taggingNo || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">URN</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.urn || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Serial Number</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.productSerialNumber || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Brand</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.brandName || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Model</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.model || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Configuration</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.config || "-"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="col-span-2 border-b border-gray-100 pb-4 mb-2">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Location & Company</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Company</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium flex items-center gap-2">
                                            <Building size={16} className="text-gray-400" />
                                            {asset.companyName || "-"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Branch</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.branch || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Location</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.location || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Location Code</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium font-mono">{asset.locationCode || "-"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase Info */}
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Date of Acquisition</label>
                                <div className="mt-1 text-sm text-gray-900 font-medium flex items-center gap-2">
                                    <Calendar size={16} className="text-gray-400" />
                                    {formatDate(asset.dateOfAcquisition)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Year of Acquisition</label>
                                <div className="mt-1 text-sm text-gray-900 font-medium">{asset.yearOfAcquisition || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Purchased From</label>
                                <div className="mt-1 text-sm text-gray-900 font-medium">{asset.purchasedFrom || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Invoice Number</label>
                                <div className="mt-1 text-sm text-gray-900 font-medium">{asset.invoiceNumber || "-"}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Amount</label>
                                <div className="mt-1 text-sm text-gray-900 font-medium">{asset.amount ? `₹${asset.amount}` : "-"}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Warranty Expiry</label>
                                <div className="mt-1 text-sm text-gray-900 font-medium">{formatDate(asset.warrantyExpiry)}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Invoice</label>
                                <div className="mt-1">
                                    {asset.invoiceUrl ? (
                                        <a
                                            href={asset.invoiceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            <FileText size={16} />
                                            View Invoice
                                            <ExternalLink size={14} />
                                        </a>
                                    ) : (
                                        <span className="text-sm text-gray-500">-</span>
                                    )}
                                </div>
                            </div>

                            {/* Assignment */}
                            <div className="col-span-2 pt-4 border-t border-gray-100 mt-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Current Assignment</h3>
                                    {asset.status === "Assigned" && (
                                        <button
                                            onClick={handleUnassign}
                                            disabled={unassigning}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition border border-orange-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Return asset to stock"
                                        >
                                            <UserMinus size={16} />
                                            {unassigning ? "Unassigning..." : "Unassign Asset"}
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Assigned To</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            {asset.assignedTo || "Unassigned"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Employee ID</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{asset.employeeId || "-"}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Assigned Date</label>
                                        <div className="mt-1 text-sm text-gray-900 font-medium">{formatDate(asset.assignedDate)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {asset.remarks && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Remarks</h3>
                                <p className="text-gray-700">{asset.remarks}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* History Timeline */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                    <h2 className="text-lg font-bold mb-4">Assignment & Transfer History</h2>
                    <div className="space-y-6 mb-6">
                        {history.length === 0 ? (
                            <p className="text-gray-500 text-sm">No assignment or transfer history</p>
                        ) : (
                            history.map((record) => {
                                const isEmployeeAssignment = record.assignedTo && record.assignedTo !== "Stock" && record.assignedTo !== "N/A";
                                const dotColor = isEmployeeAssignment ? "bg-blue-500" : "bg-gray-500";
                                const badgeColor = isEmployeeAssignment
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800";
                                const badgeText = isEmployeeAssignment ? "Employee Assignment" : "Company Transfer";

                                return (
                                    <div key={record.id} className="relative pl-6 border-l-2 border-gray-200 last:border-0 pb-6 last:pb-0">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${dotColor} border-2 border-white`}></div>

                                        {/* Date and Badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-medium text-gray-500">
                                                {record.transferDate?.seconds
                                                    ? new Date(record.transferDate.seconds * 1000).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })
                                                    : 'Just now'}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                                                {badgeText}
                                            </span>
                                        </div>

                                        {/* Assignment Details */}
                                        {isEmployeeAssignment ? (
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                    <User size={14} className="text-blue-500" />
                                                    {record.assignedTo}
                                                    {record.employeeId && record.employeeId !== "N/A" && (
                                                        <span className="text-xs font-normal text-gray-500">
                                                            (ID: {record.employeeId})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                                    <Building size={12} className="text-gray-400" />
                                                    {record.toCompany} • {record.toBranch}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Location: {record.toLocation}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Transferred to Stock
                                                </p>
                                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                                    <Building size={12} className="text-gray-400" />
                                                    {record.toCompany} • {record.toBranch}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Location: {record.toLocation}
                                                </p>
                                            </div>
                                        )}

                                        {/* Reason */}
                                        {record.reason && (
                                            <p className="text-xs text-gray-500 mt-2 italic">
                                                Reason: {record.reason}
                                            </p>
                                        )}

                                        {/* Edit Button */}
                                        <div className="absolute right-0 top-0">
                                            <Link
                                                to={`/transfers/${record.id}/edit`}
                                                className="text-gray-400 hover:text-blue-600 transition p-1"
                                                title="Edit Transfer"
                                            >
                                                <Pencil size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Service Center Button */}
                    <div className="pt-6 border-t border-gray-200">
                        <button
                            onClick={() => setIsServiceCenterModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition border border-gray-200 font-medium text-sm"
                        >
                            <MapPin size={18} />
                            Find Nearest Service Center
                        </button>
                    </div>
                </div>
            </div>

            {/* Service Center Modal */}
            <ServiceCenterModal
                isOpen={isServiceCenterModalOpen}
                onClose={() => setIsServiceCenterModalOpen(false)}
                brandName={asset.brandName}
                location={asset.location}
            />

            {/* Unassign Confirmation Modal */}
            {isUnassignModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4 bg-orange-600 p-4 py-3 rounded-t-lg">
                            <h2 className="text-lg font-semibold text-white">
                                Unassign Asset
                            </h2>
                            <button
                                onClick={() => setIsUnassignModalOpen(false)}
                                className="text-white hover:text-gray-200"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to unassign this asset?
                            </p>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Asset:</span>
                                        <p className="text-sm text-gray-900 font-semibold">
                                            {asset.product} ({asset.taggingNo})
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Currently assigned to:</span>
                                        <p className="text-sm text-gray-900 font-semibold">
                                            {asset.assignedTo} ({asset.employeeId})
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
                                <p className="text-sm text-orange-800">
                                    <strong>Note:</strong> This will return the asset to stock (Active status).
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUnassignModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition border border-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmUnassign}
                                    disabled={unassigning}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {unassigning ? "Unassigning..." : "Confirm Unassign"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
