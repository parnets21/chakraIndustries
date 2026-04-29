import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { logisticsApi } from '../../api/logisticsApi';
import { poApi } from '../../api/poApi';
import DataTable from '../../components/tables/DataTable';

// ── Style constants ───────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const primaryBtn = {
  display:'inline-flex', alignItems:'center', gap:6,
  padding:'8px 16px', borderRadius:10,
  background:'linear-gradient(135deg,#ef4444,#b91c1c)',
  color:'#fff', border:'none', cursor:'pointer',
  fontSize:13, fontWeight:600, fontFamily:'inherit',
  boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
};

// ── Empty form templates ──────────────────────────────────────────────────────
const EMPTY_DISPATCH = {
  orderRef:'', customer:'', vehicleNo:'', driver:'',
  origin:'', destination:'', items:0, weight:'',
  value:0, dispatchDate:'', expectedDelivery:'', instructions:'',
};
const EMPTY_VEHICLE = { type:'Truck', number:'', driver:'', capacity:'', status:'Available' };
const EMPTY_SHIPMENT = { courier:'', awbNo:'', orderRef:'', customer:'', destination:'', eta:'' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtCur = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
      <div className="text-2xl font-black tracking-tight" style={{ color }}>{value ?? '—'}</div>
      <div className="text-xs text-gray-500 font-medium mt-1">{label}</div>
    </div>
  );
}

// ── Tab 0: Dispatch Dashboard ─────────────────────────────────────────────────
function DispatchTab({ vehicles }) {
  const [dispatches, setDispatches] = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_DISPATCH);
  const [saving, setSaving]         = useState(false);
  const [poList, setPoList]         = useState([]);
  const [posLoading, setPosLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, sRes] = await Promise.all([
        logisticsApi.getDispatches(),
        logisticsApi.getStats(),
      ]);
      setDispatches(dRes.data || []);
      setStats(sRes.data || null);
    } catch { toast('Failed to load dispatches', 'error'); }
    finally { setLoading(false); }
  }, []);

  // Load approved POs when modal opens
  const loadPOs = useCallback(async () => {
    setPosLoading(true);
    try {
      const r = await poApi.getAll({ status: 'Approved' });
      setPoList(r.data || []);
    } catch { toast('Failed to load purchase orders', 'error'); }
    finally { setPosLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = () => { setForm(EMPTY_DISPATCH); setShowModal(true); loadPOs(); };

  // When a PO is selected, auto-fill customer (vendor name) + destination + value
  const handlePOSelect = (poId) => {
    const po = poList.find(p => p.poId === poId);
    if (!po) { setForm(f => ({ ...f, orderRef: poId })); return; }
    setForm(f => ({
      ...f,
      orderRef:    po.poId,
      customer:    po.vendor?.name || po.vendor || '',
      destination: po.shippingAddress || '',
      value:       po.grandTotal || 0,
    }));
  };

  const handleCreate = async () => {
    if (!form.orderRef || !form.customer || !form.destination) {
      toast('Order Ref, Customer and Destination are required', 'error'); return;
    }
    setSaving(true);
    try {
      await logisticsApi.createDispatch(form);
      toast('Dispatch created successfully');
      setShowModal(false);
      setForm(EMPTY_DISPATCH);
      load();
    } catch (e) { toast(e.message || 'Failed to create dispatch', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dispatch?')) return;
    try {
      await logisticsApi.deleteDispatch(id);
      toast('Dispatch deleted');
      load();
    } catch { toast('Failed to delete', 'error'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await logisticsApi.updateDispatchStatus(id, { status });
      toast(`Status updated to ${status}`);
      load();
    } catch { toast('Failed to update status', 'error'); }
  };

  const availableVehicles = vehicles.filter(v => v.status === 'Available');

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button style={primaryBtn} onClick={openModal}>+ New Dispatch</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label="Ready to Dispatch"  value={dispatches.filter(d => d.status === 'Pending').length}                              color="#f59e0b" />
        <KpiCard label="In Transit"         value={stats?.inTransit ?? dispatches.filter(d => d.status === 'In Transit').length}       color="#3b82f6" />
        <KpiCard label="Delivered Today"    value={stats?.delivered ?? 0}                                                              color="#10b981" />
        <KpiCard label="Available Vehicles" value={stats?.availableVehicles ?? availableVehicles.length}                               color="#8b5cf6" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="text-sm font-bold text-gray-800 mb-3.5">All Dispatches</div>
        {loading ? <Spinner /> : (
          <DataTable
            columns={[
              { key: 'dispatchId',       label: 'Dispatch ID',   render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'orderRef',         label: 'PO Ref' },
              { key: 'customer',         label: 'Customer',      render: v => <span className="font-semibold">{v}</span> },
              { key: 'destination',      label: 'Destination' },
              { key: 'driver',           label: 'Driver' },
              { key: 'dispatchDate',     label: 'Dispatch Date', render: v => fmt(v) },
              { key: 'expectedDelivery', label: 'Expected',      render: v => fmt(v) },
              { key: 'status',           label: 'Status',        render: v => <StatusBadge status={v} /> },
              { key: '_id', label: 'Actions', render: (id, row) => (
                <div className="flex gap-1.5 flex-wrap">
                  {row.status !== 'Delivered' && row.status !== 'Cancelled' && (
                    <select
                      value={row.status}
                      onChange={e => handleStatusUpdate(id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white font-[inherit] cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  )}
                  <button onClick={() => handleDelete(id)} className="px-2 py-1 text-[11px] rounded-lg bg-red-50 text-red-600 border border-red-200 cursor-pointer font-[inherit]">Delete</button>
                </div>
              )},
            ]}
            data={dispatches}
          />
        )}
      </div>

      {/* Create Dispatch Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setForm(EMPTY_DISPATCH); }}
        title="Create New Dispatch"
        size="lg"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]"
              onClick={() => { setShowModal(false); setForm(EMPTY_DISPATCH); }}>Cancel</button>
            <button style={primaryBtn} onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Dispatch'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">

          {/* PO Reference dropdown — auto-fills customer, destination, value */}
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-600">Purchase Order Reference *</label>
            {posLoading ? (
              <div className="text-xs text-gray-400 py-2">Loading purchase orders…</div>
            ) : (
              <select className={inp} value={form.orderRef} onChange={e => handlePOSelect(e.target.value)}>
                <option value="">— Select Approved PO —</option>
                {poList.map(po => (
                  <option key={po._id} value={po.poId}>
                    {po.poId} — {po.vendor?.name || 'Vendor'} — {fmtCur(po.grandTotal)}
                  </option>
                ))}
                {poList.length === 0 && <option disabled>No approved POs found</option>}
              </select>
            )}
            {form.orderRef && (
              <div className="text-[11px] text-green-600 font-semibold mt-0.5">✓ PO {form.orderRef} selected</div>
            )}
          </div>

          {/* Auto-filled but editable fields */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Customer / Vendor *</label>
            <input className={inp} placeholder="Auto-filled from PO" value={form.customer}
              onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Destination *</label>
            <input className={inp} placeholder="Auto-filled from PO shipping address" value={form.destination}
              onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Value (₹)</label>
            <input type="number" className={inp} placeholder="Auto-filled from PO" value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Origin</label>
            <input className={inp} placeholder="Warehouse / Plant" value={form.origin}
              onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} />
          </div>

          {/* Vehicle dropdown — only available vehicles */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Vehicle</label>
            <select className={inp} value={form.vehicleNo} onChange={e => {
              const v = vehicles.find(x => x.number === e.target.value);
              setForm(f => ({ ...f, vehicleNo: e.target.value, driver: v?.driver || f.driver }));
            }}>
              <option value="">— Select Vehicle —</option>
              {availableVehicles.map(v => (
                <option key={v._id} value={v.number}>{v.number} — {v.type} ({v.capacity})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Driver</label>
            <input className={inp} placeholder="Auto-filled from vehicle" value={form.driver}
              onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Total Weight (kg)</label>
            <input className={inp} placeholder="0" value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Dispatch Date</label>
            <input type="date" className={inp} value={form.dispatchDate}
              onChange={e => setForm(f => ({ ...f, dispatchDate: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Expected Delivery</label>
            <input type="date" className={inp} value={form.expectedDelivery}
              onChange={e => setForm(f => ({ ...f, expectedDelivery: e.target.value }))} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-semibold text-gray-600">Delivery Instructions</label>
          <textarea className={inp} rows={3} placeholder="Special handling notes…" value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

// ── Tab 1: Vehicle Allocation ─────────────────────────────────────────────────
function VehiclesTab({ vehicles, loading, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_VEHICLE);
  const [saving, setSaving]       = useState(false);

  const handleCreate = async () => {
    if (!form.number || !form.driver) {
      toast('Vehicle number and driver are required', 'error'); return;
    }
    setSaving(true);
    try {
      await logisticsApi.createVehicle(form);
      toast('Vehicle added successfully');
      setShowModal(false);
      setForm(EMPTY_VEHICLE);
      onRefresh();
    } catch (e) { toast(e.message || 'Failed to add vehicle', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await logisticsApi.updateVehicle(id, { status });
      toast(`Vehicle status → ${status}`);
      onRefresh();
    } catch { toast('Failed to update vehicle', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await logisticsApi.deleteVehicle(id);
      toast('Vehicle deleted');
      onRefresh();
    } catch { toast('Failed to delete vehicle', 'error'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button style={primaryBtn} onClick={() => setShowModal(true)}>+ Add Vehicle</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fleet Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Fleet Status</div>
          {loading ? <Spinner /> : vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No vehicles found</div>
          ) : vehicles.map((v, i) => (
            <div key={v._id} className={`flex items-center justify-between py-3 ${i < vehicles.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🚛</div>
                <div>
                  <div className="font-bold text-sm">{v.number}</div>
                  <div className="text-[11px] text-gray-500">{v.type} · {v.capacity} · {v.driver}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={v.status} />
                <select
                  value={v.status}
                  onChange={e => handleStatusChange(v._id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white font-[inherit] cursor-pointer"
                >
                  <option>Available</option>
                  <option>In Transit</option>
                  <option>Maintenance</option>
                  <option>Inactive</option>
                </select>
                <button onClick={() => handleDelete(v._id)} className="px-2 py-1 text-[11px] rounded-lg bg-red-50 text-red-600 border border-red-200 cursor-pointer font-[inherit]">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Active Dispatches as Allocations */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Fleet Summary</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:'Total Vehicles',  value: vehicles.length,                                        color:'#1c2833' },
              { label:'Available',       value: vehicles.filter(v => v.status === 'Available').length,  color:'#10b981' },
              { label:'In Transit',      value: vehicles.filter(v => v.status === 'In Transit').length, color:'#3b82f6' },
              { label:'Maintenance',     value: vehicles.filter(v => v.status === 'Maintenance').length,color:'#f59e0b' },
            ].map((k, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <div className="text-xl font-black" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setForm(EMPTY_VEHICLE); }}
        title="Add New Vehicle"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]" onClick={() => { setShowModal(false); setForm(EMPTY_VEHICLE); }}>Cancel</button>
            <button style={primaryBtn} onClick={handleCreate} disabled={saving}>{saving ? 'Adding...' : 'Add Vehicle'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Vehicle Type</label>
            <select className={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option>Truck</option><option>Mini Truck</option><option>Tempo</option><option>Van</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Vehicle Number *</label>
            <input className={inp} placeholder="e.g. MH-12-AB-1234" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Driver Name *</label>
            <input className={inp} placeholder="Driver name" value={form.driver} onChange={e => setForm(f => ({ ...f, driver: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Capacity</label>
            <input className={inp} placeholder="e.g. 5 Ton" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Status</label>
            <select className={inp} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>Available</option><option>In Transit</option><option>Maintenance</option><option>Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Tab 2: Delivery Tracking ──────────────────────────────────────────────────
function TrackingTab() {
  const [dispatches, setDispatches] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    logisticsApi.getDispatches()
      .then(r => {
        const list = r.data || [];
        setDispatches(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => toast('Failed to load dispatches', 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (dispatches.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 shadow-sm">No dispatches found</div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Dispatch list */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm md:col-span-1 overflow-y-auto max-h-[600px]">
        <div className="text-sm font-bold text-gray-800 mb-3">All Dispatches</div>
        {dispatches.map(d => (
          <div key={d._id} onClick={() => setSelected(d)}
            className={`p-3 rounded-xl mb-2 cursor-pointer border-2 transition-all ${selected?._id === d._id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-red-700 text-sm">{d.dispatchId}</span>
              <StatusBadge status={d.status} />
            </div>
            <div className="text-sm font-semibold text-gray-800">{d.customer}</div>
            <div className="text-xs text-gray-500 mt-0.5">{d.origin || '—'} → {d.destination}</div>
          </div>
        ))}
      </div>

      {/* Timeline + Summary */}
      {selected && (
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800">Tracking — {selected.dispatchId}</div>
            <div className="text-xs text-gray-400 mt-0.5 mb-5">{selected.customer} · {selected.destination}</div>
            {selected.timeline && selected.timeline.length > 0 ? (
              <div className="relative pl-6">
                <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-gray-200 rounded" />
                {selected.timeline.map((item, i) => (
                  <div key={i} className="relative mb-5 last:mb-0">
                    <div className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full ring-2 ring-offset-1 ${
                      item.status === 'success' ? 'bg-green-500 ring-green-500' :
                      item.status === 'warning' ? 'bg-amber-400 ring-amber-400' :
                      'bg-gray-300 ring-gray-300'
                    }`} />
                    <div className="text-sm font-semibold text-gray-800">{item.event}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{fmt(item.time)}</div>
                    {item.location && <div className="text-xs text-gray-400">{item.location}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No timeline events yet</div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Delivery Summary</div>
            {[
              ['Dispatch ID',       selected.dispatchId],
              ['Order Ref',         selected.orderRef],
              ['Customer',          selected.customer],
              ['Vehicle',           selected.vehicleNo || '—'],
              ['Driver',            selected.driver || '—'],
              ['Origin',            selected.origin || '—'],
              ['Destination',       selected.destination],
              ['Dispatch Date',     fmt(selected.dispatchDate)],
              ['Expected Delivery', fmt(selected.expectedDelivery)],
              ['Status',            selected.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 text-sm last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: DC Regularization (dispatches with invoice tracking) ───────────────
function DCTab() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await logisticsApi.getDispatches();
      setDispatches(r.data || []);
    } catch { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRegularize = async (id) => {
    try {
      await logisticsApi.updateDispatchStatus(id, { status: 'Delivered', event: 'Invoice Regularized' });
      toast('DC regularized successfully');
      load();
    } catch { toast('Failed to regularize', 'error'); }
  };

  const pending = dispatches.filter(d => d.status !== 'Delivered' && d.status !== 'Cancelled');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-bold text-gray-800">DC to Invoice Regularization</div>
          <div className="text-xs text-gray-400 mt-0.5">Track dispatch challans and invoice status</div>
        </div>
        <StatusBadge status={`${pending.length} Pending`} type="warning" />
      </div>
      {loading ? <Spinner /> : (
        <DataTable
          columns={[
            { key: 'dispatchId', label: 'Dispatch ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
            { key: 'orderRef',   label: 'Order Ref' },
            { key: 'customer',   label: 'Customer', render: v => <span className="font-semibold">{v}</span> },
            { key: 'dispatchDate', label: 'Dispatch Date', render: v => fmt(v) },
            { key: 'destination', label: 'Destination' },
            { key: 'value',      label: 'Value', render: v => <span className="font-bold">{fmtCur(v)}</span> },
            { key: 'status',     label: 'Status', render: v => <StatusBadge status={v} type={v === 'Delivered' ? 'success' : v === 'Cancelled' ? 'danger' : 'warning'} /> },
            { key: '_id', label: 'Action', render: (id, row) => row.status === 'Delivered' ? (
              <span className="text-green-600 text-xs font-semibold">✓ Done</span>
            ) : (
              <button onClick={() => handleRegularize(id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Regularize</button>
            )},
          ]}
          data={dispatches}
        />
      )}
    </div>
  );
}

// ── Tab 4: Pendency ───────────────────────────────────────────────────────────
function PendencyTab() {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    logisticsApi.getDispatches({ status: 'Pending' })
      .then(r => setDispatches(r.data || []))
      .catch(() => toast('Failed to load pendency', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const totalPending = dispatches.length;
  const oldest = dispatches.reduce((max, d) => {
    const days = Math.floor((Date.now() - new Date(d.createdAt)) / 86400000);
    return days > max ? days : max;
  }, 0);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <KpiCard label="Pending Dispatches"  value={totalPending} color="#ef4444" />
        <KpiCard label="Oldest Pendency"     value={oldest > 0 ? `${oldest}d` : '—'} color="#8b5cf6" />
        <KpiCard label="Total Pending Value" value={fmtCur(dispatches.reduce((s, d) => s + (d.value || 0), 0))} color="#f59e0b" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="text-sm font-bold text-gray-800 mb-3.5">Pending Dispatches</div>
        {loading ? <Spinner /> : dispatches.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No pending dispatches 🎉</div>
        ) : (
          <DataTable
            columns={[
              { key: 'dispatchId', label: 'Dispatch ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'orderRef',   label: 'Order Ref' },
              { key: 'customer',   label: 'Customer', render: v => <span className="font-semibold">{v}</span> },
              { key: 'destination',label: 'Destination' },
              { key: 'value',      label: 'Value', render: v => <span className="font-bold">{fmtCur(v)}</span> },
              { key: 'createdAt',  label: 'Age', render: v => {
                const days = Math.floor((Date.now() - new Date(v)) / 86400000);
                return <span className={`font-bold ${days > 5 ? 'text-red-500' : days > 2 ? 'text-amber-500' : 'text-gray-500'}`}>{days}d</span>;
              }},
              { key: 'instructions', label: 'Notes', render: v => <span className="text-[11px] text-gray-500">{v || '—'}</span> },
            ]}
            data={dispatches}
          />
        )}
      </div>
    </div>
  );
}

// ── Tab 5: Courier & POD ──────────────────────────────────────────────────────
function CourierTab() {
  const [shipments, setShipments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_SHIPMENT);
  const [saving, setSaving]         = useState(false);
  const [podModal, setPodModal]     = useState(null); // shipment object
  const [podForm, setPodForm]       = useState({ receivedBy:'', deliveredAt:'' });
  const [podSaving, setPodSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await logisticsApi.getShipments();
      setShipments(r.data || []);
    } catch { toast('Failed to load shipments', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.courier || !form.awbNo || !form.orderRef || !form.customer || !form.destination) {
      toast('All required fields must be filled', 'error'); return;
    }
    setSaving(true);
    try {
      await logisticsApi.createShipment(form);
      toast('Shipment created successfully');
      setShowModal(false);
      setForm(EMPTY_SHIPMENT);
      load();
    } catch (e) { toast(e.message || 'Failed to create shipment', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shipment?')) return;
    try {
      await logisticsApi.deleteShipment(id);
      toast('Shipment deleted');
      load();
    } catch { toast('Failed to delete', 'error'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await logisticsApi.updateShipment(id, { status });
      toast(`Status → ${status}`);
      load();
    } catch { toast('Failed to update', 'error'); }
  };

  const handlePODSubmit = async () => {
    if (!podForm.receivedBy) { toast('Receiver name is required', 'error'); return; }
    setPodSaving(true);
    try {
      await logisticsApi.markPOD(podModal._id, podForm);
      toast('POD submitted successfully');
      setPodModal(null);
      setPodForm({ receivedBy:'', deliveredAt:'' });
      load();
    } catch { toast('Failed to submit POD', 'error'); }
    finally { setPodSaving(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button style={primaryBtn} onClick={() => setShowModal(true)}>+ New Shipment</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <KpiCard label="Active Shipments" value={shipments.filter(s => s.status !== 'Delivered').length} color="#3b82f6" />
        <KpiCard label="Delivered"        value={shipments.filter(s => s.status === 'Delivered').length} color="#10b981" />
        <KpiCard label="POD Pending"      value={shipments.filter(s => !s.pod).length} color="#f59e0b" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="text-sm font-bold text-gray-800 mb-3.5">Courier Shipments</div>
        {loading ? <Spinner /> : (
          <DataTable
            columns={[
              { key: 'shipmentId', label: 'Shipment ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'courier',    label: 'Courier', render: v => <span className="font-bold">{v}</span> },
              { key: 'awbNo',      label: 'AWB No.', render: v => <span className="font-mono text-[11px]">{v}</span> },
              { key: 'orderRef',   label: 'Order Ref' },
              { key: 'customer',   label: 'Customer' },
              { key: 'destination',label: 'Destination' },
              { key: 'eta',        label: 'ETA', render: v => fmt(v) },
              { key: 'status',     label: 'Status', render: v => <StatusBadge status={v} type={v === 'Delivered' ? 'success' : v === 'Out for Delivery' ? 'warning' : 'info'} /> },
              { key: 'pod',        label: 'POD', render: (v, row) => v ? (
                <span className="px-2 py-1 text-[11px] rounded bg-green-100 text-green-800 font-semibold">✓ Done</span>
              ) : (
                <button onClick={() => setPodModal(row)} className="px-2 py-1 text-[11px] rounded bg-amber-100 text-amber-800 border-0 cursor-pointer font-[inherit] font-semibold">⬆ Upload POD</button>
              )},
              { key: '_id', label: 'Actions', render: (id, row) => (
                <div className="flex gap-1.5">
                  {row.status !== 'Delivered' && (
                    <select value={row.status} onChange={e => handleStatusUpdate(id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white font-[inherit] cursor-pointer">
                      <option value="Booked">Booked</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Returned">Returned</option>
                    </select>
                  )}
                  <button onClick={() => handleDelete(id)} className="px-2 py-1 text-[11px] rounded-lg bg-red-50 text-red-600 border border-red-200 cursor-pointer font-[inherit]">✕</button>
                </div>
              )},
            ]}
            data={shipments}
          />
        )}
      </div>

      {/* Create Shipment Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setForm(EMPTY_SHIPMENT); }}
        title="New Courier Shipment"
        size="lg"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]" onClick={() => { setShowModal(false); setForm(EMPTY_SHIPMENT); }}>Cancel</button>
            <button style={primaryBtn} onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Shipment'}</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:'Courier *',      key:'courier',     placeholder:'e.g. BlueDart' },
            { label:'AWB No. *',      key:'awbNo',       placeholder:'Tracking number' },
            { label:'Order Ref *',    key:'orderRef',    placeholder:'e.g. ORD-2024-089' },
            { label:'Customer *',     key:'customer',    placeholder:'Customer name' },
            { label:'Destination *',  key:'destination', placeholder:'City / Address' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">{label}</label>
              <input className={inp} placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">ETA</label>
            <input type="date" className={inp} value={form.eta} onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* POD Upload Modal */}
      <Modal
        open={!!podModal}
        onClose={() => { setPodModal(null); setPodForm({ receivedBy:'', deliveredAt:'' }); }}
        title={`Submit POD — ${podModal?.shipmentId || ''}`}
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]" onClick={() => setPodModal(null)}>Cancel</button>
            <button style={primaryBtn} onClick={handlePODSubmit} disabled={podSaving}>{podSaving ? 'Submitting...' : 'Submit POD'}</button>
          </>
        }
      >
        {podModal && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mb-4 cursor-pointer bg-gray-50">
                <div className="text-4xl mb-2">📷</div>
                <div className="font-semibold text-sm mb-1">Upload POD Image / Signature</div>
                <div className="text-[11px] text-gray-500">Drag & drop or click to browse</div>
                <div className="text-[10px] text-gray-400 mt-1">JPG, PNG, PDF — Max 5MB</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Delivery Details</div>
              {[
                ['Shipment',    podModal.shipmentId],
                ['AWB No.',     podModal.awbNo],
                ['Courier',     podModal.courier],
                ['Customer',    podModal.customer],
                ['Destination', podModal.destination],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-50 text-sm last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
              <div className="flex flex-col gap-1.5 mt-3 mb-3">
                <label className="text-xs font-semibold text-gray-600">Receiver Name *</label>
                <input className={inp} placeholder="Name of person who received" value={podForm.receivedBy} onChange={e => setPodForm(f => ({ ...f, receivedBy: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Delivery Date & Time</label>
                <input type="datetime-local" className={inp} value={podForm.deliveredAt} onChange={e => setPodForm(f => ({ ...f, deliveredAt: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LogisticsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab]   = useState(initialTab);
  const [vehicles, setVehicles]     = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const r = await logisticsApi.getVehicles();
      setVehicles(r.data || []);
    } catch { toast('Failed to load vehicles', 'error'); }
    finally { setVehiclesLoading(false); }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto scrollbar-none">
        {['Dispatch Dashboard', 'Vehicle Allocation', 'Delivery Tracking', 'DC Regularization', 'Pendency', 'Courier & POD'].map((t, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 transition-all font-[inherit] bg-transparent cursor-pointer flex-shrink-0
              ${activeTab === i ? 'text-red-700 border-red-600' : 'text-gray-400 border-transparent hover:text-red-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 0 && <DispatchTab vehicles={vehicles} />}
      {activeTab === 1 && <VehiclesTab vehicles={vehicles} loading={vehiclesLoading} onRefresh={loadVehicles} />}
      {activeTab === 2 && <TrackingTab />}
      {activeTab === 3 && <DCTab />}
      {activeTab === 4 && <PendencyTab />}
      {activeTab === 5 && <CourierTab />}
    </div>
  );
}
