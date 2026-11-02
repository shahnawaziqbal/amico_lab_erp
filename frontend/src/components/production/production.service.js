import axios from 'axios';

const API_BASE_URL = '/production';

export async function fetchAllBatches() {
  const res = await axios.get(`${API_BASE_URL}/batches`);
  return res.data || [];
}

export async function createProductionBatch(data) {
  const res = await axios.post(`${API_BASE_URL}/batches`, data);
  return res.data;
}

export async function updateBatchStatus(id, status, bmrStagesJson) {
  const res = await axios.patch(`${API_BASE_URL}/batches/${id}/status`, {
    status,
    bmrStagesJson,
  });
  return res.data;
}

export async function fetchAllBoms() {
  const res = await axios.get(`${API_BASE_URL}/boms`);
  return res.data || [];
}

export async function createBomRecipe(data) {
  const res = await axios.post(`${API_BASE_URL}/boms`, data);
  return res.data;
}