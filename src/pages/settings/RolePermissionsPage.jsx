import { useState } from 'react';
import { MdLock, MdRefresh, MdSave, MdCheckCircle, MdVisibility, MdBlock } from 'react-icons/md';
import {
  ROLES, ROLE_KEYS, NAV_ITEMS,
  loadPageAccess, savePageAccess, resetPageAccess,
} from '../../auth/rbac';

// Page labels with section grouping from NAV_ITEMS
const PAGE_GROUPS = (() => {
  const groups = [];
  let current = null;
  for (const item of NAV_ITEMS) {
    if (item.section) { current = { section: item.section, pages: [] }; groups.push(current); }
    else if (current) current.pages.push({ page: item.page, label: item.label });
  }
  return groups;
})();

const ACCESS_CYCLE = [false, 'view', 'full']; // clicking cycles through these

const ACCESS_CONFIG = {
  full: {
    label: 'Full',
    icon: <MdCheckCircle size={13} />,
    bg: '#dcfce7', color: '#16a34a', border: '#86efac',
  },
  view: {
    label: 'View',
    icon: <MdVisibility size={13} />,
    bg: '#eff6ff', color: '#2563eb', border: '#93c5fd',
  },
  false: {
    label: 'None',
    icon: <MdBlock size={13} />,
    bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0',
  },
};

// Non-super-admin roles shown in columns
const EDITABLE_ROLES = ROLE_KEYS.filter(r => r !== 'super_admin');

function AccessBadge({ value, onClick, locked }) {
  const cfg = ACCESS_CONFIG[String(value)] ?? ACCESS_CONFIG.false;
  return (
    <button
      onClick={locked ? undefined : onClick}
      title={locked ? 'Super Admin always has full access' : `Click to change: ${cfg.label}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 20,
        background: cfg.bg, color: cfg.color,
        border: `1.5px solid ${cfg.border}`,
        fontSize: 11, fontWeight: 700,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.7 : 1,
        transition: 'transform 0.1s, box-shadow 0.1s',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
        minWidth: 68, justifyContent: 'center',
      }}
      onMouseEnter={e => { if (!locked) { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {cfg.icon} {cfg.label}
    </button>
  );
}

export default function RolePermissionsPage({ onClose }) {
  const [matrix, setMatrix] = useState(() => loadPageAccess());
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const cycleAccess = (page, role) => {
    if (role === 'super_admin') return;
    const current = matrix[page]?.[role] ?? false;
    const idx = ACCESS_CYCLE.indexOf(current);
    const next = ACCESS_CYCLE[(idx + 1) % ACCESS_CYCLE.length];
    setMatrix(prev => ({
      ...prev,
      [page]: { ...prev[page], [role]: next },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    savePageAccess(matrix);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    const fresh = resetPageAccess();
    setMatrix(fresh);
    setConfirmReset(false);
    setSaved(false);
  };

  // Column access summary counts
  const summary = (role) => {
    const pages = Object.keys(matrix).filter(p => p !== 'settings');
    const full = pages.filter(p => matrix[p][role] === 'full').length;
    const view = pages.filter(p => matrix[p][role] === 'view').length;
    const none = pages.filter(p => !matrix[p][role]).length;
    return { full, view, none };
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1c2833' }}>Role Permissions Matrix</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            Click any badge to cycle: <span style={{ color: '#16a34a', fontWeight: 700 }}>Full</span> → <span style={{ color: '#2563eb', fontWeight: 700 }}>View</span> → <span style={{ color: '#94a3b8', fontWeight: 700 }}>None</span>. Super Admin is always locked to Full.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1.5px solid ${confirmReset ? '#ef4444' : '#e2e8f0'}`,
              background: confirmReset ? '#fef2f2' : '#fff',
              color: confirmReset ? '#ef4444' : '#64748b',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <MdRefresh size={15} />
            {confirmReset ? 'Confirm Reset?' : 'Reset to Default'}
          </button>
          {confirmReset && (
            <button onClick={() => setConfirmReset(false)} style={{
              padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancel</button>
          )}
          <button
            onClick={handleSave}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: saved ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#b91c1c)',
              color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              transition: 'background 0.3s',
            }}
          >
            {saved ? <><MdCheckCircle size={15} /> Saved!</> : <><MdSave size={15} /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(ACCESS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: cfg.color, fontWeight: 600 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.bg, border: `1.5px solid ${cfg.border}` }} />
            {cfg.label} {key === 'full' ? '— Create, Edit, Delete, View' : key === 'view' ? '— Read only, no edits' : '— Hidden from sidebar'}
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase', width: 160, position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2 }}>
                Module
              </th>
              {/* Super Admin locked column */}
              <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', minWidth: 110 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MdLock size={11} style={{ color: '#c0392b' }} />
                    <span style={{ color: '#c0392b' }}>Super Admin</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 500 }}>Always Full</div>
                </div>
              </th>
              {EDITABLE_ROLES.map(role => {
                const s = summary(role);
                return (
                  <th key={role} style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#374151', letterSpacing: '0.5px', minWidth: 110 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span>{ROLES[role]}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 9, background: '#dcfce7', color: '#16a34a', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>{s.full}F</span>
                        <span style={{ fontSize: 9, background: '#eff6ff', color: '#2563eb', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>{s.view}V</span>
                        <span style={{ fontSize: 9, background: '#f1f5f9', color: '#94a3b8', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>{s.none}N</span>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PAGE_GROUPS.map(group => (
              <>
                {/* Section header row */}
                <tr key={group.section} style={{ background: '#fafafa' }}>
                  <td colSpan={2 + EDITABLE_ROLES.length} style={{
                    padding: '8px 16px',
                    fontSize: 9, fontWeight: 800, letterSpacing: '1.8px',
                    textTransform: 'uppercase', color: '#94a3b8',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    {group.section}
                  </td>
                </tr>
                {group.pages.map((pg, i) => (
                  <tr key={pg.page} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: i % 2 === 0 ? '#fff' : '#fafcff',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef9f9'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafcff'}
                  >
                    {/* Module name */}
                    <td style={{
                      padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b',
                      position: 'sticky', left: 0, background: 'inherit', zIndex: 1,
                    }}>
                      {pg.label}
                    </td>
                    {/* Super Admin — always full, locked */}
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <AccessBadge value="full" locked />
                    </td>
                    {/* Editable roles */}
                    {EDITABLE_ROLES.map(role => (
                      <td key={role} style={{ padding: '10px', textAlign: 'center' }}>
                        <AccessBadge
                          value={matrix[pg.page]?.[role] ?? false}
                          onClick={() => cycleAccess(pg.page, role)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>
        Changes take effect immediately after saving. Users must re-login or refresh to see updated sidebar.
      </div>
    </div>
  );
}
