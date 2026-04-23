const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const creditNoteApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/credit-notes${query ? '?' + query : ''}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getById(id) {
    const res = await fetch(`${API_BASE}/credit-notes/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async create(data) {
    const res = await fetch(`${API_BASE}/credit-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async update(id, data) {
    const res = await fetch(`${API_BASE}/credit-notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateStatus(id, status) {
    const res = await fetch(`${API_BASE}/credit-notes/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async sendReminder(id) {
    const res = await fetch(`${API_BASE}/credit-notes/${id}/send-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getOverdue() {
    const res = await fetch(`${API_BASE}/credit-notes/overdue`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/credit-notes/stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async delete(id) {
    const res = await fetch(`${API_BASE}/credit-notes/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
