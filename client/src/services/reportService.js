import apiClient from './apiClient';

const getSampleReport = async () => {
  const response = await apiClient.get('/reports/sample');
  return response.data.data;
};

export const reportService = {
  getSampleReport,
};
