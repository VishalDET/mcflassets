import { useState, useEffect } from "react";
import { useDatabase } from "../context/DatabaseContext";
import { Plus, Edit, Trash2, X, Eye, Upload, Download, FileSpreadsheet } from "lucide-react";
import Loader from "../components/common/Loader";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import AssetSummary from "../components/Assets/AssetSummary";

export default function EmployeeMaster() {
    const {
        employees, addEmployee, updateEmployee, deleteEmployee,
        companies, getBranches, getEmployeeAssets
    } = useDatabase();

    // State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [branches, setBranches] = useState([]);
    const [importPreview, setImportPreview] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [employeeAssets, setEmployeeAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCompanyId, setFilterCompanyId] = useState("");
    const [filterBranchId, setFilterBranchId] = useState("");
    const [filterBranches, setFilterBranches] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        employeeId: "",
        employeeName: "",
        companyId: "",
        companyName: "",
        branchId: "",
        branchName: "",
        contactEmail: "",
        contactNumber: ""
    });

    // Effect for Filter Branches
    useEffect(() => {
        if (filterCompanyId) {
            getBranches(filterCompanyId).then(setFilterBranches);
        } else {
            setFilterBranches([]);
            setFilterBranchId("");
        }
    }, [filterCompanyId]);

    // Derived State: Filtered Employees
    const filteredEmployees = employees.filter(employee => {
        const matchesSearch =
            employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.contactEmail && employee.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCompany = filterCompanyId ? employee.companyId === filterCompanyId : true;
        const matchesBranch = filterBranchId ? employee.branchId === filterBranchId : true;

        return matchesSearch && matchesCompany && matchesBranch;
    });

    // Handlers
    const handleCompanyChange = async (companyId) => {
        const company = companies.find(c => c.id === companyId);
        setFormData(prev => ({
            ...prev,
            companyId,
            companyName: company?.name || "",
            branchId: "",
            branchName: ""
        }));

        if (companyId) {
            const fetchedBranches = await getBranches(companyId);
            setBranches(fetchedBranches);
        } else {
            setBranches([]);
        }
    };

    const handleBranchChange = (branchId) => {
        const branch = branches.find(b => b.id === branchId);
        setFormData(prev => ({
            ...prev,
            branchId,
            branchName: branch?.name || ""
        }));
    };

    const handleOpenModal = async (employee = null) => {
        if (employee) {
            setEditingId(employee.id);
            setFormData({
                employeeId: employee.employeeId || "",
                employeeName: employee.employeeName || "",
                companyId: employee.companyId || "",
                companyName: employee.companyName || "",
                branchId: employee.branchId || "",
                branchName: employee.branchName || "",
                contactEmail: employee.contactEmail || "",
                contactNumber: employee.contactNumber || ""
            });
            if (employee.companyId) {
                const fetchedBranches = await getBranches(employee.companyId);
                setBranches(fetchedBranches);
            }
        } else {
            setEditingId(null);
            setFormData({
                employeeId: "",
                employeeName: "",
                companyId: "",
                companyName: "",
                branchId: "",
                branchName: "",
                contactEmail: "",
                contactNumber: ""
            });
            setBranches([]);
        }
        setIsModalOpen(true);
    };

    const handleView = async (employee) => { // Renamed from handleOpenViewModal to handleView
        setCurrentEmployee(employee);
        setIsViewModalOpen(true);
        setEmployeeAssets([]); // Clear previous assets
        setLoadingAssets(true); // Start loading

        try {
            // Check if we have an Employee ID to search by
            if (employee.employeeId) {
                const assets = await getEmployeeAssets(employee.employeeId);
                setEmployeeAssets(assets);
            }
        } catch (error) {
            console.error("Failed to fetch employee assets:", error);
            toast.error("Failed to load employee assets");
        } finally {
            setLoadingAssets(false); // End loading
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateEmployee(editingId, formData);
            } else {
                await addEmployee(formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving employee:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this employee?")) {
            await deleteEmployee(id);
        }
    };

    // Import Handlers
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "Employee Name": "John Doe",
                "Employee ID": "EMP001",
                "Company Name": "My Company",
                "Branch Name": "Main Branch",
                "Contact Email": "john@example.com",
                "Contact Number": "1234567890"
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Employee_Import_Template.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setImportPreview(data);
        };
        reader.readAsBinaryString(file);
    };

    const processImport = async () => {
        if (importPreview.length === 0) {
            toast.warning("No data to import");
            return;
        }

        setIsImporting(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            for (const row of importPreview) {
                if (!row["Employee Name"] || !row["Employee ID"] || !row["Company Name"]) {
                    errorCount++;
                    continue;
                }

                const company = companies.find(c => c.name.toLowerCase() === row["Company Name"].toString().toLowerCase());
                if (!company) {
                    errorCount++;
                    continue;
                }

                let branchId = "";
                let branchName = "";
                if (row["Branch Name"]) {
                    // Try to finding branch (simplified)
                    // Note: In a real simplified import, we might skip fetching if not critical, 
                    // but we need IDs. 
                    // Let's do a best effort fetch on demand or skip if too slow. 
                    // Given this runs on client, sequential await is fine for small batches.
                    try {
                        const companyBranches = await getBranches(company.id);
                        const branch = companyBranches.find(b => b.name.toLowerCase() === row["Branch Name"].toString().toLowerCase());
                        if (branch) {
                            branchId = branch.id;
                            branchName = branch.name;
                        }
                    } catch (err) {
                        console.warn("Error fetching branches during import", err);
                    }
                }

                const newEmployee = {
                    employeeName: row["Employee Name"],
                    employeeId: row["Employee ID"],
                    companyId: company.id,
                    companyName: company.name,
                    branchId: branchId,
                    branchName: branchName,
                    contactEmail: row["Contact Email"] || "",
                    contactNumber: row["Contact Number"] || ""
                };

                await addEmployee(newEmployee);
                successCount++;
            }
            toast.success(`Imported ${successCount} employees. ${errorCount} failed/skipped.`);
            setIsImportModalOpen(false);
            setImportPreview([]);
        } catch (error) {
            console.error("Import failed", error);
            toast.error("Import failed");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="p-0">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Employee Master</h2>
                    <p className="text-gray-500 mt-1">Manage employee records and assignments.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200 flex items-center">
                        Total: {filteredEmployees.length}
                    </span>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition shadow-sm"
                    >
                        <Upload size={20} /> Import
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
                    >
                        <Plus size={20} /> Add Employee
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex flex-col md:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search by Name, ID, or Email..."
                    className="w-full md:w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="w-full md:w-1/4 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={filterCompanyId}
                    onChange={(e) => setFilterCompanyId(e.target.value)}
                >
                    <option value="">All Companies</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <select
                    className="w-full md:w-1/4 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={filterBranchId}
                    onChange={(e) => setFilterBranchId(e.target.value)}
                    disabled={!filterCompanyId}
                >
                    <option value="">All Branches</option>
                    {filterBranches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-w-full">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider w-16">S.No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Employee ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-100 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No employees found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee, index) => (
                                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employee.employeeId || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{employee.employeeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span>{employee.companyName}</span>
                                                {employee.branchName && (
                                                    <span className="text-xs text-gray-400">{employee.branchName}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span>{employee.contactEmail || '-'}</span>
                                                <span className="text-xs text-gray-400">{employee.contactNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => handleView(employee)}
                                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenModal(employee)}
                                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center bg-gray-900 p-4 rounded-t-lg">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileSpreadsheet size={20} /> Import Employees
                            </h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                <p className="font-semibold mb-1">Instructions:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Download the template first.</li>
                                    <li>Fill in the details. <strong>Company Name</strong> must match exactly.</li>
                                    <li>Upload the filled Excel/CSV file.</li>
                                </ul>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 text-sm border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                                >
                                    <Download size={16} /> Download Template
                                </button>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-gray-50 file:text-gray-700
                                    hover:file:bg-gray-100
                                    cursor-pointer border border-gray-300 rounded-lg p-1"
                                />
                            </div>

                            {importPreview.length > 0 && (
                                <div className="text-sm text-gray-600">
                                    <p>Ready to import <strong>{importPreview.length}</strong> records.</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processImport}
                                    disabled={importPreview.length === 0 || isImporting}
                                    className={`px-4 py-2 rounded-lg text-white transition flex items-center gap-2 shadow-sm
                                        ${importPreview.length === 0 || isImporting
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isImporting ? 'Importing...' : 'Start Import'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center bg-gray-900 p-4 rounded-t-lg">
                            <h2 className="text-lg font-semibold text-white">
                                {editingId ? "Edit Employee" : "Add Employee"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                                    <select
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white"
                                        value={formData.companyId}
                                        onChange={(e) => handleCompanyChange(e.target.value)}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 bg-white"
                                        value={formData.branchId}
                                        onChange={(e) => handleBranchChange(e.target.value)}
                                        disabled={!formData.companyId}
                                    >
                                        <option value="">Select Branch (Optional)</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                        value={formData.employeeName}
                                        onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                        value={formData.employeeId}
                                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        placeholder="e.g. EMP001"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                    <input
                                        type="tel"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800 transition"
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm"
                                >
                                    {editingId ? "Update Employee" : "Add Employee"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewModalOpen && currentEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden animate-fade-in-up">
                        <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800">
                                {currentEmployee.employeeName}
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employee ID</label>
                                <p className="text-gray-900 font-medium bg-gray-50 p-2 rounded border border-gray-100">{currentEmployee.employeeId || "N/A"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company</label>
                                    <p className="text-gray-900">{currentEmployee.companyName || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Branch</label>
                                    <p className="text-gray-900">{currentEmployee.branchName || "-"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                                    <p className="text-gray-900 break-all">{currentEmployee.contactEmail || "-"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Contact Number</label>
                                        <p className="mt-1 text-gray-900">{currentEmployee.contactNumber || "-"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Joined Date</label>
                                        <p className="mt-1 text-gray-900">{new Date().toLocaleDateString()}</p>
                                        {/* Placeholder for joined date if not available in schema yet */}
                                    </div>
                                </div>
                            </div>

                            {/* Asset Summary Section */}
                            <div className="pt-6 mt-6 border-t border-gray-100">
                                <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 p-1 rounded-md text-xs">
                                        {employeeAssets.length}
                                    </span>
                                    Assigned Assets
                                </h3>

                                {loadingAssets ? (
                                    <div className="text-center py-4 text-gray-500 text-sm animate-pulse">
                                        Loading assets...
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                        <AssetSummary assets={employeeAssets} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    handleOpenModal(currentEmployee);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
