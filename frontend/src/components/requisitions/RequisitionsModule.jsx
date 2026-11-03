import React, { useState } from 'react';
import RequisitionListTab from './tabs/RequisitionListTab';
import CreateRequisitionModal from './tabs/CreateRequisitionModal';
import RequisitionPrintModal from './tabs/RequisitionPrintModal';

export default function RequisitionsModule() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPrintReq, setSelectedPrintReq] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div key={refreshKey} className="min-h-screen bg-slate-900">
      <RequisitionListTab
        onOpenCreateModal={() => setIsCreateOpen(true)}
        onSelectPrint={(req) => setSelectedPrintReq(req)}
      />

      <CreateRequisitionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleSuccess}
      />

      <RequisitionPrintModal
        isOpen={!!selectedPrintReq}
        onClose={() => setSelectedPrintReq(null)}
        requisition={selectedPrintReq}
      />
    </div>
  );
}