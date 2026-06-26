import { useMemo, useState, useEffect } from "react";
import {
  MdPrecisionManufacturing, MdClose, MdWarning, MdSearch,
  MdFilterList, MdAutoAwesome, MdEditNote, MdCheckCircle,
  MdDeleteOutline, MdEdit, MdVisibility, MdSchedule,
  MdCalendarToday, MdBusiness, MdCurrencyRupee,
} from "react-icons/md";
import { vendorApi } from "../../api/vendorApi";
import { itemMasterApi } from "../../api/itemMasterApi";

/* ── tokens ── */
const C = {
  red:'#c0392b', red2:'#ef4444', redBg:'#fef2f2', redBorder:'#fecaca',
  green:'#16a34a', greenBg:'#f0fdf4', greenBorder:'#bbf7d0',
  amber:'#d97706', amberBg:'#fffbeb', amberBorder:'#fde68a',
  blue:'#2563eb', blueBg:'#eff6ff', blueBorder:'#bfdbfe',
  purple:'#7c3aed', purpleBg:'#f5f3ff', purpleBorder:'#ddd6fe',
  dark:'#0f172a', mid:'#475569', light:'#94a3b8',
  border:'1px solid #e2e8f0', bg:'#f8fafc', white:'#ffffff',
};

const inp = {
  width:'100%', padding:'10px 13px', border:'1px solid #e2e8f0', borderRadius:8,
  fontSize:13, outline:'none', background:'#fff', color:'#0f172a',
  fontFamily:'inherit', boxSizing:'border-box',
};
const inpAuto = { ...inp, background:'#f0fdf4', color:'#16a34a', fontWeight:600, cursor:'default' };
const inpCalc = { ...inp, background:'#eff6ff', color:'#2563eb', fontWeight:700, cursor:'default' };
const lbl  = { fontSize:11.5, fontWeight:700, color:'#475569', marginBottom:5, display:'block', letterSpacing:'.2px' };
const divL = { borderBottom:'1px solid #f1f5f9', margin:'18px 0' };

const blank = {
  productName:'', productCode:'', vendorId:'', companyName:'',
  productionDate:'', shift:'', damageReason:'',
  plannedQty:'', producedQty:'', goodQty:'', damagedQty:'', rejectedQty:'',
  unitPrice:'', costPrice:'', sellingPrice:'', gstPct:'',
};

const fmt = n => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 });
const today = () => new Date().toISOString().split('T')[0];

export default function ProductionManagementPage({ externalShowModal=false, onExternalModalClose }) {
  const [form, setForm]         = useState({ ...blank, productionDate: today() });
  const [list, setList]         = useState([]);
  const [editId, setEditId]     = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [month, setMonth]       = useState('');
  const [search, setSearch]     = useState('');
  const [err, setErr]           = useState('');
  const [internalOpen, setInternal] = useState(false);
  const [mode, setMode]         = useState('auto');
  const [vendors, setVendors]   = useState([]);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);

  const isOpen = externalShowModal || internalOpen;

  /* load dropdown data once modal opens */
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      vendorApi.getAll({ limit:200 }).catch(() => ({ data:[] })),
      itemMasterApi.getAll({ limit:500 }).catch(() => ({ data:[] })),
    ]).then(([vR, iR]) => {
      setVendors(vR.data || vR.vendors || []);
      setItems(iR.data || iR.items || []);
    }).finally(() => setLoading(false));
  }, [isOpen]);

  const closeForm = () => {
    setInternal(false);
    onExternalModalClose?.();
    setErr('');
    setForm({ ...blank, productionDate: today() });
    setEditId(null);
    setMode('auto');
  };

  const openEdit = (item) => {
    setForm({ ...blank, ...item });
    setEditId(item.id);
    setMode(item.dataMode || 'auto');
    setInternal(true);
  };

  const hChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  /* ── Auto mode: select product → fill all fields from item + vendor price ── */
  const hProduct = async (e) => {
    const id = e.target.value;
    const it = items.find(x => String(x._id || x.id) === id);
    if (!it) return;

    const name     = it.name || it.itemName || '';
    const code     = it.sku  || it.itemCode || '';
    const cost     = it.costPrice    || 0;
    const selling  = it.sellingPrice || 0;
    const unit     = it.unitPrice    || cost || 0;
    const gst      = it.gst          || 0;

    // start with item-level data
    setForm(p => ({
      ...p,
      productName: name,
      productCode: code,
      productionDate: p.productionDate || today(),
      unitPrice:    String(unit),
      costPrice:    String(cost),
      sellingPrice: String(selling),
      gstPct:       String(gst),
      vendorId: '',
      companyName: '',
    }));

    // now try to get vendor info from vendor price mapping
    setPriceLoading(true);
    try {
      const priceRes = await vendorApi.getPricesByProduct({ productCode: code, productName: name })
        .catch(() => null);

      const prices = priceRes?.data || priceRes?.prices || [];
      if (prices.length > 0) {
        const best = prices[0]; // take first vendor
        const vendorId   = String(best.vendor?._id || best.vendor || best.vendorId || '');
        const vendorName = best.vendor?.companyName || best.vendor?.name ||
                           vendors.find(v => String(v._id||v.id) === vendorId)?.companyName || '';
        setForm(p => ({
          ...p,
          vendorId,
          companyName: vendorName,
          unitPrice:   String(best.unitPrice || p.unitPrice),
        }));
      } else {
        // fallback: no vendor price mapping — leave vendor empty
      }
    } catch {
      // silent
    } finally {
      setPriceLoading(false);
    }
  };

  const hVendor = e => {
    const v = vendors.find(x => String(x._id || x.id) === e.target.value);
    setForm(p => ({ ...p, vendorId: e.target.value, companyName: v ? (v.companyName || v.name || '') : '' }));
  };

  /* ── price calculations ── */
  const calcTotals = (f) => {
    const produced  = Number(f.producedQty)  || 0;
    const good      = Number(f.goodQty)       || 0;
    const damaged   = Number(f.damagedQty)    || 0;
    const rejected  = Number(f.rejectedQty)   || 0;
    const unit      = Number(f.unitPrice)     || 0;
    const cost      = Number(f.costPrice)     || 0;
    const selling   = Number(f.sellingPrice)  || 0;
    const gstPct    = Number(f.gstPct)        || 0;

    const totalCost       = produced  * cost;
    const totalGoodValue  = good      * selling;
    const damagedCost     = damaged   * cost;
    const rejectedCost    = rejected  * cost;
    const gstOnGood       = totalGoodValue * gstPct / 100;
    const netProfit       = totalGoodValue - totalCost;
    const loss            = damagedCost + rejectedCost;

    return { totalCost, totalGoodValue, damagedCost, rejectedCost, gstOnGood, netProfit, loss };
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.productName || !form.companyName || !form.productionDate) {
      setErr('Product Name, Company and Production Date are required.');
      return;
    }
    const produced = Number(form.producedQty) || 0;
    const planned  = Number(form.plannedQty)  || 0;
    const damaged  = Number(form.damagedQty)  || 0;
    const good     = Number(form.goodQty)     || 0;
    const dmgPct = produced > 0 ? ((damaged / produced)*100).toFixed(1) : '0.0';
    const effPct = planned  > 0 ? ((good    / planned) *100).toFixed(1) : '0.0';
    const totals = calcTotals(form);

    if (editId) {
      setList(prev => prev.map(r => r.id === editId
        ? { ...r, ...form, dmgPct, effPct, dataMode: mode, ...totals }
        : r));
    } else {
      setList(prev => [{ id: Date.now(), ...form, dmgPct, effPct, dataMode: mode, ...totals }, ...prev]);
    }
    closeForm();
  };

  const del = id => setList(prev => prev.filter(i => i.id !== id));

  const filtered = useMemo(() => list.filter(item => {
    const mOk = month ? item.productionDate.startsWith(month) : true;
    const sOk = !search.trim() ||
      (item.companyName||'').toLowerCase().includes(search.toLowerCase()) ||
      (item.productName||'').toLowerCase().includes(search.toLowerCase());
    return mOk && sOk;
  }), [list, month, search]);

  /* live calc for preview */
  const liveT = calcTotals(form);
  const liveDmg = Number(form.producedQty) > 0 ? ((Number(form.damagedQty||0)/Number(form.producedQty))*100).toFixed(1) : '0.0';
  const liveEff = Number(form.plannedQty)  > 0 ? ((Number(form.goodQty||0)/Number(form.plannedQty))*100).toFixed(1) : '0.0';

  const selectedItemId = items.find(i => (i.name||i.itemName) === form.productName)?._id ||
                         items.find(i => (i.name||i.itemName) === form.productName)?.id || '';

  const modeBtn = (m, label, Icon) => (
    <button type="button" onClick={() => setMode(m)} style={{
      display:'flex', alignItems:'center', gap:7, padding:'9px 22px', borderRadius:9,
      border: m===mode ? 'none' : '1px solid #e2e8f0',
      background: m===mode ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : C.white,
      color: m===mode ? '#fff' : C.dark,
      fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
      boxShadow: m===mode ? '0 3px 10px rgba(185,28,28,.28)' : '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <Icon size={15}/>{label}
    </button>
  );

  const NumF = ({ name, label }) => (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <label style={lbl}>{label}</label>
      <input type="number" name={name} value={form[name]} onChange={hChange}
        min={0} style={inp} placeholder="0" autoComplete="off"/>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      {isOpen && (
        <div onClick={closeForm} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.52)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:18, width:'100%', maxWidth:900, maxHeight:'95vh', overflow:'auto', boxShadow:'0 32px 80px rgba(15,23,42,.28)' }}>

            {/* header */}
            <div style={{ padding:'18px 26px', borderBottom:C.border, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:C.white, zIndex:2 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#ef4444,#b91c1c)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(185,28,28,.35)' }}>
                  <MdPrecisionManufacturing size={22} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:C.dark }}>{editId ? 'Edit Production Entry' : 'New Production Entry'}</div>
                  <div style={{ fontSize:11.5, color:C.light, marginTop:1 }}>Fill in all production details below</div>
                </div>
              </div>
              <button onClick={closeForm} style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:C.white, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.mid }}>
                <MdClose size={18}/>
              </button>
            </div>

            {/* mode toggle */}
            <div style={{ padding:'13px 26px', borderBottom:C.border, background:'#fafbfc', display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:C.mid, whiteSpace:'nowrap' }}>Entry Mode:</div>
              <div style={{ display:'flex', gap:10 }}>
                {modeBtn('auto',   'Auto Entry',   MdAutoAwesome)}
                {modeBtn('manual', 'Manual Entry', MdEditNote)}
              </div>
              {mode==='auto' && (
                <div style={{ fontSize:11.5, color:C.blue, fontWeight:600, display:'flex', alignItems:'center', gap:5, marginLeft:4 }}>
                  <MdAutoAwesome size={12}/> Select product — company, code & price auto-fill from vendor records.
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ padding:'22px 26px 26px' }}>
              {err && (
                <div style={{ marginBottom:16, padding:'11px 15px', background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:9, fontSize:13, color:C.red, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                  <MdWarning size={17}/>{err}
                </div>
              )}

              {/* ── Row 1: Product Name + Product Code ── */}
              <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Product Name <span style={{ color:C.red }}>*</span></label>
                  {mode==='auto' ? (
                    loading
                      ? <div style={{ ...inp, color:C.light }}>Loading products…</div>
                      : <select value={selectedItemId} onChange={hProduct} style={inp}>
                          <option value="">— Select Product —</option>
                          {items.map(i=><option key={i._id||i.id} value={i._id||i.id}>{i.name||i.itemName}</option>)}
                        </select>
                  ) : (
                    <input type="text" name="productName" value={form.productName} onChange={hChange} placeholder="Type product name" autoComplete="off" style={inp}/>
                  )}
                  {mode==='auto' && form.productName && (
                    <span style={{ fontSize:11, color:C.green, marginTop:4, fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                      <MdCheckCircle size={12}/>{form.productName}
                    </span>
                  )}
                </div>
                <div>
                  <label style={lbl}>Product Code (SKU)</label>
                  <input type="text" name="productCode" value={form.productCode} onChange={hChange}
                    placeholder={mode==='auto' ? 'Auto-filled' : 'e.g. SKU-001'}
                    readOnly={mode==='auto' && !!form.productCode}
                    autoComplete="off"
                    style={mode==='auto' && form.productCode ? inpAuto : inp}/>
                </div>
              </div>

              {/* ── Row 2: Vendor/Company + Production Date ── */}
              <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Vendor / Company <span style={{ color:C.red }}>*</span></label>
                  {mode==='auto' ? (
                    priceLoading
                      ? <div style={{ ...inp, color:C.light, display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ width:14, height:14, borderRadius:'50%', border:'2px solid #bfdbfe', borderTopColor:C.blue, animation:'spin 0.7s linear infinite', display:'inline-block' }}/>
                          Looking up vendor…
                        </div>
                      : <>
                          <input type="text" value={form.companyName} readOnly
                            style={form.companyName ? inpAuto : { ...inp, color:C.light }}
                            placeholder="Auto-filled when product is selected"/>
                          {/* allow manual override */}
                          {!form.companyName && !loading && (
                            <select name="vendorId" value={form.vendorId} onChange={hVendor}
                              style={{ ...inp, marginTop:6 }}>
                              <option value="">— Or pick vendor manually —</option>
                              {vendors.map(v=><option key={v._id||v.id} value={v._id||v.id}>{v.companyName||v.name}</option>)}
                            </select>
                          )}
                        </>
                  ) : (
                    <input type="text" name="companyName" value={form.companyName} onChange={hChange} placeholder="Company name" autoComplete="off" style={inp}/>
                  )}
                  {mode==='auto' && form.companyName && (
                    <span style={{ fontSize:11, color:C.green, marginTop:4, fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                      <MdCheckCircle size={12}/>{form.companyName}
                    </span>
                  )}
                </div>
                <div>
                  <label style={lbl}>Production Date <span style={{ color:C.red }}>*</span></label>
                  <input type="date" name="productionDate" value={form.productionDate} onChange={hChange} style={inp}/>
                </div>
              </div>

              {/* ── Row 3: Shift + Damage Reason ── */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Shift</label>
                  <select name="shift" value={form.shift} onChange={hChange} style={inp}>
                    <option value="">— Select Shift —</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Damage Reason</label>
                  <input type="text" name="damageReason" value={form.damageReason} onChange={hChange} placeholder="Optional" autoComplete="off" style={inp}/>
                </div>
              </div>

              <div style={divL}/>

              {/* ── Row 4: Qty fields ── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:18 }}>
                <NumF name="plannedQty"  label="Planned Qty"/>
                <NumF name="producedQty" label="Produced Qty"/>
                <NumF name="goodQty"     label="Good Qty"/>
                <NumF name="damagedQty"  label="Damaged Qty"/>
                <NumF name="rejectedQty" label="Rejected Qty"/>
              </div>

              <div style={divL}/>

              {/* ── Row 5: Price fields ── */}
              <div style={{ fontSize:11.5, fontWeight:700, color:C.mid, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                <MdCurrencyRupee size={13}/> Pricing
                {mode==='auto' && form.unitPrice && (
                  <span style={{ fontSize:11, color:C.green, fontWeight:600 }}> — auto-filled from vendor price</span>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18 }}>
                <div>
                  <label style={lbl}>Unit Price (₹)</label>
                  <input type="number" name="unitPrice" value={form.unitPrice} onChange={hChange} min={0}
                    style={mode==='auto' && form.unitPrice ? inpAuto : inp} placeholder="0.00" autoComplete="off"/>
                </div>
                <div>
                  <label style={lbl}>Cost Price (₹)</label>
                  <input type="number" name="costPrice" value={form.costPrice} onChange={hChange} min={0}
                    style={mode==='auto' && form.costPrice ? inpAuto : inp} placeholder="0.00" autoComplete="off"/>
                </div>
                <div>
                  <label style={lbl}>Selling Price (₹)</label>
                  <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={hChange} min={0}
                    style={mode==='auto' && form.sellingPrice ? inpAuto : inp} placeholder="0.00" autoComplete="off"/>
                </div>
                <div>
                  <label style={lbl}>GST %</label>
                  <input type="number" name="gstPct" value={form.gstPct} onChange={hChange} min={0} max={100}
                    style={mode==='auto' && form.gstPct ? inpAuto : inp} placeholder="0" autoComplete="off"/>
                </div>
              </div>

              {/* ── Live Calculation Summary ── */}
              {(form.producedQty || form.plannedQty || form.unitPrice) && (
                <>
                  <div style={divL}/>
                  <div style={{ fontSize:11.5, fontWeight:700, color:C.mid, marginBottom:10 }}>Live Summary</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:10 }}>
                    <div style={{ background:C.greenBg, border:`1px solid ${C.greenBorder}`, borderRadius:9, padding:'10px 14px' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:3 }}>Good Value</div>
                      <div style={{ fontSize:15, fontWeight:800, color:C.green }}>₹{fmt(liveT.totalGoodValue)}</div>
                      <div style={{ fontSize:10, color:C.mid, marginTop:2 }}>Eff. {liveEff}%</div>
                    </div>
                    <div style={{ background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:9, padding:'10px 14px' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:3 }}>Loss (Dmg+Rej)</div>
                      <div style={{ fontSize:15, fontWeight:800, color:C.red }}>₹{fmt(liveT.loss)}</div>
                      <div style={{ fontSize:10, color:C.mid, marginTop:2 }}>Dmg {liveDmg}%</div>
                    </div>
                    <div style={{ background: liveT.netProfit>=0 ? C.greenBg : C.redBg, border:`1px solid ${liveT.netProfit>=0 ? C.greenBorder : C.redBorder}`, borderRadius:9, padding:'10px 14px' }}>
                      <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:3 }}>Net Profit / Loss</div>
                      <div style={{ fontSize:15, fontWeight:800, color: liveT.netProfit>=0 ? C.green : C.red }}>₹{fmt(liveT.netProfit)}</div>
                      <div style={{ fontSize:10, color:C.mid, marginTop:2 }}>Total Cost ₹{fmt(liveT.totalCost)}</div>
                    </div>
                  </div>
                  {form.gstPct ? (
                    <div style={{ fontSize:12, color:C.amber, fontWeight:600, padding:'6px 12px', background:C.amberBg, borderRadius:7, border:`1px solid ${C.amberBorder}`, display:'inline-block' }}>
                      GST ({form.gstPct}%) on good value: ₹{fmt(liveT.gstOnGood)}
                    </div>
                  ) : null}
                </>
              )}

              {/* footer */}
              <div style={{ display:'flex', gap:12, justifyContent:'flex-end', paddingTop:18, marginTop:6, borderTop:'1px solid #f1f5f9' }}>
                <button type="button" onClick={closeForm} style={{ padding:'10px 28px', borderRadius:9, border:'1px solid #e2e8f0', background:C.white, color:C.mid, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding:'10px 30px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(185,28,28,.32)', display:'flex', alignItems:'center', gap:8 }}>
                  <MdPrecisionManufacturing size={16}/>
                  {editId ? 'Update Production' : 'Save Production'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ VIEW MODAL ══════════ */}
      {viewItem && (
        <div onClick={()=>setViewItem(null)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.52)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.white, borderRadius:16, width:'100%', maxWidth:680, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 60px rgba(15,23,42,.26)' }}>

            <div style={{ padding:'16px 22px', borderBottom:C.border, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#ef4444,#b91c1c)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MdVisibility size={19} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:C.dark }}>Production Details</div>
                  <div style={{ fontSize:11, color:C.light }}>{viewItem.productName} — {viewItem.productionDate}</div>
                </div>
              </div>
              <button onClick={()=>setViewItem(null)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:C.white, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.mid }}><MdClose size={17}/></button>
            </div>

            <div style={{ padding:'20px 22px' }}>
              {/* info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  ['Product', viewItem.productName||'—'],
                  ['Code',    viewItem.productCode||'—'],
                  ['Company', viewItem.companyName||'—'],
                  ['Date',    viewItem.productionDate||'—'],
                  ['Shift',   viewItem.shift||'—'],
                  ['Dmg Reason', viewItem.damageReason||'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{ background:C.bg, borderRadius:8, padding:'9px 13px' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:C.dark }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* qty row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
                {[['Planned',viewItem.plannedQty,C.blue],['Produced',viewItem.producedQty,C.dark],['Good',viewItem.goodQty,C.green],['Damaged',viewItem.damagedQty,C.amber],['Rejected',viewItem.rejectedQty,C.red]].map(([k,v,col])=>(
                  <div key={k} style={{ background:C.bg, borderRadius:8, padding:'9px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:17, fontWeight:800, color:col }}>{v||'—'}</div>
                  </div>
                ))}
              </div>

              {/* price metrics */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                {[
                  ['Unit Price',    `₹${fmt(viewItem.unitPrice)}`,    C.blue],
                  ['Cost Price',    `₹${fmt(viewItem.costPrice)}`,    C.dark],
                  ['Selling Price', `₹${fmt(viewItem.sellingPrice)}`, C.green],
                  ['GST %',         `${viewItem.gstPct||0}%`,         C.amber],
                ].map(([k,v,col])=>(
                  <div key={k} style={{ background:C.bg, borderRadius:8, padding:'9px 12px', textAlign:'center' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:14, fontWeight:800, color:col }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* financials */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                <div style={{ background:C.greenBg, borderRadius:9, padding:'12px 14px', border:`1px solid ${C.greenBorder}`, textAlign:'center' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:4 }}>Good Value</div>
                  <div style={{ fontSize:18, fontWeight:900, color:C.green }}>₹{fmt(viewItem.totalGoodValue)}</div>
                </div>
                <div style={{ background:C.redBg, borderRadius:9, padding:'12px 14px', border:`1px solid ${C.redBorder}`, textAlign:'center' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:4 }}>Loss</div>
                  <div style={{ fontSize:18, fontWeight:900, color:C.red }}>₹{fmt(viewItem.loss)}</div>
                  <div style={{ fontSize:10, color:C.mid }}>Dmg {viewItem.dmgPct}%</div>
                </div>
                <div style={{ background: (viewItem.netProfit||0)>=0 ? C.greenBg : C.redBg, borderRadius:9, padding:'12px 14px', border:`1px solid ${(viewItem.netProfit||0)>=0 ? C.greenBorder : C.redBorder}`, textAlign:'center' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', marginBottom:4 }}>Net Profit</div>
                  <div style={{ fontSize:18, fontWeight:900, color:(viewItem.netProfit||0)>=0?C.green:C.red }}>₹{fmt(viewItem.netProfit)}</div>
                  <div style={{ fontSize:10, color:C.mid }}>Eff {viewItem.effPct}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TABLE ══════════ */}
      <div style={{ background:C.white, border:C.border, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(15,23,42,.06)' }}>
        <div style={{ padding:'12px 20px', borderBottom:C.border, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
            <MdPrecisionManufacturing size={15} color={C.red}/>
            <span style={{ fontSize:13, fontWeight:800, color:C.dark }}>Production Report</span>
            <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:C.redBg, color:C.red }}>{filtered.length} entries</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:C.bg, border:C.border, borderRadius:8, padding:'7px 10px' }}>
            <MdFilterList size={13} color={C.mid}/>
            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} style={{ border:'none', outline:'none', background:'transparent', fontSize:12, color:C.dark, fontFamily:'inherit' }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:C.bg, border:C.border, borderRadius:8, padding:'7px 10px' }}>
            <MdSearch size={13} color={C.mid}/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{ border:'none', outline:'none', background:'transparent', fontSize:12, color:C.dark, fontFamily:'inherit', width:160 }}/>
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1200, fontSize:12 }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {['#','Product','Code','Company','Date','Planned','Produced','Good','Damaged','Rej','Dmg%','Eff%','Good Value','Loss','Net P/L','Shift','Action'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:10, fontWeight:700, color:C.light, textTransform:'uppercase', letterSpacing:'.4px', borderBottom:C.border, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={17} style={{ padding:'50px 0', textAlign:'center' }}>
                  <MdPrecisionManufacturing size={34} color={C.light} style={{ display:'block', margin:'0 auto 8px' }}/>
                  <span style={{ color:C.light, fontSize:13 }}>No entries yet. Click "+ Add Production" to start.</span>
                </td></tr>
              ) : filtered.map((item,i)=>{
                const dmg = parseFloat(item.dmgPct||0);
                const eff = parseFloat(item.effPct||0);
                const pl  = Number(item.netProfit||0);
                return (
                  <tr key={item.id}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafbfc'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'9px 10px', color:C.light, fontWeight:700 }}>{i+1}</td>
                    <td style={{ padding:'9px 10px', color:C.dark, fontWeight:600, whiteSpace:'nowrap' }}>{item.productName||'—'}</td>
                    <td style={{ padding:'9px 10px', color:C.mid, fontFamily:'monospace', fontSize:11 }}>{item.productCode||'—'}</td>
                    <td style={{ padding:'9px 10px', color:C.dark, whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}><MdBusiness size={11} color={C.light}/>{item.companyName||'—'}</div>
                    </td>
                    <td style={{ padding:'9px 10px', color:C.dark, whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}><MdCalendarToday size={10} color={C.light}/>{item.productionDate}</div>
                    </td>
                    <td style={{ padding:'9px 10px', color:C.blue, fontWeight:700 }}>{item.plannedQty||'—'}</td>
                    <td style={{ padding:'9px 10px', color:C.dark, fontWeight:700 }}>{item.producedQty||'—'}</td>
                    <td style={{ padding:'9px 10px', color:C.green, fontWeight:700 }}>{item.goodQty||'—'}</td>
                    <td style={{ padding:'9px 10px', color:C.amber, fontWeight:700 }}>{item.damagedQty||'—'}</td>
                    <td style={{ padding:'9px 10px', color:C.red2, fontWeight:700 }}>{item.rejectedQty||'—'}</td>
                    <td style={{ padding:'9px 10px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:dmg>10?C.redBg:C.amberBg, color:dmg>10?C.red:C.amber }}>{item.dmgPct}%</span>
                    </td>
                    <td style={{ padding:'9px 10px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700, background:eff>=80?C.greenBg:C.amberBg, color:eff>=80?C.green:C.amber }}>{item.effPct}%</span>
                    </td>
                    <td style={{ padding:'9px 10px', color:C.green, fontWeight:700, whiteSpace:'nowrap' }}>₹{fmt(item.totalGoodValue)}</td>
                    <td style={{ padding:'9px 10px', color:C.red, fontWeight:700, whiteSpace:'nowrap' }}>₹{fmt(item.loss)}</td>
                    <td style={{ padding:'9px 10px', whiteSpace:'nowrap' }}>
                      <span style={{ fontWeight:800, color: pl>=0 ? C.green : C.red }}>₹{fmt(pl)}</span>
                    </td>
                    <td style={{ padding:'9px 10px' }}>
                      {item.shift ? <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background:C.blueBg, color:C.blue, display:'flex', alignItems:'center', gap:3, width:'fit-content' }}><MdSchedule size={10}/>{item.shift}</span> : '—'}
                    </td>
                    <td style={{ padding:'9px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <button onClick={()=>setViewItem(item)} title="View" style={{ display:'flex', alignItems:'center', gap:3, padding:'4px 9px', background:C.blueBg, color:C.blue, border:`1px solid ${C.blueBorder}`, borderRadius:6, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                          <MdVisibility size={12}/> View
                        </button>
                        <button onClick={()=>openEdit(item)} title="Edit" style={{ display:'flex', alignItems:'center', gap:3, padding:'4px 9px', background:C.amberBg, color:C.amber, border:`1px solid ${C.amberBorder}`, borderRadius:6, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                          <MdEdit size={12}/> Edit
                        </button>
                        <button onClick={()=>del(item.id)} title="Delete" style={{ display:'flex', alignItems:'center', gap:3, padding:'4px 9px', background:C.redBg, color:C.red, border:`1px solid ${C.redBorder}`, borderRadius:6, fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>
                          <MdDeleteOutline size={12}/> Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* totals footer */}
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background:'#fafbfc', borderTop:'2px solid #e2e8f0' }}>
                  <td colSpan={12} style={{ padding:'9px 10px', fontSize:11, fontWeight:800, color:C.dark }}>TOTALS</td>
                  <td style={{ padding:'9px 10px', color:C.green, fontWeight:800, whiteSpace:'nowrap' }}>
                    ₹{fmt(filtered.reduce((s,r)=>s+Number(r.totalGoodValue||0),0))}
                  </td>
                  <td style={{ padding:'9px 10px', color:C.red, fontWeight:800, whiteSpace:'nowrap' }}>
                    ₹{fmt(filtered.reduce((s,r)=>s+Number(r.loss||0),0))}
                  </td>
                  <td style={{ padding:'9px 10px', fontWeight:800, whiteSpace:'nowrap' }}>
                    {(()=>{ const t=filtered.reduce((s,r)=>s+Number(r.netProfit||0),0); return <span style={{ color:t>=0?C.green:C.red }}>₹{fmt(t)}</span>; })()}
                  </td>
                  <td colSpan={2}/>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
