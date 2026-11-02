import axios from 'axios';

// Create an Axios instance configured for the NestJS backend
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const financeApi = {
  // Chart of Accounts
  getChartOfAccounts: async () => {
    try {
      const response = await api.get('/finance/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      throw error;
    }
  },

  createAccount: async (accountData) => {
    try {
      const response = await api.post('/finance/accounts', accountData);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  // Parties & Vendors
  getParties: async () => {
    try {
      const response = await api.get('/finance/parties');
      return response.data;
    } catch (error) {
      console.error('Error fetching parties:', error);
      throw error;
    }
  },

  createParty: async (partyData) => {
    try {
      const response = await api.post('/finance/parties', partyData);
      return response.data;
    } catch (error) {
      console.error('Error creating party:', error);
      throw error;
    }
  },

  // Cost Centers
  getCostCenters: async () => {
    try {
      const response = await api.get('/finance/cost-centers');
      return response.data;
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      throw error;
    }
  },

  createCostCenter: async (costCenterData) => {
    try {
      const response = await api.post('/finance/cost-centers', costCenterData);
      return response.data;
    } catch (error) {
      console.error('Error creating cost center:', error);
      throw error;
    }
  },

  // Journal Entries & Vouchers
  getJournalEntries: async () => {
    try {
      const response = await api.get('/finance/journal-entries');
      return response.data;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  },

  createJournalEntry: async (entryData) => {
    try {
      const response = await api.post('/finance/journal-entries', entryData);
      return response.data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },

  // Overheads & Salaries
  upsertOverhead: async (overheadData) => {
    try {
      const response = await api.post('/finance/overheads', overheadData);
      return response.data;
    } catch (error) {
      console.error('Error saving overhead data:', error);
      throw error;
    }
  },

  // Financial Reports
  getReport: async (type, startDate, endDate, costCenterId) => {
    try {
      const params = { type, startDate, endDate };
      if (costCenterId) params.costCenterId = costCenterId;
      const response = await api.get('/finance/reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  },
};