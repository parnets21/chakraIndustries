import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/bulk-order-approvals`;

export const bulkOrderApprovalApi = {
  // Create approval workflow
  createApprovalWorkflow: (data) => axios.post(API_URL, data),

  // Get approval by ID
  getApprovalById: (id) => axios.get(`${API_URL}/${id}`),

  // Get pending approvals
  getPendingApprovals: (role) => axios.get(API_URL, { params: { role } }),

  // Approve at current level
  approveAtLevel: (id, remarks) => axios.patch(`${API_URL}/${id}/approve`, { remarks }),

  // Reject approval
  rejectApproval: (id, rejectionReason) => axios.patch(`${API_URL}/${id}/reject`, { rejectionReason }),

  // Get approval stats
  getApprovalStats: () => axios.get(`${API_URL}/stats/summary`)
};
