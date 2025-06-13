export const CLIMATIQ_API_KEY = import.meta.env.VITE_CLIMATIQ_API_KEY || '6S6KR4P7A12W16N11NCTC1FEN0';

const API_BASE_URL = 'https://api.climatiq.io';
const PREVIEW_API_BASE_URL = 'https://preview.api.climatiq.io';

export const API_ENDPOINTS = {
  // Travel endpoints (preview)
  TRAVEL_DISTANCE: `${PREVIEW_API_BASE_URL}/travel/v1-preview1/distance`,
  TRAVEL_SPEND: `${PREVIEW_API_BASE_URL}/travel/v1-preview1/spend`,
  TRAVEL_HOTEL: `${PREVIEW_API_BASE_URL}/travel/v1-preview1/hotel`,
  
  // Freight endpoints
  FREIGHT_INTERMODAL: `${API_BASE_URL}/freight/v2/intermodal`,
  
  // Cloud Computing endpoints
  COMPUTE_METADATA: `${API_BASE_URL}/compute/v1/metadata`,
  COMPUTE_CPU: (provider: string) => `${API_BASE_URL}/compute/v1/${provider}/cpu`,
  COMPUTE_MEMORY: (provider: string) => `${API_BASE_URL}/compute/v1/${provider}/memory`,
  COMPUTE_STORAGE: (provider: string) => `${API_BASE_URL}/compute/v1/${provider}/storage`,
  COMPUTE_INSTANCE: (provider: string) => `${API_BASE_URL}/compute/v1/${provider}/instance`,
  
  // Basic estimation endpoint
  ESTIMATE: `${API_BASE_URL}/estimate`,
  
  // Search endpoint for emission factors
  SEARCH: `${API_BASE_URL}/search`
};

export const handleApiError = (error: any): string => {
  console.error('API Error:', error);
  
  if (error.response) {
    return `Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`;
  } else if (error.request) {
    return 'No response received from server. Please check your connection.';
  } else {
    return error.message || 'An unknown error occurred';
  }
};
