/**
 * StockItemsPage.jsx
 * Shows Item Master (stock items) within the Inventory section.
 * Route: /inventory/stock-items
 */
import { useState, useEffect, useCallback } from 'react';
import { itemMasterApi } from '../../api/itemMasterApi';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { MdSearch, MdAdd, MdEdit, MdDelete, MdInventory2 } from 'react-icons/md';
import * as XLSX from 'xlsx';

const inp = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
  borderRadius: 9, fontSize: 13, outline: 'none', background: '#fff',
  color: '#1e293b', fontFamily: 'inherit', boxSizing: 'border-box',
};
const lbl = { fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' };

const EMPTY_FORM = {
  sku: '', name: '', description: '', category: '', unit: 'units',
  unitPrice: '', costPrice: '', sellingPrice: '',
  minQuantity: '', maxQuantity: '', reorderPoint: '',
  hsn: '', gst: '', barcode: '',
};

export default function StockItemsPage({ externalShowModal = false, onExternalModalClose }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal]   = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Allow parent (InventorySubPage) to open the Add modal via externalShowModal
  useEffect(() => {
    if (externalShowModal) { openAdd(); onExternalModalClose?.(); }
  }, [externalShowModal]); // eslint-disable-line

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemMasterApi.getAll({ status: statusFilter === 'All' ? '' : statusFilter });
      setItems(res.data || []);
    } catch (e) {
      toast(e.message || 'Failed to load items', 'error');
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filteredItems = items.filter(item =>
    !search || item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY_FORM); setEditingItem(null); setFormErrors({}); setShowModal(true); };
  const openEdit = (item) => {
    setForm({
      sku: item.sku || '', name: item.name || '', description: item.description || '',
      category: item.category || '', unit: item.unit || 'units',
      unitPrice: item.unitPrice ?? '', costPrice: item.costPrice ?? '',
      sellingPrice: item.sellingPrice ?? '', minQuantity: item.minQuantity ?? '',
      maxQuantity: item.maxQuantity ?? '', reorderPoint: item.reorderPoint ?? '',
      hsn: item.hsn || '', gst: item.gst ?? '', barcode: item.barcode || '',
    });
    setEditingItem(item);
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await itemMasterApi.delete(item._id);
      toast('Item deleted', 'success');
      loadItems();
    } catch (e) { toast(e.message, 'error'); }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.sku.trim()) errors.sku = 'SKU is required';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.unit.trim()) errors.unit = 'Unit is required';
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setSaving(true); setFormErrors({});
    try {
      const body = { ...form };
      // Convert numeric strings
      ['unitPrice','costPrice','sellingPrice','minQuantity','maxQuantity','reorderPoint','gst'].forEach(k => {
        if (body[k] !== '') body[k] = Number(body[k]);
      });
      if (editingItem) {
        await itemMasterApi.update(editingItem._id, body);
        toast('Item updated', 'success');
      } else {
        await itemMasterApi.create(body);
        toast('Item created', 'success');
      }
      setShowModal(false);
      loadItems();
    } catch (e) { setFormErrors({ _general: e.message }); }
    finally { setSaving(false); }
  };

  const handleExport = () => {
    const rows = filteredItems.map(i => ({
      'SKU': i.sku, 'Name': i.name, 'Category': i.category, 'Unit': i.unit,
      'Unit Price': i.unitPrice, 'Cost Price': i.costPrice, 'Selling Price': i.sellingPrice,
      'Min Qty': i.minQuantity, 'Reorder Point': i.reorderPoint,
      'HSN': i.hsn, 'GST %': i.gst, 'Status': i.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Items');
    XLSX.writeFile(wb, 'stock-items.xlsx');
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const statusBadge = (s) => {
    const map = { Active:{ bg:'#ecfdf5', color:'#047857' }, Inactive:{ bg:'#f3f4f6', color:'#6b7280' }, Discontinued:{ bg:'#fef2f2', color:'#dc2626' } };
    const style = map[s] || map.Inactive;
    return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:600, ...style }}>{s || '—'}</span>;
  };

  return (
    <>
      <style>{`
        .si-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .si-search-wrap { position:relative; flex:1; min-width:160px; }
        .si-search { width:100%; padding:9px 12px 9px 34px; border:1.5px solid #e2e8f0; border-radius:10px; background:#f8fafc; font-size:13px; color:#1e293b; outline:none; font-family:inherit; transition:all .2s; box-sizing:border-box; }
        .si-search:focus { border-color:#ef4444; background:#fff; box-shadow:0 0 0 3px rgba(239,68,68,0.08); }
        .si-search::placeholder { color:#94a3b8; }
        .si-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; display:flex; }
        .si-select { padding:9px 12px; border:1.5px solid #e2e8f0; border-radius:10px; background:#f8fafc; font-size:13px; color:#1e293b; outline:none; font-family:inherit; cursor:pointer; }
        .si-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 14px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; border:none; transition:all .15s; }
        .si-btn-primary { background:linear-gradient(135deg,#ef4444,#b91c1c); color:#fff; box-shadow:0 3px 10px rgba(185,28,28,0.3); }
        .si-btn-outline { background:#f8fafc; color:#475569; border:1.5px solid #e2e8f0; }
        .si-table-wrap { overflow-x:auto; border-radius:12px; border:1px solid #f1f5f9; }
        .si-table { width:100%; border-collapse:collapse; min-width:700px; }
        .si-table thead tr { background:#f8fafc; }
        .si-table th { padding:10px 14px; text-align:left; font-size:10.5px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.7px; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
        .si-table td { padding:11px 14px; font-size:12.5px; color:#1e293b; border-bottom:1px solid #f8fafc; vertical-align:middle; }
        .si-table tbody tr:hover { background:#fef2f2; }
        .si-table tbody tr:last-child td { border-bottom:none; }
        .si-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media(max-width:540px) { .si-form-grid{grid-template-columns:1fr;} }
        .si-span2 { grid-column:span 2; }
        @media(max-width:540px) { .si-span2{grid-column:span 1;} }
      `}</style>

      {/* Toolbar */}
      <div className="si-toolbar">
        <div className="si-search-wrap">
          <span className="si-search-icon"><MdSearch size={15} /></span>
          <input className="si-search" placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="si-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Status</option>
          <option>Active</option><option>Inactive</option><option>Discontinued</option>
        </select>
        <button className="si-btn si-btn-outline" onClick={handleExport}>⬇ Export</button>
        <button className="si-btn si-btn-primary" onClick={openAdd}><MdAdd size={16} /> Add Item</button>
      </div>

      {/* Count */}
      <div style={{ fontSize:12, color:'#94a3b8', marginBottom:10 }}>{filteredItems.length} items</div>

      {/* Loading */}
      {loading && <div style={{ padding:'32px 0', textAlign:'center', color:'#94a3b8', fontSize:13 }}>Loading stock items…</div>}

      {/* Table */}
      {!loading && filteredItems.length > 0 && (
        <div className="si-table-wrap">
          <table className="si-table">
            <thead><tr>
              <th>SKU</th><th>Name</th><th>Category</th><th>Unit</th>
              <th>Cost Price</th><th>Selling Price</th><th>Min Qty</th>
              <th>Reorder</th><th>HSN</th><th>GST%</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item._id}>
                  <td style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:'#64748b' }}>{item.sku}</td>
                  <td style={{ fontWeight:500, maxWidth:180 }}>{item.name}</td>
                  <td>{item.category || '—'}</td>
                  <td>{item.unit}</td>
                  <td>₹{(item.costPrice ?? 0).toLocaleString('en-IN')}</td>
                  <td>₹{(item.sellingPrice ?? 0).toLocaleString('en-IN')}</td>
                  <td>{item.minQuantity ?? '—'}</td>
                  <td>{item.reorderPoint ?? '—'}</td>
                  <td style={{ fontFamily:'monospace', fontSize:11 }}>{item.hsn || '—'}</td>
                  <td>{item.gst != null ? `${item.gst}%` : '—'}</td>
                  <td>{statusBadge(item.status)}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(item)} style={{ padding:'4px 10px', borderRadius:6, background:'#fef2f2', border:'1px solid #fecaca', color:'#ef4444', cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:'inherit' }}><MdEdit size={13} /> Edit</button>
                    <button onClick={() => handleDelete(item)} style={{ padding:'4px 10px', borderRadius:6, background:'#fee2e2', border:'1px solid #fecaca', color:'#dc2626', cursor:'pointer', fontSize:12, fontWeight:500, fontFamily:'inherit' }}><MdDelete size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div style={{ padding:'48px 24px', textAlign:'center', background:'#f8fafc', borderRadius:12, border:'1px dashed #e2e8f0' }}>
          <MdInventory2 size={40} style={{ color:'#cbd5e1', marginBottom:12 }} />
          <div style={{ fontSize:14, fontWeight:600, color:'#475569', marginBottom:4 }}>No stock items found</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>Add your first item or adjust your search</div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editingItem ? `Edit: ${editingItem.name}` : 'Add New Stock Item'} size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} style={{ padding:'8px 16px', borderRadius:9, border:'1.5px solid #c0392b', color:'#c0392b', background:'transparent', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:13 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding:'8px 18px', borderRadius:9, background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:13, opacity:saving?0.7:1 }}>{saving?'Saving…':'Save Item'}</button>
          </>
        }>
        <div className="si-form-grid">
          {formErrors._general && (
            <div style={{ gridColumn:'span 2', padding:'8px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:12, color:'#dc2626', fontWeight:600 }}>❌ {formErrors._general}</div>
          )}
          <div><label style={lbl}>SKU *</label><input style={{...inp, borderColor:formErrors.sku?'#ef4444':'#e2e8f0'}} placeholder="e.g. SKU-001" value={form.sku} onChange={f('sku')} />{formErrors.sku&&<div style={{fontSize:11,color:'#ef4444',marginTop:3}}>⚠ {formErrors.sku}</div>}</div>
          <div><label style={lbl}>Item Name *</label><input style={{...inp, borderColor:formErrors.name?'#ef4444':'#e2e8f0'}} placeholder="Product name" value={form.name} onChange={f('name')} />{formErrors.name&&<div style={{fontSize:11,color:'#ef4444',marginTop:3}}>⚠ {formErrors.name}</div>}</div>
          <div><label style={lbl}>Category</label><input style={inp} placeholder="e.g. Electronics" value={form.category} onChange={f('category')} /></div>
          <div><label style={lbl}>Unit *</label>
            <select style={{...inp, borderColor:formErrors.unit?'#ef4444':'#e2e8f0'}} value={form.unit} onChange={f('unit')}>
              {['units','kg','g','mg','litre','ml','metre','cm','box','pack','set','piece','dozen'].map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Cost Price (₹)</label><input style={inp} type="number" min="0" placeholder="0" value={form.costPrice} onChange={f('costPrice')} /></div>
          <div><label style={lbl}>Selling Price (₹)</label><input style={inp} type="number" min="0" placeholder="0" value={form.sellingPrice} onChange={f('sellingPrice')} /></div>
          <div><label style={lbl}>Unit Price (₹)</label><input style={inp} type="number" min="0" placeholder="0" value={form.unitPrice} onChange={f('unitPrice')} /></div>
          <div><label style={lbl}>GST (%)</label><input style={inp} type="number" min="0" max="28" placeholder="0" value={form.gst} onChange={f('gst')} /></div>
          <div><label style={lbl}>Min Quantity</label><input style={inp} type="number" min="0" placeholder="0" value={form.minQuantity} onChange={f('minQuantity')} /></div>
          <div><label style={lbl}>Max Quantity</label><input style={inp} type="number" min="0" placeholder="0" value={form.maxQuantity} onChange={f('maxQuantity')} /></div>
          <div><label style={lbl}>Reorder Point</label><input style={inp} type="number" min="0" placeholder="0" value={form.reorderPoint} onChange={f('reorderPoint')} /></div>
          <div><label style={lbl}>HSN Code</label><input style={inp} placeholder="HSN code" value={form.hsn} onChange={f('hsn')} /></div>
          <div><label style={lbl}>Barcode</label><input style={inp} placeholder="Barcode (optional)" value={form.barcode} onChange={f('barcode')} /></div>
          <div className="si-span2"><label style={lbl}>Description</label><textarea style={{...inp, height:60, resize:'vertical'}} placeholder="Optional description" value={form.description} onChange={f('description')} /></div>
        </div>
      </Modal>
    </>
  );
}
