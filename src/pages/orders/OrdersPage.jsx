import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { MdDeleteOutline } from 'react-icons/md';
import { toast } from '../../components/common/Toast';

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';

const initialOrders = [
  { id: 'ORD-2024-089', customer: 'Tata Motors Ltd',     items: 12, value: '₹2,84,000', status: 'Processing', date: '14 Apr', priority: 'High' },
  { id: 'ORD-2024-088', customer: 'Mahindra & Mahindra', items: 8,  value: '₹1,56,000', status: 'Delivered',  date: '13 Apr', priority: 'Normal' },
  { id: 'ORD-2024-087', customer: 'Bajaj Auto',           items: 24, value: '₹4,12,000', status: 'Pending',    date: '13 Apr', priority: 'Urgent' },
  { id: 'ORD-2024-086', customer: 'Hero MotoCorp',        items: 6,  value: '₹98,000',   status: 'Delivered',  date: '12 Apr', priority: 'Normal' },
  { id: 'ORD-2024-085', customer: 'TVS Motor',            items: 18, value: '₹3,24,000', status: 'Shipped',    date: '12 Apr', priority: 'High' },
  { id: 'ORD-2024-084', customer: 'Ashok Leyland',        items: 30, value: '₹6,80,000', status: 'Processing', date: '11 Apr', priority: 'Normal' },
  { id: 'ORD-2024-083', customer: 'Eicher Motors',        items: 15, value: '₹2,10,000', status: 'Cancelled',  date: '10 Apr', priority: 'Low' },
];

const emptyForm = { customer: '', date: '', deliveryDate: '', priority: 'Normal', status: 'Pending', items: '', value: '', remarks: '' };

export default function OrdersPage() {
  const [orders, setOrders]           = useState(initialOrders);
  const [showModal, setShowModal]     = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editOrder, setEditOrder]     = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm]               = useState(emptyForm);

  const filtered = orders
    .filter(o => statusFilter === 'All' || o.status === statusFilter)
    .filter(o => !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = () => {
    if (!form.customer) { toast('Customer name is required', 'error'); return; }
    const newId = `ORD-${new Date().getFullYear()}-${String(orders.length + 90).padStart(3, '0')}`;
    const newOrder = {
      id: newId,
      customer: form.customer,
      items: parseInt(form.items) || 0,
      value: form.value || '₹0',
      status: form.status || 'Pending',
      date: form.date ? new Date(form.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      priority: form.priority,
    };
    setOrders(prev => [newOrder, ...prev]);
    setForm(emptyForm);
    setShowModal(false);
    toast(`Order ${newId} created`);
  };

  const handleEdit = () => {
    if (!editOrder) return;
    setOrders(prev => prev.map(o => o.id === editOrder.id ? { ...o, customer: form.customer, priority: form.priority, status: form.status, items: parseInt(form.items) || o.items, value: form.value || o.value } : o));
    setEditOrder(null);
    setForm(emptyForm);
    toast(`Order ${editOrder.id} updated`);
  };

  const openEdit = (row) => {
    setEditOrder(row);
    setForm({ customer: row.customer, date: '', deliveryDate: '', priority: row.priority, status: row.status, items: String(row.items), value: row.value, remarks: '' });
  };

  const confirmDelete = () => {
    const id = deleteOrder.id;
    setOrders(prev => prev.filter(o => o.id !== id));
    setDeleteOrder(null);
    toast(`Order ${id} deleted`, 'warning');
  };

  const handleExport = () => {
    const csv = ['ID,Customer,Items,Value,Status,Priority,Date', ...orders.map(o => `${o.id},${o.customer},${o.items},${o.value},${o.status},${o.priority},${o.date}`)].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'orders.csv'; a.click();
    toast('Orders exported');
  };

  const kpis = [
    { label: 'Total Orders', value: orders.length, color: '#3b82f6' },
    { label: 'Processing',   value: orders.filter(o => o.status === 'Processing').length, color: '#f59e0b' },
    { label: 'Delivered',    value: orders.filter(o => o.status === 'Delivered').length,  color: '#10b981' },
    { label: 'Pending',      value: orders.filter(o => o.status === 'Pending').length,    color: '#ef4444' },
  ];

  const FormBody = () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5 mb-2"><label className="text-xs font-semibold text-gray-600">Customer *</label><input className={inp} placeholder="Customer name" value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))} /></div>
      <div className="flex flex-col gap-1.5 mb-2"><label className="text-xs font-semibold text-gray-600">Priority</label><select className={inp} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}><option>Normal</option><option>High</option><option>Urgent</option><option>Low</option></select></div>
      <div className="flex flex-col gap-1.5 mb-2"><label className="text-xs font-semibold text-gray-600">Status</label><select className={inp} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}><option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></div>
      <div className="flex flex-col gap-1.5 mb-2"><label className="text-xs font-semibold text-gray-600">No. of Items</label><input type="number" className={inp} placeholder="0" value={form.items} onChange={e => setForm(p => ({ ...p, items: e.target.value }))} /></div>
      <div className="flex flex-col gap-1.5 mb-2"><label className="text-xs font-semibold text-gray-600">Order Date</label><input type="date" className={inp} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
      <div className="flex flex-col gap-1.5 mb-2"><label className="text-xs font-semibold text-gray-600">Order Value</label><input className={inp} placeholder="e.g. ₹2,84,000" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} /></div>
      <div className="flex flex-col gap-1.5 mb-2 col-span-2"><label className="text-xs font-semibold text-gray-600">Remarks</label><textarea className={inp} placeholder="Order notes..." value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} /></div>
    </div>
  );

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          <input placeholder="Search order ID or customer…" value={search} onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"
            style={{ minWidth: 220 }} />
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer font-[inherit] ${statusFilter === s ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-400'}`}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit] hover:bg-red-700 hover:text-white transition-all">⬇ Export</button>
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer font-[inherit] border-0">
            + New Order
          </button>
        </div>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <DataTable
          columns={[
            { key: 'id', label: 'Order ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
            { key: 'customer', label: 'Customer', render: v => <span className="font-semibold">{v}</span> },
            { key: 'items', label: 'Items' },
            { key: 'value', label: 'Value', render: v => <span className="font-bold">{v}</span> },
            { key: 'priority', label: 'Priority', render: v => <StatusBadge status={v} type={v === 'Urgent' ? 'danger' : v === 'High' ? 'warning' : v === 'Low' ? 'gray' : 'info'} /> },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            {
              key: 'id', label: 'Actions', render: (_, row) => (
                <div className="flex gap-1.5">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setSelectedOrder(row)}>View</button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-800 font-semibold cursor-pointer font-[inherit] border-0 hover:bg-gray-200 transition-all" onClick={() => openEdit(row)}>Edit</button>
                  <button className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 font-semibold cursor-pointer font-[inherit] border border-red-200 hover:bg-red-600 hover:text-white transition-all" title="Delete" onClick={() => setDeleteOrder(row)}><MdDeleteOutline size={15} /></button>
                </div>
              )
            },
          ]}
          data={filtered}
        />
        {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No orders found</div>}
      </div>

      {/* Delete Confirm */}
      <Modal open={!!deleteOrder} onClose={() => setDeleteOrder(null)} title="Delete Order"
        footer={<><button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]" onClick={() => setDeleteOrder(null)}>Cancel</button><button className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold cursor-pointer font-[inherit] border-0" onClick={confirmDelete}>Delete</button></>}>
        <p className="text-sm text-gray-700">Are you sure you want to delete order <strong>{deleteOrder?.id}</strong>?</p>
      </Modal>

      {/* Create Order */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Order"
        footer={<><button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button><button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md border-0 cursor-pointer font-[inherit]" onClick={handleCreate}>Create Order</button></>}>
        <FormBody />
      </Modal>

      {/* Edit Order */}
      <Modal open={!!editOrder} onClose={() => { setEditOrder(null); setForm(emptyForm); }} title={`Edit Order — ${editOrder?.id}`}
        footer={<><button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]" onClick={() => { setEditOrder(null); setForm(emptyForm); }}>Cancel</button><button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md border-0 cursor-pointer font-[inherit]" onClick={handleEdit}>Save Changes</button></>}>
        <FormBody />
      </Modal>

      {/* View Order */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order — ${selectedOrder?.id || ''}`}
        footer={<button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md border-0 cursor-pointer font-[inherit]" onClick={() => setSelectedOrder(null)}>Close</button>}>
        {selectedOrder && [['Customer', selectedOrder.customer], ['Order Date', selectedOrder.date], ['Items', selectedOrder.items], ['Value', selectedOrder.value], ['Priority', selectedOrder.priority], ['Status', selectedOrder.status]].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 border-b border-gray-200 text-sm last:border-0">
            <span className="text-gray-500">{k}</span><span className="font-semibold">{v}</span>
          </div>
        ))}
      </Modal>
    </div>
  );
}
