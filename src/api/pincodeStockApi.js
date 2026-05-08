import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getPincodeStock = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory-data/pincode`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // Ensure response has proper structure
    if (!response.data) {
      return { success: false, data: [] };
    }
    
    const data = response.data;
    console.log('Raw API response:', data);
    
    // Validate and sanitize response
    return {
      success: data.success === true,
      data: Array.isArray(data.data) ? data.data : []
    };
  } catch (error) {
    console.error('Error fetching pincode stock:', error);
    return { success: false, data: [] };
  }
};
