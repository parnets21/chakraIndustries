import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';

const tabs = ['Kanban Board', 'Daily To-Do', 'Recurring Templates', 'Notifications'];

const initialTasks = {
  todo: [
    { id: 'T-001', title: 'Review Q1 Inventory Report', priority: 'High', assignee: 'Priya Nair', due: '16 Apr', tag: 'Inventory' },
    { id: 'T-002', title: 'Approve PO-2024-089', priority: 'Urgent', assignee: 'Arjun Kumar', due: '15 Apr', tag: 'Procurement' },
    { id: 'T-003', title: 'Update BOM for Engine Assembly', priority: 'Normal', assignee: 'Ravi Sharma', due: '18 Apr', tag: 'Production' },
  ],
  inProgress: [
    { id: 'T-004', title: 'Vendor Evaluation — Shree Metals', priority: 'High', assignee: 'Suresh Jain', due: '17 Apr', tag: 'Procurement' },
    { id: 'T-005', title: 'WO-0892 Production Monitoring', priority: 'Normal', assignee: 'Anil Rao', due: '16 Apr', tag: 'Production' },
  ],
  done: [
    { id: 'T-006', title: 'GRN-0234 Quality Check', priority: 'High', assignee: 'Vijay Singh', due: '14 Apr', tag: 'Quality' },
    { id: 'T-007', title: 'Monthly Finance Reconciliation', priority: 'Normal', assignee: 'Meena Joshi', due: '13 Apr', tag: 'Finance' },
  ],
};

const priorityType = { Urgent: 'danger', High: 'warning', Normal: 'info', Low: 'gray' };
const tagColor = { Inventory: '#3b82f6', Procurement: '#8b5cf6', Production: '#f59e0b', Quality: '#10b981', Finance: '#ef4444' };

const colConfig = [
  { key: 'todo', label: 'To Do', color: '#6b7280', bg: 'bg-gray-100' },
  { key: 'inProgress', label: 'In Progress', color: '#f59e0b', bg: 'bg-amber-50' },
  { key: 'done', label: 'Done', color: '#10b981', bg: 'bg-green-50' },
];

const dailyTodos = [
  { id: 'DT-001', task: 'Check pending GRNs', module: 'Procurement', time: '09:00 AM', done: true, overdue: false },
  { id: 'DT-002', task: 'Review low stock alerts', module: 'Inventory', time: '10:00 AM', done: true, overdue: false },
  { id: 'DT-003', task: 'Approve WO-0892 progress update', module: 'Production', time: '11:30 AM', done: false, overdue: true },
  { id: 'DT-004', task: 'Follow up on PO-2024-089 approval', module: 'Procurement', time: '02:00 PM', done: false, overdue: false },
  { id: 'DT-005', task: 'Dispatch planning for ORD-2024-085', module: 'Logistics', time: '03:30 PM', done: false, overdue: false },
  { id: 'DT-006', task: 'End-of-day production report', module: 'Production', time: '06:00 PM', done: false, overdue: false },
];

const recurringTemplates = [
  { id: 'RT-001', title: 'Check pending GRNs', module: 'Procurement', frequency: 'Daily', time: '09:00 AM', assignee: 'Purchase Manager', active: true },
  { id: 'RT-002', title: 'Review low stock alerts', module: 'Inventory', frequency: 'Daily', time: '10:00 AM', assignee: 'Warehouse Manager', active: true },
  { id: 'RT-003', title: 'Weekly vendor payment review', module: 'Finance', frequency: 'Weekly (Mon)', time: '10:00 AM', assignee: 'Finance Manager', active: true },
  { id: 'RT-004', title: 'Monthly inventory reconciliation', module: 'Inventory', frequency: 'Monthly (1st)', time: '09:00 AM', assignee: 'Warehouse Manager', active: false },
  { id: 'RT-005', title: 'Daily dispatch planning', module: 'Logistics', frequency: 'Daily', time: '08:30 AM', assignee: 'Logistics Manager', active: true },
];

const notifications = [
  { id: 'N-001', title: 'PO #PO-2024-089 awaiting approval', module: 'Procurement', time: '5m ago', type: 'warning', read: false },
  { id: 'N-002', title: 'Low stock: SKU-1042 (Bearing 6205) — only 12 units', module: 'Inventory', time: '12m ago', type: 'danger', read: false },
  { id: 'N-003', title: 'GRN #GRN-0234 received successfully', module: 'Procurement', time: '1h ago', type: 'success', read: false },
  { id: 'N-004', title: 'Work Order WO-0891 completed', module: 'Production', time: '2h ago', type: 'info', read: true },
  { id: 'N-005', title: 'Task T-002 due today: Approve PO-2024-089', module: 'Tasks', time: '3h ago', type: 'warning', read: true },
  { id: 'N-006', title: 'Dispatch ORD-2024-085 — vehicle assigned', module: 'Logistics', time: '4h ago', type: 'success', read: true },
];

const notifColors = {
  warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', dot: '#f59e0b' },
  danger:  { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', dot: '#ef4444' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', dot: '#22c55e' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', dot: '#3b82f6' },
};

export default function TasksPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tasks, setTasks] = useState(initialTasks);
  const [dragging, setDragging] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [todos, setTodos] = useState(dailyTodos);

  const moveTask = (taskId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    const task = tasks[fromCol].find(t => t.id === taskId);
    setTasks(prev => ({
      ...prev,
      [fromCol]: prev[fromCol].filter(t => t.id !== taskId),
      [toCol]: [...prev[toCol], task],
    }));
  };

  const toggleTodo = (id) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {activeTab === 0 && <button onClick={() => setShowModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'linear-gradient(135deg,#ef4444,#b91c1c)',
          color:'#fff', border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
          boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
        }}>+ New Task</button>}
        {activeTab === 1 && <button style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'transparent', color:'#c0392b',
          border:'1.5px solid #c0392b', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
        }}>+ Add Item</button>}
        {activeTab === 2 && <button style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'transparent', color:'#c0392b',
          border:'1.5px solid #c0392b', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
        }}>+ New Template</button>}
        {activeTab === 3 && <button style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'transparent', color:'#c0392b',
          border:'1.5px solid #c0392b', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
        }}>Mark All Read</button>}
      </div>
      {activeTab === 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {colConfig.map(col => (
              <div key={col.key} className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all`}>
                <div className="text-2xl font-black tracking-tight" style={{ color: col.color }}>{tasks[col.key].length}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{col.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {colConfig.map(col => (
              <div
                key={col.key}
                className="min-w-[270px] bg-gray-50 rounded-2xl p-4 border border-gray-200 flex-shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (dragging) moveTask(dragging.id, dragging.col, col.key); setDragging(null); }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color: col.color }}>{col.label}</span>
                  <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: col.color }}>{tasks[col.key].length}</span>
                </div>
                {tasks[col.key].map(task => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl p-3.5 mb-2.5 border border-gray-200 shadow-sm cursor-grab hover:shadow-md hover:-translate-y-0.5 transition-all"
                    draggable
                    onDragStart={() => setDragging({ id: task.id, col: col.key })}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[11px] text-gray-400 font-mono">{task.id}</span>
                      <StatusBadge status={task.priority} type={priorityType[task.priority]} />
                    </div>
                    <div className="font-semibold text-[13px] text-gray-800 mb-2 leading-snug">{task.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: (tagColor[task.tag] || '#6b7280') + '20', color: tagColor[task.tag] || '#6b7280' }}>{task.tag}</span>
                      <span className="text-[11px] text-gray-400">Due: {task.due}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br from-red-500 to-amber-400">
                        {task.assignee.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[11px] text-gray-400">{task.assignee}</span>
                    </div>
                    {col.key !== 'done' && (
                      <div className="flex gap-1.5 mt-2">
                        {col.key === 'todo' && (
                          <button className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]" onClick={() => moveTask(task.id, 'todo', 'inProgress')}>Start →</button>
                        )}
                        {col.key === 'inProgress' && (
                          <button className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-800 font-semibold border-0 cursor-pointer font-[inherit]" onClick={() => moveTask(task.id, 'inProgress', 'done')}>Complete ✓</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-gray-800">Today's To-Do — 16 Apr 2024</div>
                <div className="text-xs text-gray-400 mt-0.5">{todos.filter(t => t.done).length}/{todos.length} completed</div>
              </div>
              <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(todos.filter(t => t.done).length / todos.length) * 100}%` }} />
              </div>
            </div>
            {todos.map((t, i) => (
              <div key={t.id} className={`flex items-center gap-3 py-3 ${i < todos.length - 1 ? 'border-b border-gray-100' : ''} ${t.overdue && !t.done ? 'bg-red-50/40 -mx-2 px-2 rounded-lg' : ''}`}>
                <button
                  onClick={() => toggleTodo(t.id)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center border-0 cursor-pointer ${t.done ? 'bg-green-500' : t.overdue ? 'border-red-400 bg-white' : 'border-gray-300 bg-white'}`}
                  style={{ border: t.done ? 'none' : t.overdue ? '2px solid #f87171' : '2px solid #d1d5db' }}
                >
                  {t.done && <span className="text-white text-[10px] font-bold">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${t.done ? 'line-through text-gray-400' : t.overdue ? 'text-red-700' : 'text-gray-800'}`}>
                    {t.task}
                    {t.overdue && !t.done && <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">OVERDUE</span>}
                  </div>
                  <div className="text-[11px] text-gray-400">{t.module} · {t.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Add To-Do Item</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Task *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="What needs to be done?" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Module</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Procurement</option><option>Inventory</option><option>Production</option><option>Logistics</option><option>Finance</option></select></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Time</label><input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
              <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">+ Add Item</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-gray-800">Recurring Task Templates</div>
                <div className="text-xs text-gray-400 mt-0.5">Auto-generated daily/weekly tasks</div>
              </div>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">+ New Template</button>
            </div>
            {recurringTemplates.map((t, i) => (
              <div key={i} className={`flex items-center justify-between py-3 ${i < recurringTemplates.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800">{t.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.module} · {t.frequency} · {t.time} · {t.assignee}</div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <div className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${t.active ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${t.active ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Add Recurring Template</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Task Title *</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="What needs to be done?" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Module</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]">
                  <option>Procurement</option><option>Inventory</option><option>Production</option><option>Logistics</option><option>Finance</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Frequency</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]">
                  <option>Daily</option><option>Weekly (Mon)</option><option>Weekly (Fri)</option><option>Monthly (1st)</option><option>Monthly (Last)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Time</label>
                <input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Assignee</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Role or name" />
              </div>
              <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Notifications & Reminders</div>
              <div className="text-xs text-gray-400 mt-0.5">{notifications.filter(n => !n.read).length} unread</div>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">Mark All Read</button>
          </div>
          <div className="flex flex-col gap-2">
            {notifications.map((n, i) => {
              const m = notifColors[n.type];
              return (
                <div key={n.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${n.read ? 'bg-white border-gray-100' : 'border'}`}
                  style={!n.read ? { background: m.bg, borderColor: m.border } : {}}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.read ? '#d1d5db' : m.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold ${n.read ? 'text-gray-500' : 'text-gray-800'}`}>{n.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{n.module}</span>
                      <span className="text-[11px] text-gray-400">·</span>
                      <span className="text-[11px] text-gray-400">{n.time}</span>
                    </div>
                  </div>
                  {!n.read && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: m.dot }}>NEW</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="text-base font-black text-gray-900">Create New Task</span>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-transparent text-gray-400 text-xl leading-none border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 mb-4 col-span-2"><label className="text-xs font-semibold text-gray-600">Task Title *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Enter task title" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Assignee</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Name" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Priority</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Normal</option><option>High</option><option>Urgent</option></select></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Due Date</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Tag</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Procurement</option><option>Inventory</option><option>Production</option><option>Finance</option></select></div>
                <div className="flex flex-col gap-1.5 mb-4 col-span-2"><label className="text-xs font-semibold text-gray-600">Description</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Task details..." /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2.5 justify-end">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
