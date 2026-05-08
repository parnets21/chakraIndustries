import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getStorageLocations = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory-data/storage`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching storage locations:', error);
    throw error;
  }
};
