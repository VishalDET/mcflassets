import { X, MapPin } from "lucide-react";

export default function ServiceCenterModal({ isOpen, onClose, brandName, location }) {
    if (!isOpen) return null;

    // Construct search query
    // If location is provided, search "Brand Service Center near Location"
    // Otherwise just "Brand Service Center"
    const query = location
        ? `${brandName} Service Center near ${location}`
        : `${brandName} Service Center`;

    const encodedQuery = encodeURIComponent(query);
    const mapUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="flex justify-between items-center bg-gray-900 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-white">
                        <MapPin size={20} className="text-blue-400" />
                        <h2 className="text-lg font-semibold">
                            Service Centers for {brandName}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 relative">
                    {!brandName ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Brand name is missing. Cannot find service centers.</p>
                        </div>
                    ) : (
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            marginHeight="0"
                            marginWidth="0"
                            src={mapUrl}
                            title="Service Center Map"
                            className="w-full h-full"
                        ></iframe>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white px-6 py-3 border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
                    <p>Showing results for: <span className="font-medium text-gray-900">{query}</span></p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
