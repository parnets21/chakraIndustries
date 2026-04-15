import { useState } from 'react';
import { defaultCategories } from './components/data';
import VendorsTab from './components/VendorsTab';
import RFQTab from './components/RFQTab';
import PurchaseRequisitionTab from './components/PurchaseRequisitionTab';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';
import GRNTab from './components/GRNTab';
import QualityCheckTab from './components/QualityCheckTab';

const tabs = ['Vendors', 'RFQ', 'Purchase Requisition', 'Purchase Orders', 'GRN', 'Quality Check'];

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Procurement</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Procurement</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowCategoryModal(true)}>⚙ Categories</button>
          <button className="btn btn-outline" onClick={() => setShowVendorModal(true)}>+ Add Vendor</button>
          <button className="btn btn-primary" onClick={() => setShowPOModal(true)}>+ New PO</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t, i) => (
          <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {activeTab === 0 && (
        <VendorsTab
          categories={categories}
          setCategories={setCategories}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          showVendorModal={showVendorModal}
          setShowVendorModal={setShowVendorModal}
          showCategoryModal={showCategoryModal}
          setShowCategoryModal={setShowCategoryModal}
        />
      )}
      {activeTab === 1 && <RFQTab />}
      {activeTab === 2 && <PurchaseRequisitionTab />}
      {activeTab === 3 && <PurchaseOrdersTab showPOModal={showPOModal} setShowPOModal={setShowPOModal} />}
      {activeTab === 4 && <GRNTab />}
      {activeTab === 5 && <QualityCheckTab />}
    </div>
  );
}
