import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getAgeingStock = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory-data/ageing`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ageing stock:', error);
    throw error;
  }
};
