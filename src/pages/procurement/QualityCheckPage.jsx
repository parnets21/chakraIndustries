import { useState } from 'react';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import QCTab from './components/QCTab';
import { MdVerifiedUser, MdCheckCircle, MdCancel, MdHourglassEmpty } from 'react-icons/md';
import { qcApi } from '../../api/qualityCheckApi';

export default function QualityCheckPage() {
  const [stats, setStats] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const loadStats = async () => {
    try {
      const res = await qcApi.getStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useState(() => {
    loadStats();
  }, [refresh]);

  const kpis = [
    { label: 'Total Inspections', value: stats?.total || 0, icon: <MdVerifiedUser size={18} />, color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Approved', value: stats?.approved || 0, icon: <MdCheckCircle size={18} />, color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Rejected', value: stats?.rejected || 0, icon: <MdCancel size={18} />, color: '#dc2626', color2: '#ef4444', glow: 'rgba(220,38,38,0.3)' },
    { label: 'Pending', value: stats?.pending || 0, icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
  ];

  return (
    <div>
      <PageHeader title="Quality Check" breadcrumb="Procurement › Quality Check" />

      <KpiStrip kpis={kpis} />

      <PageCard>
        <QCTab onSaved={() => setRefresh(r => r + 1)} />
      </PageCard>
    </div>
  );
}
