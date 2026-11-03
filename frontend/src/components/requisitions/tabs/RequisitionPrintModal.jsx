import React from 'react';

export default function RequisitionPrintModal({ isOpen, onClose, requisition }) {
  if (!isOpen || !requisition) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStageBadgeDetails = (status) => {
    switch (status) {
      case 'IN_STOCK_DISPATCHED':
        return { label: 'FULFILLED: DISPATCHED FROM CENTRAL STOCK', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'PO_ISSUED':
        return { label: 'EXTERNAL PROCUREMENT: PURCHASE ORDER (PO) GIVEN', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'APPROVED':
        return { label: 'APPROVED - AWAITING FULFILLMENT STAGE', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'REJECTED':
        return { label: 'REJECTED', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: 'PENDING REVIEW & AUTHORIZATION', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const stage = getStageBadgeDetails(requisition.status);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl print:shadow-none print:w-full print:m-0">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold">Official Requisition Voucher & Stage Report</h3>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition cursor-pointer"
            >
              Print / Save PDF Report
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl cursor-pointer">&times;</button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start border-b border-slate-300 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">AMICO LABORATORIES LTD.</h1>
              <p className="text-xs text-slate-500">Pharmaceutical Enterprise & cGMP Operational Command</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-indigo-600">{requisition.reqNumber}</h2>
              <p className="text-xs text-slate-500">Request Date: {requisition.requestDate}</p>
            </div>
          </div>

          {/* Current Workflow Stage Banner */}
          <div className={`p-4 rounded-xl border flex flex-col gap-1 ${stage.color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Current Operational Stage / Fulfillment Status:</span>
            <span className="text-sm font-black tracking-wide">{stage.label}</span>
            <span className="text-[11px] font-mono mt-1">Last Updated Timestamp: {new Date(requisition.updatedAt || requisition.createdAt).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="font-semibold text-slate-600">Center / Location:</span>
              <p className="font-medium text-slate-900">{requisition.locationType}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Department:</span>
              <p className="font-medium text-slate-900">{requisition.department}</p>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-slate-600">Purpose & Operational Remarks:</span>
              <p className="font-medium text-slate-900">{requisition.purposeRemarks || 'None specified'}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-3">SL</th>
                <th className="p-3">Item Code / Category</th>
                <th className="p-3">Material / Item Description</th>
                <th className="p-3 text-center">Requested Qty</th>
                <th className="p-3">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {requisition.items && requisition.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 text-slate-500">{idx + 1}</td>
                  <td className="p-3 font-mono text-xs text-slate-700">
                    <p>{item.materialCode || 'N/A'}</p>
                    <p className="text-[10px] text-slate-400">{item.category}</p>
                  </td>
                  <td className="p-3 font-medium text-slate-900">{item.materialName}</td>
                  <td className="p-3 text-center font-bold text-slate-900">{item.requestedQty}</td>
                  <td className="p-3 text-slate-600">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-16 grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2">Requested By (Department Head)</div>
            <div className="border-t border-slate-400 pt-2">Verified By (Store / Inventory)</div>
            <div className="border-t border-slate-400 pt-2">Authorized Signatory (Plant / HO)</div>
          </div>
        </div>
      </div>
    </div>
  );
}