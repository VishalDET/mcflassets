import React from 'react';

export default function Loader() {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-gray-600"></div>
                <img
                    src="../../public/niyantra_600x600.png"
                    className="absolute inset-0 m-auto h-12 w-12"
                    alt="Loading..."
                />
            </div>
        </div>
    );
}
