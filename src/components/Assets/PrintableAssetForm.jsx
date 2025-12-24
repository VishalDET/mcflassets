import React from 'react';
import { formatDate } from '../../utils/dateUtils';

const PrintableAssetForm = React.forwardRef(({ asset, employee }, ref) => {
    if (!asset) return null;

    const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return (
        <div ref={ref} className="relative printable-form p-4 bg-white text-black font-sans max-w-[800px] mx-auto hidden print:block">
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.1] z-0 overflow-hidden">
                <img src="/favicon.ico" alt="Watermark" className="w-[100px] h-[100px] object-contain" />
            </div>

            {/* Header */}
            {/* <img src="/Niyantra.png" alt="" className='w-auto h-8' /> */}

            <div className="relative z-10 flex justify-between items-center border-b-2 border-gray-800 pb-2 mb-3">
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 leading-tight">
                        {asset.companyName || 'NIYANTRA - ASSET MANAGEMENT SYSTEM'}
                    </h3>
                    <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">IT DEPARTMENT</p>
                </div>

                <div className="text-right">
                    <div className="text-base text-sm font-bold text-gray-800 uppercase tracking-tight">Asset Handover Form</div>
                    <div className="space-y-0.5">
                        <p className="text-[11px] text-gray-600 font-medium">Form No: NTRA/URN/{asset.urn || 'NA'}</p>
                        <p className="text-[11px] text-gray-600">Date: {today}</p>
                    </div>
                </div>
            </div>

            {/* Employee Information */}
            <section className="mb-3">
                <h3 className="text-[11px] font-bold bg-gray-100 p-1.5 border border-gray-300 mb-2 uppercase tracking-wider">Employee Information</h3>
                <table className="w-full border-collapse border border-gray-300 text-[11px]">
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold w-1/4 bg-gray-50 uppercase text-[9px]">Employee Name</td>
                            <td className="border border-gray-300 p-1 w-1/4">{asset.assignedTo || '____________________'}</td>
                            <td className="border border-gray-300 p-1 font-semibold w-1/4 bg-gray-50 uppercase text-[9px]">Employee ID</td>
                            <td className="border border-gray-300 p-1 w-1/4">{asset.employeeId || '____________________'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Designation</td>
                            <td className="border border-gray-300 p-1">____________________</td>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Department</td>
                            <td className="border border-gray-300 p-1">____________________</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Date of Joining</td>
                            <td className="border border-gray-300 p-1">____________________</td>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Company</td>
                            <td className="border border-gray-300 p-1">{asset.companyName || '____________________'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Branch</td>
                            <td className="border border-gray-300 p-1">{asset.branch || '____________________'}</td>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Location</td>
                            <td className="border border-gray-300 p-1">{asset.location || '____________________'}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Asset Information */}
            <section className="mb-3">
                <h3 className="text-[11px] font-bold bg-gray-100 p-1.5 border border-gray-300 mb-2 uppercase tracking-wider">Asset Information</h3>
                <table className="w-full border-collapse border border-gray-300 text-[11px]">
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold w-1/4 bg-gray-50 uppercase text-[9px]">Asset Category</td>
                            <td className="border border-gray-300 p-1 w-1/4">{asset.product || '____________________'}</td>
                            <td className="border border-gray-300 p-1 font-semibold w-1/4 bg-gray-50 uppercase text-[9px]">Brand</td>
                            <td className="border border-gray-300 p-1 w-1/4">{asset.brandName || '____________________'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Model Name/No.</td>
                            <td className="border border-gray-300 p-1">{asset.model || '____________________'}</td>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Serial Number</td>
                            <td className="border border-gray-300 p-1">{asset.productSerialNumber || '____________________'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Configuration</td>
                            <td className="border border-gray-300 p-1 text-[10px]" colSpan="3">{asset.config || '____________________'}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Tagging Number</td>
                            <td className="border border-gray-300 p-1">{asset.taggingNo || '____________________'}</td>
                            <td className="border border-gray-300 p-1 font-semibold bg-gray-50 uppercase text-[9px]">Asset URN</td>
                            <td className="border border-gray-300 p-1 font-mono">{asset.urn || '____________________'}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Terms and Conditions */}
            <section className="mb-4">
                <h3 className="text-[11px] font-bold bg-gray-100 p-1.5 border border-gray-300 mb-2 uppercase tracking-wider">Terms and Conditions</h3>
                <div className="border border-gray-300 p-3 text-[9px] leading-relaxed text-gray-700 text-justify">
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>The asset is being issued for official company business only.</li>
                        <li>The employee is responsible for the physical security and proper maintenance of the asset.</li>
                        <li>In case of loss, theft, or damage due to negligence, the employee may be liable for the repair or replacement cost.</li>
                        <li>The asset must be returned to the IT/Admin department immediately upon resignation, termination, or as requested by the management.</li>
                        <li>No unauthorized software should be installed, and no hardware modifications should be made without prior approval.</li>
                        <li>The employee must report any technical issues or malfunctions to the IT department immediately.</li>
                        <li>The asset remains the sole property of the company at all times.</li>
                    </ol>
                </div>
            </section>

            {/* Signatures */}
            <section className="mt-8">
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center pt-4 border-t border-gray-400">
                        <p className="text-[10px] font-bold uppercase tracking-tight">Receiver's Signature</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">({asset.assignedTo || 'Employee Name'})</p>
                    </div>
                    <div className="text-center pt-4 border-t border-gray-400">
                        <p className="text-[10px] font-bold uppercase tracking-tight">Issuer's Signature</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">(IT/Admin Department)</p>
                    </div>
                    <div className="text-center pt-4 border-t border-gray-400">
                        <p className="text-[10px] font-bold uppercase tracking-tight">Approved By</p>
                        <p className="text-[9px] text-gray-500 mt-0.5">(Management)</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <div className="mt-6 pt-2 border-t border-gray-200 text-center flex items-center justify-center">
                <p className="text-[6px] text-gray-300 italic">This is a system-generated document. Niyantra - Asset Management System.</p>
            </div>
        </div>
    );
});

PrintableAssetForm.displayName = 'PrintableAssetForm';

export default PrintableAssetForm;
