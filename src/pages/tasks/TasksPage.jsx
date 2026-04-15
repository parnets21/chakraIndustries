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
  { key: 'todo', label: 'To Do', color: '#6b7280', bg: '#f3f4f6' },
  { key: 'inProgress', label: 'In Progress', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'done', label: 'Done', color: '#10b981', bg: '#f0fdf4' },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Task Management</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Tasks</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {colConfig.map(col => (
          <div key={col.key} className="kpi-card" style={{ background: col.bg }}>
            <div className="kpi-value" style={{ color: col.color }}>{tasks[col.key].length}</div>
            <div className="kpi-label">{col.label}</div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {colConfig.map(col => (
          <div
            key={col.key}
            className="kanban-col"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (dragging) moveTask(dragging.id, dragging.col, col.key); setDragging(null); }}
          >
            <div className="kanban-col-header">
              <span style={{ color: col.color }}>{col.label}</span>
              <span className="status-badge" style={{ background: col.color, color: '#fff', fontSize: 11 }}>{tasks[col.key].length}</span>
            </div>
            {tasks[col.key].map(task => (
              <div
                key={task.id}
                className="kanban-card"
                draggable
                onDragStart={() => setDragging({ id: task.id, col: col.key })}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#718096', fontFamily: 'monospace' }}>{task.id}</span>
                  <StatusBadge status={task.priority} type={priorityType[task.priority]} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: (tagColor[task.tag] || '#6b7280') + '20', color: tagColor[task.tag] || '#6b7280' }}>{task.tag}</span>
                  <span style={{ fontSize: 11, color: '#718096' }}>Due: {task.due}</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, background: 'linear-gradient(135deg, #c0392b, #f39c12)' }}>
                    {task.assignee.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span style={{ fontSize: 11, color: '#718096' }}>{task.assignee}</span>
                </div>
                {col.key !== 'done' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {col.key === 'todo' && (
                      <button className="btn btn-sm" style={{ flex: 1, background: '#fef3c7', color: '#92400e', border: 'none' }} onClick={() => moveTask(task.id, 'todo', 'inProgress')}>Start →</button>
                    )}
                    {col.key === 'inProgress' && (
                      <button className="btn btn-sm" style={{ flex: 1, background: '#d1fae5', color: '#065f46', border: 'none' }} onClick={() => moveTask(task.id, 'inProgress', 'done')}>Complete ✓</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New Task</span>
              <button className="btn btn-sm" style={{ background: 'none', color: '#718096', fontSize: 20, padding: '0 4px' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Task Title *</label><input className="form-input" placeholder="Enter task title" /></div>
                <div className="form-group"><label className="form-label">Assignee</label><input className="form-input" placeholder="Name" /></div>
                <div className="form-group"><label className="form-label">Priority</label><select className="form-select"><option>Normal</option><option>High</option><option>Urgent</option></select></div>
                <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" /></div>
                <div className="form-group"><label className="form-label">Tag</label><select className="form-select"><option>Procurement</option><option>Inventory</option><option>Production</option><option>Finance</option></select></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Description</label><textarea className="form-textarea" placeholder="Task details..." /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
