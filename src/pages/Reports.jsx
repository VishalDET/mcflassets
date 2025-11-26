import { useState } from "react";
import { getAssets } from "../services/db";
import { Download } from "lucide-react";

export default function Reports() {
    const [loading, setLoading] = useState(false);

    const downloadCSV = async () => {
        try {
            setLoading(true);
            const assets = await getAssets();

            if (assets.length === 0) {
                alert("No assets to export");
                return;
            }

            // Define headers
            const headers = ["Name", "Serial Number", "Type", "Status", "Company", "Department", "Assigned To", "Purchase Date", "Remarks"];

            // Convert data to CSV format
            const csvContent = [
                headers.join(","),
                ...assets.map(asset => [
                    `"${asset.name || ''}"`,
                    `"${asset.serialNumber || ''}"`,
                    `"${asset.type || ''}"`,
                    `"${asset.status || ''}"`,
                    `"${asset.company || ''}"`,
                    `"${asset.department || ''}"`,
                    `"${asset.assignedTo || ''}"`,
                    `"${asset.purchaseDate || ''}"`,
                    `"${asset.remarks || ''}"`
                ].join(","))
            ].join("\n");

            // Create download link
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `assets_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting CSV:", error);
            alert("Failed to export report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Reports</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Asset Inventory Report</h2>
                <p className="text-gray-600 mb-6">
                    Download a complete list of all assets including their current status, assignment details, and location.
                </p>

                <button
                    onClick={downloadCSV}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                    <Download size={20} />
                    <span>{loading ? "Generating..." : "Export to CSV"}</span>
                </button>
            </div>
        </div>
    );
}
