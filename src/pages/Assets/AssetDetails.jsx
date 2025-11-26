import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAssets, getAssetHistory } from "../../services/db";
import { ArrowLeft, Calendar, User, Building, Monitor } from "lucide-react";

export default function AssetDetails() {
    const { id } = useParams();
    const [asset, setAsset] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // In a real app, we'd have a getAssetById function, but for now we'll filter from all assets
                // or implement getAssetById in db.js. Let's assume we fetch all for now or I should add getAssetById.
                // Actually, let's add getAssetById to db.js first? 
                // For now, I'll just use getAssets and find.
                const assets = await getAssets();
                const foundAsset = assets.find(a => a.id === id);
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!asset) return <div className="p-8 text-center">Asset not found</div>;

    return (
        <div>
            <Link to="/assets" className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft size={20} />
                <span>Back to Assets</span>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Asset Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold">{asset.name}</h1>
                                <p className="text-gray-500">{asset.serialNumber}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${asset.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                                    asset.status === 'Available' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {asset.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                                <div className="flex items-center space-x-2">
                                    <Monitor size={18} className="text-gray-400" />
                                    <span>{asset.type}</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Purchase Date</h3>
                                <div className="flex items-center space-x-2">
                                    <Calendar size={18} className="text-gray-400" />
                                    <span>{asset.purchaseDate || 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Current Location</h3>
                                <div className="flex items-center space-x-2">
                                    <Building size={18} className="text-gray-400" />
                                    <span>{asset.company} - {asset.department}</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                                <div className="flex items-center space-x-2">
                                    <User size={18} className="text-gray-400" />
                                    <span>{asset.assignedTo || 'Unassigned'}</span>
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
                    <h2 className="text-lg font-bold mb-4">Transfer History</h2>
                    <div className="space-y-6">
                        {history.length === 0 ? (
                            <p className="text-gray-500 text-sm">No transfer history</p>
                        ) : (
                            history.map((record) => (
                                <div key={record.id} className="relative pl-6 border-l-2 border-gray-200 last:border-0 pb-6 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                                    <div className="mb-1">
                                        <span className="text-xs font-medium text-gray-500">
                                            {record.transferDate?.seconds ? new Date(record.transferDate.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium">
                                        Transferred to {record.toCompany} ({record.toDepartment})
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Assigned to: {record.assignedTo}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Reason: {record.reason}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
