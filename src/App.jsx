import { useState } from 'react';
import MainLayout from './layout/MainLayout';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeModal, setActiveModal] = useState(null);

  const openModal  = (modal) => setActiveModal(modal);
  const closeModal = ()      => setActiveModal(null);

  return (
    <MainLayout activePage={activePage} setActivePage={(page) => { setActivePage(page); setActiveModal(null); }}>
      <AppRoutes
        activePage={activePage}
        activeModal={activeModal}
        openModal={openModal}
        closeModal={closeModal}
      />
    </MainLayout>
  );
}
