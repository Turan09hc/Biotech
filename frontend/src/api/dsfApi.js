import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors for error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject({
        status: error.response.status,
        message:
          error.response.data?.detail ||
          error.response.data?.message ||
          'An error occurred',
        data: error.response.data,
      });
    } else if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'No response from server. Check if backend is running.',
        data: null,
      });
    } else {
      return Promise.reject({
        status: 0,
        message: error.message,
        data: null,
      });
    }
  }
);

export const dsfApi = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getResults: (params = {}) => apiClient.get('/results', { params }),

  getResultById: (id) => apiClient.get(`/results/${id}`),

  simulate: (parameters) => apiClient.post('/simulate', parameters),

  simulateBatch: (array) => apiClient.post('/simulate-batch', array),

  getSimulationInfo: () => apiClient.get('/simulate/info'),

  healthCheck: () => apiClient.get('/health'),
};

export default dsfApi;
