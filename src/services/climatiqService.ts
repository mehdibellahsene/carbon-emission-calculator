import { CLIMATIQ_API_KEY, API_ENDPOINTS } from '../config/api';

export interface CloudProvider {
  provider_id: string;
  provider_full_name: string;
  regions: string[];
  virtual_machine_instances?: string[];
}

export interface CloudMetadata {
  cloud_providers: Record<string, CloudProvider>;
}

export interface EmissionResponse {
  co2e: number;
  co2e_unit: string;
  co2e_calculation_method: string;
  co2e_calculation_origin: string;
  emission_factor: {
    name: string;
    activity_id: string;
    id: string;
    access_type: string;
    source: string;
    source_dataset: string;
    year: number;
    region: string;
    category: string;
    source_lca_activity: string;
    data_quality_flags: string[];
  };
  constituent_gases: {
    co2e_total: number;
    co2e_other: number | null;
    co2: number | null;
    ch4: number | null;
    n2o: number | null;
  };
  activity_data: {
    activity_value: number;
    activity_unit: string;
  };
  audit_trail: string;
  source_trail: Array<{
    data_category: string;
    name: string;
    source: string;
    source_dataset: string;
    year: string;
    region: string;
    region_name: string;
  }>;
}

// Helper function to parse and format API errors
function parseApiError(errorText: string, operation: string): string {
  try {
    const errorObj = JSON.parse(errorText);
    
    // Handle specific error cases with user-friendly messages
    if (errorObj.error_code === 'invalid_input') {
      const message = errorObj.message || '';
      
      // Handle location tolerance errors
      if (message.includes('was not close enough to the closest transition point')) {
        const locationMatch = message.match(/Location '([^']+)'/);
        const transportMatch = message.match(/for the (\w+) leg/);
        const location = locationMatch ? locationMatch[1] : 'the specified location';
        const transport = transportMatch ? transportMatch[1] : 'transport';
        
        return `The location "${location}" is not close enough to available ${transport} infrastructure. Please try a nearby major city or port.`;
      }
      
      // Handle other invalid input errors
      if (message.includes('route')) {
        return 'Invalid route specified. Please check your origin and destination locations.';
      }
      
      if (message.includes('cargo') || message.includes('weight')) {
        return 'Invalid cargo details. Please check your weight and unit values.';
      }
      
      // Generic invalid input message
      return 'Invalid input provided. Please check your form data and try again.';
    }
    
    // Handle authentication errors
    if (errorObj.error_code === 'unauthorized' || errorObj.error === 'unauthorized') {
      return 'Authentication failed. Please contact support.';
    }
    
    // Handle rate limiting
    if (errorObj.error_code === 'rate_limited') {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    // Handle service unavailable
    if (errorObj.error_code === 'service_unavailable') {
      return 'Service temporarily unavailable. Please try again later.';
    }
    
    // Generic error with message
    if (errorObj.message) {
      return `Calculation error: ${errorObj.message}`;
    }
    
    // Fallback
    return `${operation} failed. Please try again or contact support.`;
    
  } catch (parseError) {
    // If JSON parsing fails, return a generic message
    return `${operation} failed. Please check your input and try again.`;
  }
}

// Service class for Climatiq API interactions
export class ClimatiqService {
  private static headers = {
    'Authorization': `Bearer ${CLIMATIQ_API_KEY}`,
    'Content-Type': 'application/json'
  };

  // Fetch cloud metadata
  static async getCloudMetadata(): Promise<CloudMetadata> {
    try {
      const response = await fetch(API_ENDPOINTS.COMPUTE_METADATA, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cloud metadata: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cloud metadata:', error);
      throw error;
    }
  }

  // Calculate CPU emissions
  static async calculateCpuEmissions(provider: string, params: {
    region: string;
    cpu_count: number;
    average_vcpu_utilization?: number;
    duration: number;
    duration_unit?: string;
    year?: number;
  }): Promise<EmissionResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.COMPUTE_CPU(provider), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          region: params.region,
          cpu_count: params.cpu_count,
          average_vcpu_utilization: params.average_vcpu_utilization || 0.5,
          duration: params.duration,
          duration_unit: params.duration_unit || 'hour',
          year: params.year
        })
      });      if (!response.ok) {
        const errorText = await response.text();
        const userFriendlyMessage = parseApiError(errorText, 'CPU calculation');
        throw new Error(userFriendlyMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating CPU emissions:', error);
      throw error;
    }
  }

  // Calculate Memory emissions
  static async calculateMemoryEmissions(provider: string, params: {
    region: string;
    data: number;
    data_unit?: string;
    duration: number;
    duration_unit?: string;
    year?: number;
  }): Promise<EmissionResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.COMPUTE_MEMORY(provider), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          region: params.region,
          data: params.data,
          data_unit: params.data_unit || 'GB',
          duration: params.duration,
          duration_unit: params.duration_unit || 'hour',
          year: params.year
        })
      });      if (!response.ok) {
        const errorText = await response.text();
        const userFriendlyMessage = parseApiError(errorText, 'Memory calculation');
        throw new Error(userFriendlyMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating Memory emissions:', error);
      throw error;
    }
  }

  // Calculate Storage emissions
  static async calculateStorageEmissions(provider: string, params: {
    region: string;
    storage_type: 'ssd' | 'hdd';
    data: number;
    data_unit?: string;
    duration: number;
    duration_unit?: string;
    year?: number;
  }): Promise<EmissionResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.COMPUTE_STORAGE(provider), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          region: params.region,
          storage_type: params.storage_type,
          data: params.data,
          data_unit: params.data_unit || 'GB',
          duration: params.duration,
          duration_unit: params.duration_unit || 'hour',
          year: params.year
        })
      });      if (!response.ok) {
        const errorText = await response.text();
        const userFriendlyMessage = parseApiError(errorText, 'Storage calculation');
        throw new Error(userFriendlyMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating Storage emissions:', error);
      throw error;
    }
  }

  // Calculate travel emissions
  static async calculateTravelEmissions(params: {
    travel_mode: 'air' | 'car' | 'rail';
    origin: { query: string } | { locode: string } | { iata_code: string } | { latitude: number; longitude: number };
    destination: { query: string } | { locode: string } | { iata_code: string } | { latitude: number; longitude: number };
    year?: number;
    distance_km?: number;
    car_details?: {
      car_type?: string;
      car_size?: string;
    };    air_details?: {
      aircraft_type?: string;
      radiative_forcing_index?: number;
      class?: string;
    };
  }) {
    try {
      const response = await fetch(API_ENDPOINTS.TRAVEL_DISTANCE, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params)
      });      if (!response.ok) {
        const errorText = await response.text();
        const userFriendlyMessage = parseApiError(errorText, 'Travel calculation');
        throw new Error(userFriendlyMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating travel emissions:', error);
      throw error;
    }
  }  // Calculate freight emissions
  static async calculateFreightEmissions(params: {
    route: Array<{
      location?: { 
        query: string;
        location_options?: {
          tolerance_km?: number;
        };
      };
      transport_mode?: string;
      leg_details?: any;
    }>;
    cargo: {
      weight: number;
      weight_unit: string;
    };
  }) {
    try {
      const response = await fetch(API_ENDPOINTS.FREIGHT_INTERMODAL, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        const userFriendlyMessage = parseApiError(errorText, 'Freight calculation');
        throw new Error(userFriendlyMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating freight emissions:', error);
      throw error;
    }
  }
}

// Helper function to convert provider display names to API IDs
export function getProviderApiId(provider: string): string {
  const providerMap: Record<string, string> = {
    'aws': 'aws',
    'azure': 'azure', 
    'gcp': 'gcp',
    'google': 'gcp'
  };
  
  return providerMap[provider.toLowerCase()] || provider.toLowerCase();
}
