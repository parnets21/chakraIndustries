import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getDefectiveStock = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory-data/defective`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching defective stock:', error);
    throw error;
  }
};

export const createDefectiveStock = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/inventory-data/defective/create`, data, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating defective stock:', error);
    throw error;
  }
};
