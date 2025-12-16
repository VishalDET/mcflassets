import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Package } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export default function AssetSummary({ assets }) {
    if (!assets || assets.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-100">
                <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500 font-medium">No assets assigned</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Serial</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{asset.product}</div>
                                <div className="text-xs text-gray-500">{asset.brandName}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-xs text-gray-900 font-mono">{asset.taggingNo || asset.urn}</div>
                                <div className="text-xs text-gray-500 font-mono">{asset.productSerialNumber}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(asset.assignedDate)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <Link
                                    to={`/assets/${asset.id}`}
                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                    target="_blank" // Optional: open in new tab to keep modal context? Maybe better to replace current view. Let's keep simpler.
                                >
                                    View
                                    <ExternalLink size={14} />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
