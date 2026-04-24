const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const vendorPriceApi = {
  // Get all prices for a vendor
  async getVendorPrices(vendorId) {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/prices`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Add a price entry for a vendor
  async addPrice(vendorId, data) {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Update a price entry
  async updatePrice(vendorId, priceId, data) {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/prices/${priceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Delete a price entry
  async deletePrice(vendorId, priceId) {
    const res = await fetch(`${API_BASE}/vendors/${vendorId}/prices/${priceId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Compare prices across vendors for a product
  async getPricesByProduct(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/vendors/prices/product${query ? '?' + query : ''}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
