import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin, Building, FileText } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { formatDate } from '../../utils/dateUtils';
import Loader from '../common/Loader';

export default function AssignmentDetailsModal({ asset, onClose }) {
    const [transfer, setTransfer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssignmentDetails = async () => {
            if (!asset?.id) {
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, "transfers"),
                    where("assetId", "==", asset.id),
                    orderBy("transferDate", "desc"),
                    limit(1)
                );

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setTransfer(querySnapshot.docs[0].data());
                } else if (asset.status === 'Assigned' && asset.assignedTo) {
                    // Fallback for imported assets that have assignment data but no transfer history
                    setTransfer({
                        assignedTo: asset.assignedTo,
                        employeeId: asset.employeeId,
                        toCompany: asset.companyName,
                        toBranch: asset.branch,
                        toLocation: asset.location,
                        assignedDate: asset.assignedDate || null,
                        reason: "Initial Import Assignment"
                    });
                } else {
                    setError("No assignment records found.");
                }
            } catch (err) {
                console.error("Error fetching assignment details:", err);
                setError("Failed to load assignment details.");
            } finally {
                setLoading(false);
            }
        };

        fetchAssignmentDetails();
    }, [asset]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in relative">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Assignment Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-6 text-gray-500">
                            <p>{error}</p>
                        </div>
                    ) : transfer ? (
                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned To</p>
                                    <p className="text-base font-medium text-gray-900">{transfer.assignedTo || "N/A"}</p>
                                    <p className="text-xs text-gray-500">ID: {transfer.employeeId || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Building size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Company</p>
                                    <p className="text-base font-medium text-gray-900">{transfer.toCompany || "N/A"}</p>
                                    {transfer.toBranch && <p className="text-xs text-gray-500">{transfer.toBranch}</p>}
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                                    <p className="text-base font-medium text-gray-900">{transfer.toLocation || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignment Date</p>
                                    <p className="text-base font-medium text-gray-900">{formatDate(transfer.assignedDate || transfer.transferDate)}</p>
                                </div>
                            </div>

                            {transfer.reason && (
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason / Remarks</p>
                                        <p className="text-sm text-gray-700 mt-1">{transfer.reason}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : null}
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
