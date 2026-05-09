const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// Get raw materials for dropdown
export const getRawMaterials = () => {
  return fetch(`${BASE}/bom/materials/raw`, { headers: authHeaders() }).then(handle);
};

// Get material with stock details
export const getMaterialWithStock = (materialId) => {
  return fetch(`${BASE}/bom/materials/${materialId}/stock`, { headers: authHeaders() }).then(handle);
};

// Create BOM
export const createBOM = (body) => {
  return fetch(`${BASE}/bom`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  }).then(handle);
};

// Get all BOMs
export const getBOMs = () => {
  return fetch(`${BASE}/bom`, { headers: authHeaders() }).then(handle);
};

// Get BOM by ID
export const getBOMById = (id) => {
  return fetch(`${BASE}/bom/${id}`, { headers: authHeaders() }).then(handle);
};

// Get BOM by Project ID
export const getBOMByProjectId = (projectId) => {
  return fetch(`${BASE}/bom/project/${projectId}`, { headers: authHeaders() }).then(handle);
};

// Update BOM
export const updateBOM = (id, body) => {
  return fetch(`${BASE}/bom/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body)
  }).then(handle);
};

// Delete BOM
export const deleteBOM = (id) => {
  return fetch(`${BASE}/bom/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  }).then(handle);
};

// Validate material availability
export const validateMaterialAvailability = (materials) => {
  return fetch(`${BASE}/bom/validate/availability`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ materials })
  }).then(handle);
};
