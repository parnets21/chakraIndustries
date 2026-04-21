import { useState } from 'react';
import Modal from '../../components/common/Modal';
import RolePermissionsPage from './RolePermissionsPage';
import { useAuth } from '../../auth/AuthContext';

const sections = [
  { key: 'company',  label: 'Company Profile',  icon: '🏢', desc: 'Business name, address, GST, logo' },
  { key: 'users',    label: 'User Management',   icon: '👥', desc: 'Manage user accounts and departments' },
  { key: 'roles',    label: 'Role Permissions',  icon: '🔐', desc: 'Control which role can access which module' },
  { key: 'notif',    label: 'Notifications',     icon: '🔔', desc: 'Email, SMS, in-app alert settings' },
  { key: 'integr',   label: 'Integrations',      icon: '🔗', desc: 'Tally, courier APIs, payment gateways' },
  { key: 'backup',   label: 'Backup & Export',   icon: '💾', desc: 'Data backup, export to Excel/PDF' },
  { key: 'audit',    label: 'Audit Logs',        icon: '📋', desc: 'User activity and change history' },
];

const auditLogs = [
  { user: 'Arjun Kumar', action: 'Created PO-2024-089', module: 'Procurement', time: '14 Apr, 10:32 AM', ip: '192.168.1.10' },
  { user: 'Priya Nair',  action: 'Approved PR-2024-034', module: 'Procurement', time: '14 Apr, 09:15 AM', ip: '192.168.1.14' },
  { user: 'Ravi Sharma', action: 'Updated BOM-001', module: 'Production', time: '13 Apr, 04:45 PM', ip: '192.168.1.22' },
  { user: 'Meena Joshi', action: 'Exported Finance Report', module: 'Finance', time: '13 Apr, 02:10 PM', ip: '192.168.1.18' },
];

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]";
const selectCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]";
const labelCls = "text-xs font-semibold text-gray-600";
const fieldCls = "flex flex-col gap-1.5 mb-4";
const thCls = "bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap";
const tdCls = "px-4 py-3 text-gray-800 align-middle";
const trCls = "border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors";
const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]";
const btnOutline = "inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]";
const btnSm = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]";

export default function SettingsPage() {
  const [openSection, setOpenSection] = useState(null);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div>
      {/* Role Permissions — full inline panel for Super Admin */}
      {openSection === 'roles' ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <button
              onClick={() => setOpenSection(null)}
              className="text-gray-400 hover:text-red-600 transition-colors text-sm font-semibold flex items-center gap-1"
            >
              ← Back to Settings
            </button>
          </div>
          <RolePermissionsPage />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(s => {
            const isRoles = s.key === 'roles';
            const locked = isRoles && !isSuperAdmin;
            return (
              <div key={s.key}
                className={`bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4 transition-all
                  ${locked ? 'opacity-50 cursor-not-allowed border-gray-200' : 'cursor-pointer hover:border-red-500 hover:-translate-y-0.5 border-gray-200'}`}
                onClick={() => !locked && setOpenSection(s.key)}
                title={locked ? 'Only Super Admin can manage role permissions' : undefined}
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[22px] flex-shrink-0">{s.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                    {s.label}
                    {isRoles && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Super Admin Only
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                </div>
                {!locked && <span className="text-red-600 text-xl font-light">›</span>}
                {locked && <span className="text-gray-300 text-xl">🔒</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals for other sections */}

      {/* Company Profile Modal */}
      <Modal open={openSection === 'company'} onClose={() => setOpenSection(null)} title="Company Profile"
        footer={<><button className={btnOutline} onClick={() => setOpenSection(null)}>Cancel</button><button className={btnPrimary} onClick={() => setOpenSection(null)}>Save Changes</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className={fieldCls}><label className={labelCls}>Company Name *</label><input className={inputCls} defaultValue="Chakra Industries Pvt Ltd" /></div>
          <div className={fieldCls}><label className={labelCls}>GST Number</label><input className={inputCls} defaultValue="27AABCC1234D1Z5" /></div>
          <div className={fieldCls}><label className={labelCls}>PAN Number</label><input className={inputCls} defaultValue="AABCC1234D" /></div>
          <div className={fieldCls}><label className={labelCls}>Phone</label><input className={inputCls} defaultValue="+91 98765 43210" /></div>
          <div className={fieldCls}><label className={labelCls}>Email</label><input type="email" className={inputCls} defaultValue="info@chakraindustries.in" /></div>
          <div className={fieldCls}><label className={labelCls}>Website</label><input className={inputCls} defaultValue="www.chakraindustries.in" /></div>
          <div className={`${fieldCls} col-span-2`}><label className={labelCls}>Registered Address</label><textarea className={inputCls} defaultValue="Plot 42, MIDC Industrial Area, Nashik - 422010, Maharashtra" /></div>
          <div className={fieldCls}><label className={labelCls}>Financial Year Start</label><select className={selectCls}><option>April</option><option>January</option></select></div>
          <div className={fieldCls}><label className={labelCls}>Currency</label><select className={selectCls}><option>INR (₹)</option><option>USD ($)</option></select></div>
        </div>
      </Modal>

      {/* User Management Modal */}
      <Modal open={openSection === 'users'} onClose={() => setOpenSection(null)} title="User Management" size="lg"
        footer={<><button className={btnOutline} onClick={() => setOpenSection(null)}>Close</button><button className={btnPrimary}>+ Add User</button></>}>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead><tr>{['Name','Email','Role','Department','Status','Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                { name: 'Arjun Kumar', email: 'arjun@chakra.in', role: 'Administrator', dept: 'Management', status: 'Active' },
                { name: 'Priya Nair', email: 'priya@chakra.in', role: 'Purchase Manager', dept: 'Procurement', status: 'Active' },
                { name: 'Ravi Sharma', email: 'ravi@chakra.in', role: 'Production Head', dept: 'Production', status: 'Active' },
                { name: 'Meena Joshi', email: 'meena@chakra.in', role: 'Finance Manager', dept: 'Finance', status: 'Active' },
                { name: 'Suresh Rao', email: 'suresh@chakra.in', role: 'Warehouse Manager', dept: 'Inventory', status: 'Inactive' },
              ].map((u, i) => (
                <tr key={i} className={trCls}>
                  <td className={`${tdCls} font-semibold`}>{u.name}</td>
                  <td className={`${tdCls} text-gray-400 text-xs`}>{u.email}</td>
                  <td className={tdCls}>{u.role}</td>
                  <td className={tdCls}>{u.dept}</td>
                  <td className={tdCls}>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.status}</span>
                  </td>
                  <td className={tdCls}><button className={btnSm}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Notifications Modal */}
      <Modal open={openSection === 'notif'} onClose={() => setOpenSection(null)} title="Notification Settings"
        footer={<><button className={btnOutline} onClick={() => setOpenSection(null)}>Cancel</button><button className={btnPrimary} onClick={() => setOpenSection(null)}>Save</button></>}>
        {[
          { label: 'Low Stock Alerts', desc: 'Notify when stock falls below minimum level' },
          { label: 'PO Approval Requests', desc: 'Notify approvers when a PO is raised' },
          { label: 'GRN Received', desc: 'Notify purchase team on GRN completion' },
          { label: 'Production Completion', desc: 'Notify on work order completion' },
          { label: 'Payment Due Reminders', desc: 'Remind finance team of upcoming payments' },
          { label: 'Return Requests', desc: 'Notify on new customer return requests' },
        ].map((n, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <div className="font-semibold text-[13px] text-gray-800">{n.label}</div>
              <div className="text-[11px] text-gray-400">{n.desc}</div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-red-700" />
            </label>
          </div>
        ))}
      </Modal>

      {/* Integrations Modal */}
      <Modal open={openSection === 'integr'} onClose={() => setOpenSection(null)} title="Integrations"
        footer={<button className={btnOutline} onClick={() => setOpenSection(null)}>Close</button>}>
        {[
          { name: 'Tally ERP', status: 'Connected', icon: '📊', desc: 'Finance data sync with Tally Prime' },
          { name: 'BlueDart API', status: 'Connected', icon: '🚚', desc: 'Courier tracking & AWB generation' },
          { name: 'DTDC API', status: 'Disconnected', icon: '📦', desc: 'Courier integration for shipments' },
          { name: 'Razorpay', status: 'Disconnected', icon: '💳', desc: 'Payment gateway for online collections' },
        ].map((intg, i) => (
          <div key={i} className="flex items-center gap-3.5 py-3.5 border-b border-gray-50">
            <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-[22px]">{intg.icon}</div>
            <div className="flex-1">
              <div className="font-bold text-[13px] text-gray-800">{intg.name}</div>
              <div className="text-[11px] text-gray-400">{intg.desc}</div>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${intg.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{intg.status}</span>
            <button className={btnSm}>{intg.status === 'Connected' ? 'Configure' : 'Connect'}</button>
          </div>
        ))}
      </Modal>

      {/* Backup Modal */}
      <Modal open={openSection === 'backup'} onClose={() => setOpenSection(null)} title="Backup & Export"
        footer={<button className={btnOutline} onClick={() => setOpenSection(null)}>Close</button>}>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Export All Data (Excel)', icon: '📊', color: 'text-green-600' },
            { label: 'Export All Data (PDF)', icon: '📄', color: 'text-red-600' },
            { label: 'Download Database Backup', icon: '💾', color: 'text-blue-600' },
            { label: 'Schedule Auto Backup', icon: '⏰', color: 'text-amber-500' },
          ].map((b, i) => (
            <button key={i} className="inline-flex items-center gap-3 px-4 py-3.5 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">
              <span className="text-xl">{b.icon}</span>
              <span className={`font-semibold ${b.color}`}>{b.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Audit Logs Modal */}
      <Modal open={openSection === 'audit'} onClose={() => setOpenSection(null)} title="Audit Logs" size="lg"
        footer={<><button className={btnOutline} onClick={() => setOpenSection(null)}>Close</button><button className={btnPrimary}>Export Logs</button></>}>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead><tr>{['User','Action','Module','Time','IP Address'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {auditLogs.map((log, i) => (
                <tr key={i} className={trCls}>
                  <td className={`${tdCls} font-semibold`}>{log.user}</td>
                  <td className={tdCls}>{log.action}</td>
                  <td className={tdCls}><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{log.module}</span></td>
                  <td className={`${tdCls} text-gray-400 text-xs`}>{log.time}</td>
                  <td className={`${tdCls} font-mono text-xs`}>{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
