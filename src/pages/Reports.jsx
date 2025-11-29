import { useState, useEffect } from "react";
import { getAssets } from "../services/db";
import { useDatabase } from "../context/DatabaseContext";
import * as XLSX from "xlsx";
import { Download, Filter, RefreshCw } from "lucide-react";
import Loader from "../components/common/Loader";
import { toast } from "react-toastify";

export default function Reports() {
    const { companies } = useDatabase();
    const [assets, setAssets] = useState([]);
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    const [filters, setFilters] = useState({
        companyId: "",
        status: "",
        startDate: "",
        endDate: ""
    });

    useEffect(() => {
        fetchAssets();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [assets, filters]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const data = await getAssets();
            setAssets(data);
            setFilteredAssets(data);
        } catch (error) {
            console.error("Error fetching assets:", error);
            toast.error("Failed to fetch assets data");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...assets];

        // Filter by Company
        if (filters.companyId) {
            result = result.filter(asset => asset.companyId === filters.companyId);
        }

        // Filter by Status
        if (filters.status) {
            result = result.filter(asset => asset.status === filters.status);
        }

        // Filter by Date Range (Acquisition Date)
        if (filters.startDate) {
            result = result.filter(asset => new Date(asset.dateOfAcquisition) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            result = result.filter(asset => new Date(asset.dateOfAcquisition) <= new Date(filters.endDate));
        }

        setFilteredAssets(result);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            companyId: "",
            status: "",
            startDate: "",
            endDate: ""
        });
    };

    const exportToExcel = () => {
        try {
            setExporting(true);

            if (filteredAssets.length === 0) {
                toast.warning("No assets to export matching current filters");
                return;
            }

            // Prepare data for export
            const exportData = filteredAssets.map(asset => ({
                "URN": asset.urn || "",
                "Tagging No": asset.taggingNo || "",
                "Product Name": asset.product || "",
                "Product Code": asset.productCode || "",
                "Serial Number": asset.productSerialNumber || "",
                "Configuration": asset.config || "",
                "Company": asset.companyName || "",
                "Branch": asset.branch || "",
                "Location": asset.location || "",
                "Location Code": asset.locationCode || "",
                "Status": asset.status || "",
                "Date of Acquisition": asset.dateOfAcquisition || "",
                "Year": asset.yearOfAcquisition || "",
                "Purchased From": asset.purchasedFrom || "",
                "Warranty Expiry": asset.warrantyExpiry || "",
                "Assigned To": asset.assignedTo || "Unassigned",
                "Employee ID": asset.employeeId || "",
                "Assigned Date": asset.assignedDate || "",
                "Created At": asset.createdAt?.seconds ? new Date(asset.createdAt.seconds * 1000).toLocaleDateString() : ""
            }));

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-size columns (simple approximation)
            const wscols = Object.keys(exportData[0]).map(key => ({ wch: Math.max(key.length, 15) }));
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Assets Report");

            // Generate file name
            const fileName = `Assets_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Write file
            XLSX.writeFile(wb, fileName);
            toast.success("Report exported successfully");
        } catch (error) {
            console.error("Error exporting report:", error);
            toast.error("Failed to export report");
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Advanced Reports</h2>
                    <p className="text-gray-500 mt-1">Generate and export detailed asset reports.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Last updated: {new Date().toLocaleTimeString()}
                    </span>
                    <button
                        onClick={fetchAssets}
                        className="text-gray-500 hover:text-gray-800 transition p-2 rounded-full hover:bg-gray-100"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium">
                    <Filter size={20} />
                    <h3>Filter Options</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Company</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            value={filters.companyId}
                            onChange={(e) => handleFilterChange("companyId", e.target.value)}
                        >
                            <option value="">All Companies</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name} - {c.branch}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            value={filters.status}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="In Repair">In Repair</option>
                            <option value="Scrapped">Scrapped</option>
                            <option value="Assigned">Assigned</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Acquired From</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange("startDate", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Acquired To</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange("endDate", e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t pt-4">
                    <div className="text-sm text-gray-600">
                        Found <strong>{filteredAssets.length}</strong> records matching your filters.
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        >
                            Reset Filters
                        </button>
                        <button
                            onClick={exportToExcel}
                            disabled={exporting || filteredAssets.length === 0}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm transition"
                        >
                            <Download size={20} />
                            <span>{exporting ? "Exporting..." : "Export to Excel"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
