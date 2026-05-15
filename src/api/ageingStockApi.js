import axiosInstance from './axiosConfig';

export const getAgeingStock = async () => {
  try {
    const response = await axiosInstance.get('/inventory-data/ageing');
    // response.data is the axios response body: { success, data: [...] }
    // Wrap it so callers can do ageingRes.data to get the array
    return { data: response.data?.data || response.data || [] };
  } catch (error) {
    console.error('Error fetching ageing stock:', error);
    return { data: [] };
  }
};
