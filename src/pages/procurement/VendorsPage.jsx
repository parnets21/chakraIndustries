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
