import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/maintenance'; // Adjust if your backend port differs

export async function fetchAssets(building = '', criticality = '') {
  try {
    const params = {};
    if (building) params.building = building;
    if (criticality) params.criticality = criticality;
    
    const response = await axios.get(`${API_BASE_URL}/assets`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
}

export async function createAsset(assetData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/assets`, assetData);
    return response.data;
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
}

export async function fetchWorkOrders(status = '') {
  try {
    const params = {};
    if (status) params.status = status;
    
    const response = await axios.get(`${API_BASE_URL}/work-orders`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching work orders:', error);
    throw error;
  }
}

export async function createWorkOrder(workOrderData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders`, workOrderData);
    return response.data;
  } catch (error) {
    console.error('Error creating work order:', error);
    throw error;
  }
}

export async function closeWorkOrder(id, rootCauseAnalysis, assignedTechnician) {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/close`, {
      rootCauseAnalysis,
      assignedTechnician,
    });
    return response.data;
  } catch (error) {
    console.error('Error closing work order:', error);
    throw error;
  }
}