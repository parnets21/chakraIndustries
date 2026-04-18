import { useState } from 'react';
import { defaultCategories } from './components/data';
import VendorsTab from './components/VendorsTab';

export default function VendorsPage() {
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Vendor Onboarding & Categorization</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Procurement</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Vendors</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]"
            onClick={() => setShowCategoryModal(true)}>⚙ Categories</button>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]"
            onClick={() => setShowVendorModal(true)}>+ Add Vendor</button>
        </div>
      </div>
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
    </div>
  );
}
