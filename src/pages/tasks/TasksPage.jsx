import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';

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

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [dragging, setDragging] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const moveTask = (taskId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    const task = tasks[fromCol].find(t => t.id === taskId);
    setTasks(prev => ({
      ...prev,
      [fromCol]: prev[fromCol].filter(t => t.id !== taskId),
      [toCol]: [...prev[toCol], task],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Task Management</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Tasks</span>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]"
          onClick={() => setShowModal(true)}
        >
          + New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {colConfig.map(col => (
          <div key={col.key} className={`bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all ${col.bg}`}>
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
