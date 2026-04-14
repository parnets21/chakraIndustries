import React, { useState } from 'react';
import MainLayout from './layout/MainLayout';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <MainLayout activePage={activePage} setActivePage={setActivePage}>
      <AppRoutes activePage={activePage} />
    </MainLayout>
  );
}
