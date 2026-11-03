import axios from 'axios';

// Explicitly point to the NestJS backend running on port 3000
const API_BASE_URL = 'http://localhost:3000/requisitions';

export const fetchRequisitions = async () => {
  const response = await axios.get(API_BASE_URL);
  return response.data;
};

export const createRequisition = async (data) => {
  const response = await axios.post(API_BASE_URL, data);
  return response.data;
};

export const updateRequisitionStatus = async (id, status) => {
  const response = await axios.patch(`${API_BASE_URL}/${id}/status`, { status });
  return response.data;
};

export const deleteRequisition = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`);
  return response.data;
};