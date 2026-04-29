import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { materialReturnApi } from '../../api/materialReturnApi';
import { toast } from '../../components/common/Toast';

const STAGES = ['Initiated', 'In-transit', 'Received', 'QC', 'Closed'];
const stageColor = {
  Initiated: '#6b7280', 'In-transit': '#3b82f6',
  Received: '#f59e0b', QC: '#8b5cf6', Closed: '#10b981',
};

const RETURN_TYPES = ['Defective', 'Wrong Item', 'Excess', 'Damaged in Transit', 'Quality Rejection'];

const EMPTY_FORM = {
  supplierName: '', items: 1, value: '', reason: '',
  transport: '', awbNo: '', returnType: 'Defective',
  orderRef: '', customer: '',
};

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const lbl = 'text-xs font-semibold text-gray-600';
const fld = 'flex flex-col gap-1.5';

export default function ReturnsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [returns, setReturns]     = useState([]);
  const [stats, setStats]         = useState({ total: 0, inTransit: 0, pendingQC: 0, closed: 0 });
  const [selected, setSelected]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [loading, setLoading]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        materialReturnApi.getAll(),
        materialReturnApi.getStats(),
      ]);
      const list = listRes.data || [];
      setReturns(list);
      setStats(statsRes.data || {});
      if (!selected && list.length > 0) setSelected(list[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.supplierName || !form.reason) {
      toast('Supplier and reason are required', 'error'); return;
    }
    setSaving(true);
    try {
      await materialReturnApi.create({
        ...form,
        value: parseFloat(form.value) || 0,
        items: parseInt(form.items) || 1,
      });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await fetchAll();
      toast('Material return created successfully');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleStageUpdate = async (id, stage) => {
    try {
      const res = await materialReturnApi.updateStage(id, stage);
      setSelected(res.data);
      await fetchAll();
      toast(`Stage updated to ${stage}`);
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await materialReturnApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      if (selected?._id === deleteTarget._id) setSelected(null);
      await fetchAll();
      toast('Return deleted');
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  const stageIdx = (s) => STAGES.indexOf(s);

  const kpis = [
    { label: 'Total Returns',  value: stats.total     || 0, color: '#1c2833' },
    { label: 'In-transit',     value: stats.inTransit || 0, color: '#3b82f6' },
    { label: 'Pending QC',     value: stats.pendingQC || 0, color: '#8b5cf6' },
    { label: 'Closed',         value: stats.closed    || 0, color: '#10b981' },
  ];

  const tabLabels = ['Return Requests', 'Docket Tracking', 'Stage Tracker', 'Loss Tracking'];

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabLabels.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer', border: 'none',
              background: activeTab === i ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : '#f1f5f9',
              color: activeTab === i ? '#fff' : '#475569',
            }}>{t}</button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 10,
          background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
        }}>+ New Return</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
      )}

      {/* Tab 0: Return Requests */}
      {!loading && activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Returns List ({returns.length})</div>
            {returns.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No returns yet. Click "+ New Return" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr>{['MR ID', 'Supplier', 'Items', 'Value', 'Stage', 'Actions'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {returns.map((r) => (
                      <tr key={r._id} onClick={() => setSelected(r)}
                        className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selected?._id === r._id ? 'bg-red-50/60' : 'hover:bg-red-50/40'}`}>
                        <td className="px-4 py-3 font-semibold text-red-700">{r.mrId}</td>
                        <td className="px-4 py-3 font-semibold">{r.supplierName}</td>
                        <td className="px-4 py-3">{r.items}</td>
                        <td className="px-4 py-3 font-bold">₹{(r.value || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: stageColor[r.stage] || '#6b7280' }}>{r.stage}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); setDeleteTarget(r); }}
                            style={{ padding: '3px 10px', borderRadius: 6, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selected && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3">Details — {selected.mrId}</div>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[
                  ['MR ID', selected.mrId],
                  ['Docket ID', selected.docketId],
                  ['Supplier', selected.supplierName],
                  ['Items', selected.items],
                  ['Value', `₹${(selected.value || 0).toLocaleString('en-IN')}`],
                  ['Reason', selected.reason],
                  ['Transport', selected.transport || '—'],
                  ['AWB No.', selected.awbNo || '—'],
                  ['Credit Note', selected.creditNoteId || 'Not issued'],
                  ['Stage', selected.stage],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 mb-0.5">{k}</div>
                    <div className="text-sm font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              {/* Stage advance button */}
              {stageIdx(selected.stage) < STAGES.length - 1 && (
                <button onClick={() => handleStageUpdate(selected._id, STAGES[stageIdx(selected.stage) + 1])}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  }}>
                  → Move to {STAGES[stageIdx(selected.stage) + 1]}
                </button>
              )}
              {selected.stage === 'Closed' && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 600, color: '#16a34a', textAlign: 'center' }}>
                  ✓ Return process completed
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Docket Tracking */}
      {!loading && activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-4">Docket Tracking</div>
          {returns.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No returns to track.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>{['Docket ID', 'MR ID', 'Supplier', 'Transport', 'AWB No.', 'Stage'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {returns.map((r) => (
                    <tr key={r._id} onClick={() => setSelected(r)}
                      className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selected?._id === r._id ? 'bg-red-50/60' : 'hover:bg-red-50/40'}`}>
                      <td className="px-4 py-3 font-semibold text-red-700 font-mono text-[12px]">{r.docketId}</td>
                      <td className="px-4 py-3 font-semibold">{r.mrId}</td>
                      <td className="px-4 py-3">{r.supplierName}</td>
                      <td className="px-4 py-3">{r.transport || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">{r.awbNo || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ background: stageColor[r.stage] || '#6b7280' }}>{r.stage}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Stage Tracker */}
      {!loading && activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Select Return</div>
            {returns.map((r) => (
              <div key={r._id} onClick={() => setSelected(r)}
                className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selected?._id === r._id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-red-700 text-sm">{r.mrId}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: stageColor[r.stage] || '#6b7280' }}>{r.stage}</span>
                </div>
                <div className="text-xs text-gray-500">{r.supplierName} · ₹{(r.value || 0).toLocaleString('en-IN')}</div>
              </div>
            ))}
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
              {stageIdx(selected.stage) < STAGES.length - 1 && (
                <button onClick={() => handleStageUpdate(selected._id, STAGES[stageIdx(selected.stage) + 1])}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff',
                    fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                  }}>
                  → Move to {STAGES[stageIdx(selected.stage) + 1]}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Loss Tracking */}
      {!loading && activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Returns with Credit Note Status</div>
          {returns.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No returns found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>{['MR ID', 'Supplier', 'Value', 'Stage', 'Credit Note', 'Debit Note', 'Action'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {returns.map((r) => (
                    <tr key={r._id} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-red-700">{r.mrId}</td>
                      <td className="px-4 py-3 font-semibold">{r.supplierName}</td>
                      <td className="px-4 py-3 font-bold">₹{(r.value || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ background: stageColor[r.stage] || '#6b7280' }}>{r.stage}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.creditNoteId
                          ? <span className="font-semibold text-green-600">{r.creditNoteId}</span>
                          : <span className="text-amber-500 text-xs font-semibold">Not issued</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.debitNoteId
                          ? <span className="font-semibold text-blue-600">{r.debitNoteId}</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.stage === 'Closed' && !r.creditNoteId && (
                          <button
                            onClick={async () => {
                              const cnId = `CN-${new Date().getFullYear()}-${r.mrId.split('-').pop()}`;
                              try {
                                await materialReturnApi.issueCreditNote(r._id, cnId);
                                await fetchAll();
                                toast(`Credit note ${cnId} issued`);
                              } catch (e) { toast(e.message, 'error'); }
                            }}
                            style={{ padding: '4px 10px', borderRadius: 6, background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>
                            Issue CN
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Return Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Material Return"
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Submit Return'}</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className={fld}><label className={lbl}>Supplier Name *</label>
            <input className={inp} placeholder="Supplier name" value={form.supplierName} onChange={e => setForm(p => ({ ...p, supplierName: e.target.value }))} /></div>
          <div className={fld}><label className={lbl}>Return Type</label>
            <select className={inp} value={form.returnType} onChange={e => setForm(p => ({ ...p, returnType: e.target.value }))}>
              {RETURN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select></div>
          <div className={fld}><label className={lbl}>No. of Items</label>
            <input type="number" className={inp} placeholder="1" value={form.items} onChange={e => setForm(p => ({ ...p, items: e.target.value }))} /></div>
          <div className={fld}><label className={lbl}>Return Value (₹)</label>
            <input type="number" className={inp} placeholder="0" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} /></div>
          <div className={fld}><label className={lbl}>Transport / Courier</label>
            <input className={inp} placeholder="Courier name" value={form.transport} onChange={e => setForm(p => ({ ...p, transport: e.target.value }))} /></div>
          <div className={fld}><label className={lbl}>AWB / Tracking No.</label>
            <input className={inp} placeholder="AWB number" value={form.awbNo} onChange={e => setForm(p => ({ ...p, awbNo: e.target.value }))} /></div>
          <div className={`${fld} col-span-2`}><label className={lbl}>Reason *</label>
            <textarea className={inp} rows={2} placeholder="Reason for return..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} /></div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Return"
        footer={<>
          <button className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
          <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </>}>
        <p style={{ fontSize: 14, color: '#374151' }}>
          Delete return <strong>{deleteTarget?.mrId}</strong> from <strong>{deleteTarget?.supplierName}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
