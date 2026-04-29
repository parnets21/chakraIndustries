import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { materialReturnApi } from '../../api/materialReturnApi';
import { toast } from '../../components/common/Toast';

const STAGES = ['Initiated', 'In-transit', 'Received', 'QC', 'Closed'];
const stageColor = { Initiated: '#6b7280', 'In-transit': '#3b82f6', Received: '#f59e0b', QC: '#8b5cf6', Closed: '#10b981' };

export default function MaterialReturnsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [returns, setReturns]     = useState([]);
  const [stats, setStats]         = useState({ total: 0, inTransit: 0, pendingQC: 0, closed: 0 });
  const [selected, setSelected]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({ supplierName: '', items: 1, value: '', reason: '', transport: '', awbNo: '' });

  const fetchAll = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([materialReturnApi.getAll(), materialReturnApi.getStats()]);
      setReturns(listRes.data || []);
      setStats(statsRes.data || {});
      if (!selected && listRes.data?.length > 0) setSelected(listRes.data[0]);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.supplierName || !form.reason) { toast('Supplier and reason are required', 'error'); return; }
    setSaving(true);
    try {
      await materialReturnApi.create({ ...form, value: parseFloat(form.value) || 0, items: parseInt(form.items) || 1 });
      setShowCreate(false);
      setForm({ supplierName: '', items: 1, value: '', reason: '', transport: '', awbNo: '' });
      await fetchAll();
      toast('Material return created');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleStageUpdate = async (id, stage) => {
    try {
      await materialReturnApi.updateStage(id, stage);
      await fetchAll();
      toast(`Stage updated to ${stage}`);
    } catch (e) { toast(e.message, 'error'); }
  };

  const stageIdx = (s) => STAGES.indexOf(s);

  const kpis = [
    { label: 'Total Returns',  value: stats.total,     color: '#1c2833' },
    { label: 'In-transit',     value: stats.inTransit, color: '#3b82f6' },
    { label: 'Pending QC',     value: stats.pendingQC, color: '#8b5cf6' },
    { label: 'Closed',         value: stats.closed,    color: '#10b981' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowCreate(true)} style={{
          padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        }}>+ New Return</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Return Requests</div>
            {returns.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No returns yet. Create one to get started.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr>{['MR ID', 'Docket', 'Supplier', 'Stage', 'Value'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {returns.map((r, i) => (
                      <tr key={i} onClick={() => setSelected(r)}
                        className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selected?._id === r._id ? 'bg-red-50/60' : 'hover:bg-red-50/40'}`}>
                        <td className="px-4 py-3 font-semibold text-red-700">{r.mrId}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{r.docketId}</td>
                        <td className="px-4 py-3 font-semibold">{r.supplierName}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: stageColor[r.stage] }}>{r.stage}</span>
                        </td>
                        <td className="px-4 py-3 font-bold">₹{(r.value || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-4">Stage Tracker — {selected.mrId}</div>
              <div className="flex items-center mb-6 overflow-x-auto pb-1">
                {STAGES.map((s, i) => {
                  const cur = stageIdx(selected.stage);
                  const done = i < cur; const active = i === cur;
                  return (
                    <div key={s} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? 'bg-green-500 border-green-500 text-white' : active ? 'border-red-600 text-red-700 bg-red-50' : 'border-gray-200 text-gray-400 bg-white'}`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <div className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${active ? 'text-red-700' : done ? 'text-green-600' : 'text-gray-400'}`}>{s}</div>
                      </div>
                      {i < STAGES.length - 1 && <div className={`h-0.5 w-8 mx-1 rounded ${i < cur ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[['Docket ID', selected.docketId], ['Supplier', selected.supplierName], ['Items', selected.items], ['Value', `₹${(selected.value||0).toLocaleString('en-IN')}`], ['Transport', selected.transport || '—'], ['AWB No.', selected.awbNo || '—'], ['Debit Note', selected.debitNoteId || '—'], ['Credit Note', selected.creditNoteId || 'Not issued']].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 mb-0.5">{k}</div>
                    <div className="text-sm font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {STAGES.indexOf(selected.stage) < STAGES.length - 1 && (
                  <button onClick={() => handleStageUpdate(selected._id, STAGES[stageIdx(selected.stage) + 1])}
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-white font-semibold border-0 cursor-pointer font-[inherit]">
                    → Move to {STAGES[stageIdx(selected.stage) + 1]}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-4">Docket Tracking</div>
          {returns.map((r, i) => (
            <div key={i} onClick={() => setSelected(r)}
              className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selected?._id === r._id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-red-700 text-sm">{r.docketId}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: stageColor[r.stage] }}>{r.stage}</span>
              </div>
              <div className="text-xs text-gray-500">{r.mrId} · {r.supplierName}</div>
              <div className="text-xs text-gray-400 mt-0.5">Transport: {r.transport || '—'} {r.awbNo ? `· AWB: ${r.awbNo}` : ''}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Material Return"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Submit'}</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          {[['Supplier *', 'supplierName', 'text', 'Supplier name'], ['No. of Items', 'items', 'number', '1'], ['Return Value (₹)', 'value', 'number', '0'], ['Transport', 'transport', 'text', 'Courier name'], ['AWB / Tracking No.', 'awbNo', 'text', 'AWB number']].map(([label, key, type, ph]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">{label}</label>
              <input type={type} className="form-input" placeholder={ph} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-600">Reason *</label>
            <textarea className="form-input" rows={2} placeholder="Reason for return..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
