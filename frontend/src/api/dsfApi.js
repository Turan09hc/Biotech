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
  /**
   * Upload CSV file for analysis
   * IMPORTANT: Does NOT set Content-Type header - browser auto-sets multipart/form-data with boundary
   * @param {File} file - CSV or XLSX file
   * @returns {Promise} Response with analysis_id
   */
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/upload', formData, {
      // CRITICAL: Do NOT set Content-Type header!
      // Axios will automatically set it to multipart/form-data with correct boundary
      // If you override it, the boundary will be wrong and backend can't parse the file
      headers: {
        // Content-Type is NOT set here - let axios/browser handle it
      },
    });
  },

  /**
   * Get list of all analysis results with optional filtering
   * @param {Object} params - Query parameters (sample_name_contains, limit, etc)
   * @returns {Promise} Array of analyses
   */
  getResults: (params = {}) => apiClient.get('/results', { params }),

  /**
   * Get specific analysis result by ID
   * Backend endpoint: GET /api/v1/results/<id>
   * @param {string} id - Analysis ID (UUID from upload response)
   * @returns {Promise} Single analysis result with metrics, curves, explanation
   */
  getResultById: (id) => {
    if (!id) {
      return Promise.reject({
        status: 400,
        message: 'Analysis ID is required',
        data: null,
      });
    }
    return apiClient.get(`/results/${id}`);
  },

  /**
   * Simulate DSF curve with adjusted parameters
   * @param {Object} parameters - { base_tm, pH, buffer, ligand, concentration }
   * @returns {Promise} Simulated curve data
   */
  simulate: (parameters) => apiClient.post('/simulate', parameters),

  /**
   * Batch simulate multiple curves
   * @param {Array} array - Array of parameter objects
   * @returns {Promise} Array of simulated curves
   */
  simulateBatch: (array) => apiClient.post('/simulate-batch', array),

  /**
   * Get simulation info and documentation
   * @returns {Promise} Simulation capabilities and parameter ranges
   */
  getSimulationInfo: () => apiClient.get('/simulate/info'),

  /**
   * Health check - verify backend is running
   * @returns {Promise} Backend status
   */
  healthCheck: () => apiClient.get('/health'),
};

export default dsfApi;