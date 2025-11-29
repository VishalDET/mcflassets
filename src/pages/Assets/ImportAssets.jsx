import { useState } from "react";
import { useDatabase } from "../../context/DatabaseContext";
import { read, utils } from "xlsx";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { toast } from "react-toastify";
import { Upload, X, FileSpreadsheet } from "lucide-react";

export default function ImportAssets({ onClose, onImportSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const { companies } = useDatabase();

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const bstr = event.target.result;
            const wb = read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = utils.sheet_to_json(ws);
            setPreviewData(data);
        };
        reader.readAsBinaryString(file);
    };

    const processImport = async () => {
        if (previewData.length === 0) return;
        setUploading(true);

        let successCount = 0;
        let errorCount = 0;

        try {
            for (const row of previewData) {
                try {
                    // Map Excel columns to Firestore fields
                    // Adjust keys based on actual Excel headers
                    const assetData = {
                        urn: row["URN"] || "",
                        dateOfAcquisition: row["Date of Acquisition"] || "",
                        yearOfAcquisition: row["Year of Acquisition"] || "",
                        companyName: row["Company"] || "",
                        branch: row["Branch"] || "", // Assuming Branch is in Excel
                        location: row["Location"] || "",
                        locationCode: row["Location Code"] || "",
                        product: row["Product"] || "",
                        productCode: row["Product Code"] || "",
                        productSerialNumber: row["Product Serial Number"] || "",
                        config: row["Config"] || "", // Assuming Config column exists
                        taggingNo: row["Tagging No."] || "",
                        purchasedFrom: row["Purchased From"] || "",
                        warrantyExpiry: row["Warranty Expiry"] || "",
                        status: row["Status"] || "Active",
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    };

                    // Try to link to existing Company ID if possible
                    const companyMatch = companies.find(c =>
                        c.name?.toLowerCase() === assetData.companyName?.toLowerCase() &&
                        c.branch?.toLowerCase() === assetData.branch?.toLowerCase()
                    );

                    if (companyMatch) {
                        assetData.companyId = companyMatch.id;
                    }

                    await addDoc(collection(db, "assets"), assetData);
                    successCount++;
                } catch (err) {
                    console.error("Error importing row:", row, err);
                    errorCount++;
                }
            }

            toast.success(`Imported ${successCount} assets successfully.`);
            if (errorCount > 0) {
                toast.warning(`Failed to import ${errorCount} assets.`);
            }
            onImportSuccess();
            onClose();
        } catch (error) {
            console.error("Import failed:", error);
            toast.error("Critical error during import.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileSpreadsheet className="text-green-600" /> Import Assets from Excel
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload size={48} className="text-gray-400 mb-2" />
                            <span className="text-gray-600 font-medium">Click to upload Excel file</span>
                            <span className="text-sm text-gray-400 mt-1">Supported formats: .xlsx, .xls</span>
                        </label>
                    </div>

                    {previewData.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Preview ({previewData.length} rows)</h3>
                            <div className="bg-gray-50 rounded border border-gray-200 p-2 max-h-40 overflow-y-auto text-xs font-mono">
                                <pre>{JSON.stringify(previewData[0], null, 2)}</pre>
                                {previewData.length > 1 && <div className="text-center text-gray-400 mt-2">...and {previewData.length - 1} more</div>}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={processImport}
                            disabled={uploading || previewData.length === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {uploading ? "Importing..." : "Start Import"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
