import axiosInstance from './axiosConfig';

export const getAgeingStock = async () => {
  try {
    const response = await axiosInstance.get('/inventory-data/ageing');
    return response.data;
  } catch (error) {
    console.error('Error fetching ageing stock:', error);
    throw error;
  }
};
