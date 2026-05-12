const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';

const getToken = () =>
  localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');

export const getPincodeStock = async () => {
  try {
    const res = await fetch(`${BASE}/inventory-data/pincode`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    console.log('Raw API response:', data);
    return {
      success: data.success === true,
      data: Array.isArray(data.data) ? data.data : [],
    };
  } catch (error) {
    console.error('Error fetching pincode stock:', error);
    return { success: false, data: [] };
  }
};
