import axiosInstance from './axiosConfig';

export const getAgeingStock = async () => {
  try {
    const response = await axiosInstance.get('/inventory-data/ageing');
    // response.data is the axios response body: { success, data: [...] }
    return response.data;
  } catch (error) {
    console.error('Error fetching ageing stock:', error);
    return { success: false, data: [] };
  }
};
