import { useState, useEffect } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import { MdCheckCircle, MdWarning, MdError, MdNotifications } from 'react-icons/md';

export default function CreditNoteTracker() {
  const [notes, setNotes] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCreditNotes();
  }, [filterStatus]);

  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockNotes = [
        {
          id: 'CN001',
          vendor: 'ABC Supplies',
          amount: 15000,
          status: 'Pending',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          issuedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          reason: 'Quality issue - partial return',
          priority: 'high'
        },
        {
          id: 'CN002',
          vendor: 'XYZ Industries',
          amount: 8500,
          status: 'Approved',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          issuedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          reason: 'Price adjustment',
          priority: 'medium'
        },
        {
          id: 'CN003',
          vendor: 'Global Traders',
          amount: 22000,
          status: 'Overdue',
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          issuedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          reason: 'Defective goods',
          priority: 'critical'
        }
      ];

      const filtered = filterStatus 
        ? mockNotes.filter(n => n.status === filterStatus)
        : mockNotes;

      setNotes(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return { bg: '#fef3c7', color: '#92400e' };
      case 'Approved': return { bg: '#dcfce7', color: '#166534' };
      case 'Overdue': return { bg: '#fee2e2', color: '#991b1b' };
      case 'Paid': return { bg: '#dbeafe', color: '#0c4a6e' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <MdError size={16} style={{ color: '#dc2626' }} />;
      case 'high': return <MdWarning size={16} style={{ color: '#f59e0b' }} />;
      default: return <MdNotifications size={16} style={{ color: '#3b82f6' }} />;
    }
  };

  const getDaysOverdue = (dueDate) => {
    const days = Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const stats = {
    total: notes.length,
    pending: notes.filter(n => n.status === 'Pending').length,
    overdue: notes.filter(n => n.status === 'Overdue').length,
    totalAmount: notes.reduce((sum, n) => sum + n.amount, 0)
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>TOTAL NOTES</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{stats.total}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>PENDING</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>OVERDUE</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{stats.overdue}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>TOTAL AMOUNT</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>₹{Math.round(stats.totalAmount).toLocaleString()}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Overdue</option>
          <option>Paid</option>
        </select>
      </div>

      {/* Credit Notes List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : notes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No credit notes found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11 }}>CN ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11 }}>VENDOR</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: 11 }}>AMOUNT</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11 }}>REASON</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11 }}>STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11 }}>DUE DATE</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#64748b', fontSize: 11 }}>ALERT</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => {
                  const statusColor = getStatusColor(note.status);
                  const daysOverdue = getDaysOverdue(note.dueDate);
                  const isOverdue = note.status === 'Overdue' || (new Date() > new Date(note.dueDate) && note.status !== 'Paid');

                  return (
                    <tr key={note.id} style={{ borderBottom: '1px solid #e2e8f0', background: isOverdue ? '#fef2f2' : 'transparent' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--primary)' }}>{note.id}</td>
                      <td style={{ padding: '12px' }}>{note.vendor}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>₹{note.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#64748b' }}>{note.reason}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: statusColor.bg,
                          color: statusColor.color,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          {note.status}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#64748b' }}>
                        {new Date(note.dueDate).toLocaleDateString('en-IN')}
                        {isOverdue && (
                          <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
                            {daysOverdue} days overdue
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {isOverdue && getPriorityIcon(note.priority)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
