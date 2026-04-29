import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/common/Toast';
import { taskApi } from '../../api/taskApi';

const priorityType = { Urgent: 'danger', High: 'warning', Normal: 'info', Low: 'gray' };
const tagColor = { Inventory: '#3b82f6', Procurement: '#8b5cf6', Production: '#f59e0b', Quality: '#10b981', Finance: '#ef4444', General: '#6b7280' };
const colConfig = [
  { key: 'todo',       label: 'To Do',       color: '#6b7280' },
  { key: 'inProgress', label: 'In Progress',  color: '#f59e0b' },
  { key: 'done',       label: 'Done',         color: '#10b981' },
];

export default function TasksPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tasks, setTasks]         = useState({ todo: [], inProgress: [], done: [] });
  const [dragging, setDragging]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [taskForm, setTaskForm]   = useState({ title: '', priority: 'Normal', assignee: '', due: '', tag: 'Procurement' });
  const [saving, setSaving]       = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await taskApi.getAll();
      const all = res.data || [];
      setTasks({
        todo:       all.filter(t => t.status === 'todo'),
        inProgress: all.filter(t => t.status === 'inProgress'),
        done:       all.filter(t => t.status === 'done'),
      });
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const moveTask = async (taskId, fromCol, toCol) => {
    if (fromCol === toCol) return;
    try {
      await taskApi.updateStatus(taskId, { status: toCol });
      await fetchTasks();
      toast(`Moved to ${toCol === 'todo' ? 'To Do' : toCol === 'inProgress' ? 'In Progress' : 'Done'}`);
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) { toast('Task title is required', 'error'); return; }
    setSaving(true);
    try {
      await taskApi.create({
        title: taskForm.title,
        priority: taskForm.priority,
        assignee: taskForm.assignee || 'Unassigned',
        dueDate: taskForm.due || undefined,
        tag: taskForm.tag,
        status: 'todo',
      });
      setTaskForm({ title: '', priority: 'Normal', assignee: '', due: '', tag: 'Procurement' });
      setShowModal(false);
      await fetchTasks();
      toast('Task created');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await taskApi.delete(id);
      await fetchTasks();
      toast('Task deleted');
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 20 }}>
        {activeTab === 0 && (
          <button onClick={() => setShowModal(true)} style={{
            padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>+ New Task</button>
        )}
      </div>

      {activeTab === 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {colConfig.map(col => (
              <div key={col.key} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="text-2xl font-black tracking-tight" style={{ color: col.color }}>{tasks[col.key].length}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{col.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {colConfig.map(col => (
              <div key={col.key} className="min-w-[270px] bg-gray-50 rounded-2xl p-4 border border-gray-200 flex-shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (dragging) moveTask(dragging.id, dragging.col, col.key); setDragging(null); }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color: col.color }}>{col.label}</span>
                  <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: col.color }}>{tasks[col.key].length}</span>
                </div>
                {tasks[col.key].length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No tasks</div>
                )}
                {tasks[col.key].map(task => (
                  <div key={task._id} className="bg-white rounded-xl p-3.5 mb-2.5 border border-gray-200 shadow-sm cursor-grab hover:shadow-md hover:-translate-y-0.5 transition-all"
                    draggable onDragStart={() => setDragging({ id: task._id, col: col.key })}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[11px] text-gray-400 font-mono">{task.taskId}</span>
                      <StatusBadge status={task.priority} type={priorityType[task.priority]} />
                    </div>
                    <div className="font-semibold text-[13px] text-gray-800 mb-2 leading-snug">{task.title}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: (tagColor[task.tag] || '#6b7280') + '20', color: tagColor[task.tag] || '#6b7280' }}>{task.tag}</span>
                      {task.dueDate && <span className="text-[11px] text-gray-400">Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br from-red-500 to-amber-400">
                          {(task.assignee || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-[11px] text-gray-400">{task.assignee}</span>
                      </div>
                      <button onClick={() => handleDelete(task._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, padding: 2 }}>×</button>
                    </div>
                    {col.key !== 'done' && (
                      <div className="flex gap-1.5 mt-2">
                        {col.key === 'todo' && (
                          <button className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]"
                            onClick={() => moveTask(task._id, 'todo', 'inProgress')}>Start →</button>
                        )}
                        {col.key === 'inProgress' && (
                          <button className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-800 font-semibold border-0 cursor-pointer font-[inherit]"
                            onClick={() => moveTask(task._id, 'inProgress', 'done')}>Complete ✓</button>
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

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="text-base font-black text-gray-900">Create New Task</span>
              <button className="text-gray-400 text-xl border-0 bg-transparent cursor-pointer" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-semibold text-gray-600">Task Title *</label>
                <input className="form-input" placeholder="Enter task title" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Assignee</label>
                <input className="form-input" placeholder="Name" value={taskForm.assignee} onChange={e => setTaskForm(p => ({ ...p, assignee: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Priority</label>
                <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                  <option>Normal</option><option>High</option><option>Urgent</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Due Date</label>
                <input type="date" className="form-input" value={taskForm.due} onChange={e => setTaskForm(p => ({ ...p, due: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Tag</label>
                <select className="form-select" value={taskForm.tag} onChange={e => setTaskForm(p => ({ ...p, tag: e.target.value }))}>
                  <option>Procurement</option><option>Inventory</option><option>Production</option><option>Finance</option><option>General</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2.5 justify-end">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateTask} disabled={saving}>{saving ? 'Creating...' : 'Create Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
