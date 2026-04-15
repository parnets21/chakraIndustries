export default function SettingsPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Settings</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Settings</span></div>
        </div>
      </div>
      <div className="grid-2">
        {['Company Profile', 'User Management', 'Notifications', 'Integrations', 'Backup & Export', 'Audit Logs'].map(s => (
          <div key={s} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ fontWeight: 600 }}>{s}</span>
            <span style={{ color: '#718096', fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
