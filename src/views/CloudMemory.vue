<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCarbonHistoryStore } from '../stores/historyStore';
import { ClimatiqService } from '../services/climatiqService';
import { useToast } from '../composables/useToast';
import '../styles/CloudMemory.scss';

const emit = defineEmits(['set-transition']);
const historyStore = useCarbonHistoryStore();
const { success, error: showError } = useToast();

const formData = ref({
  memoryType: '',
  totalMemory: '0',
  region: '',
  duration: '1'
});

const apiResults = ref<any>(null);
const showResults = ref(false);
const memoryUnit = ref('GB');
const isLoading = ref(false);
const apiError = ref<string | null>(null);
const showSaveModal = ref(false);
const saveName = ref('');
const availableRegions = ref<Record<string, string[]>>({
  aws: [],
  azure: [],
  gcp: []
});

const validMemoryRegions = ref<string[]>([]);

// Duration is always in hours for memory
const durationUnit = ref('h');

const convertDuration = (newUnit: string) => {
  const currentValue = Number(formData.value.duration);
  let valueInHours = currentValue;
  
  if (durationUnit.value === 'm') valueInHours = currentValue / 60;
  if (durationUnit.value === 'd') valueInHours = currentValue * 24;
  if (durationUnit.value === 'w') valueInHours = currentValue * 24 * 7;
  
  let newValue = valueInHours;
  if (newUnit === 'm') newValue = valueInHours * 60;
  if (newUnit === 'd') newValue = valueInHours / 24;
  if (newUnit === 'w') newValue = valueInHours / (24 * 7);
  
  formData.value.duration = newValue.toFixed(2);
  durationUnit.value = newUnit;
};

const getDurationMax = () => {
  switch (durationUnit.value) {
    case 'm': return 1440; // 24 hours in minutes
    case 'h': return 168; // 1 week in hours
    case 'd': return 365; // 1 year in days
    case 'w': return 52; // 1 year in weeks
    default: return 168;
  }
};

const getDurationStep = () => {
  switch (durationUnit.value) {
    case 'm': return 1;
    case 'h': return 1;
    case 'd': return 1;
    case 'w': return 1;
    default: return 1;
  }
};

// Load cloud metadata and discover valid memory regions on component mount
onMounted(async () => {
  try {
    const metadata = await ClimatiqService.getCloudMetadata();
    
    // Extract regions for each provider
    Object.entries(metadata.cloud_providers).forEach(([providerId, provider]) => {
      if (availableRegions.value[providerId]) {
        availableRegions.value[providerId] = provider.regions;
      }
    });
    
    console.log('Available regions loaded:', availableRegions.value);
    
    // Discover valid memory regions by making a test request and parsing the error response
    await discoverValidMemoryRegions();
    
  } catch (error) {
    console.error('Failed to load cloud metadata:', error);
    // If metadata API fails, leave regions empty and show error to user
    console.warn('Could not load regions from metadata API. Please check your connection.');
  }
});

const discoverValidMemoryRegions = async () => {
  try {
    // Use a deliberately invalid region to trigger the error response that contains valid_values
    const invalidTestRegion = 'invalid_test_region_for_discovery';
    
    await ClimatiqService.calculateMemoryEmissions('aws', {
      region: invalidTestRegion,
      data: 1,
      data_unit: 'GB',
      duration: 1,
      duration_unit: 'hour',
      year: new Date().getFullYear()
    });
    
    // If somehow the request succeeds with our invalid region, fallback to all regions
    console.warn('Unexpected success with invalid test region, using all available regions');
    const allRegions: string[] = [];
    Object.values(availableRegions.value).forEach(regions => {
      regions.forEach(region => {
        if (!allRegions.includes(region)) {
          allRegions.push(region);
        }
      });
    });
    validMemoryRegions.value = allRegions.sort();
    
  } catch (error: any) {
    console.log('Discovering valid memory regions from error response...');
    
    // Parse the error message to extract valid regions
    if (error.message && error.message.includes('valid_values')) {
      try {
        // Look for the JSON part in the error message more robustly
        const jsonMatch = error.message.match(/\{[^}]*"valid_values"[^}]*\{[^}]*"region"[^}]*\[[^\]]*\][^}]*\}[^}]*\}/);
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          if (errorData.valid_values && errorData.valid_values.region && Array.isArray(errorData.valid_values.region)) {
            validMemoryRegions.value = errorData.valid_values.region.sort();
            console.log('Valid memory regions discovered:', validMemoryRegions.value);
            return;
          }
        }
        
        // Fallback: try to extract just the array of regions
        const regionArrayMatch = error.message.match(/"region":\s*\[([^\]]+)\]/);
        if (regionArrayMatch) {
          const regionArray = JSON.parse(`[${regionArrayMatch[1]}]`);
          if (Array.isArray(regionArray)) {
            validMemoryRegions.value = regionArray.sort();
            console.log('Valid memory regions discovered from array:', validMemoryRegions.value);
            return;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse error response for valid regions:', parseError);
      }
    }
    
    // Final fallback: if we can't parse the error, use all available regions
    console.warn('Could not discover valid memory regions, using all available regions as fallback');
    const allRegions: string[] = [];
    Object.values(availableRegions.value).forEach(regions => {
      regions.forEach(region => {
        if (!allRegions.includes(region)) {
          allRegions.push(region);
        }
      });
    });    validMemoryRegions.value = allRegions.sort();
  }
};

const updateValidRegionsFromError = async (errorMessage: string): Promise<boolean> => {
  try {
    console.log('Parsing error message for valid regions:', errorMessage);
    
    // Look for the JSON part in the error message more robustly
    const jsonMatch = errorMessage.match(/\{[^}]*"valid_values"[^}]*\{[^}]*"region"[^}]*\[[^\]]*\][^}]*\}[^}]*\}/);
    if (jsonMatch) {
      const errorData = JSON.parse(jsonMatch[0]);
      if (errorData.valid_values && errorData.valid_values.region && Array.isArray(errorData.valid_values.region)) {
        validMemoryRegions.value = errorData.valid_values.region.sort();
        console.log('Valid memory regions updated from 400 error:', validMemoryRegions.value);
        return true;
      }
    }
    
    // Fallback: try to extract just the array of regions
    const regionArrayMatch = errorMessage.match(/"region":\s*\[([^\]]+)\]/);
    if (regionArrayMatch) {
      const regionArray = JSON.parse(`[${regionArrayMatch[1]}]`);
      if (Array.isArray(regionArray)) {
        validMemoryRegions.value = regionArray.sort();
        console.log('Valid memory regions updated from array in 400 error:', validMemoryRegions.value);
        return true;
      }
    }
    
    console.warn('Could not parse valid regions from error message');
    return false;
  } catch (parseError) {
    console.error('Failed to parse error response for valid regions:', parseError);
    return false;
  }
};

const convertMemory = (newUnit: string) => {
  const currentValue = Number(formData.value.totalMemory);
  let valueInGB = currentValue;
  
  if (memoryUnit.value === 'MB') valueInGB = currentValue / 1024;
  if (memoryUnit.value === 'TB') valueInGB = currentValue * 1024;
  if (memoryUnit.value === 'PB') valueInGB = currentValue * 1024 * 1024;
  
  let newValue = valueInGB;
  if (newUnit === 'MB') newValue = valueInGB * 1024;
  if (newUnit === 'TB') newValue = valueInGB / 1024;
  if (newUnit === 'PB') newValue = valueInGB / (1024 * 1024);
  
  formData.value.totalMemory = newValue.toFixed(2);
  memoryUnit.value = newUnit;
};

const getMemoryMax = () => {
  switch (memoryUnit.value) {
    case 'MB': return 10240;
    case 'GB': return 64;
    case 'TB': return 10;
    case 'PB': return 1;
    default: return 64;
  }
};

const getMemoryStep = () => {
  switch (memoryUnit.value) {
    case 'MB': return 256;
    case 'GB': return 1;
    case 'TB': return 0.1;
    case 'PB': return 0.01;
    default: return 1;
  }
};

const getSliderBackgroundStyle = (value: string, max: number) => {
  const percentage = (Number(value) / max) * 100;
  return `background: linear-gradient(to right, #A8352B 0%, #A8352B ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
};

const getInvertedValue = (value: string, max: number) => {
  return max - Number(value);
};

const submitForm = async () => {
  console.log('Submitting cloud memory form data:', formData.value);
    isLoading.value = true;
  apiError.value = null;
  
  try {// For memory calculations, we need to use a generic provider since memoryType is not a cloud provider
    // We'll map memory types to providers for the API call
    const providerMapping: Record<string, string> = {
      'ddr4': 'aws',
      'ddr5': 'aws', 
      'lpddr4': 'gcp',
      'ecc': 'azure'
    };
    
    const providerId = providerMapping[formData.value.memoryType] || 'aws';
    const regionCode = formData.value.region; // Use the selected region directly for memory calculations
    
    // Convert memory amount to GB for API
    let memoryInGB = Number(formData.value.totalMemory);
    switch (memoryUnit.value) {
      case 'MB':
        memoryInGB = memoryInGB / 1024;
        break;
      case 'TB':
        memoryInGB = memoryInGB * 1024;
        break;
      case 'PB':
        memoryInGB = memoryInGB * 1024 * 1024;
        break;
    }
      // For memory calculations, we use the user-specified duration
    let durationInHours = Number(formData.value.duration);
    switch (durationUnit.value) {
      case 'm':
        durationInHours = durationInHours / 60;
        break;
      case 'd':
        durationInHours = durationInHours * 24;
        break;
      case 'w':
        durationInHours = durationInHours * 24 * 7;
        break;
    }
    
    const response = await ClimatiqService.calculateMemoryEmissions(providerId, {
      region: regionCode,
      data: memoryInGB,
      data_unit: 'GB',
      duration: durationInHours,
      duration_unit: 'hour',
      year: new Date().getFullYear()
    });
    
    const results = {
      co2e: response.co2e.toFixed(4),
      co2: response.constituent_gases.co2?.toFixed(4) || '0.0000',
      ch4: response.constituent_gases.ch4?.toFixed(6) || '0.000000',
      n2o: response.constituent_gases.n2o?.toFixed(6) || '0.000000',
      lcaActivity: response.emission_factor.source_lca_activity,
      source: response.emission_factor.source,
      year: response.emission_factor.year,
      activity_value: response.activity_data.activity_value,
      activity_unit: response.activity_data.activity_unit,
      calculation_method: response.co2e_calculation_method
    };
      apiResults.value = results;
    
    showResults.value = true;  } catch (error: any) {
    console.error('Error calculating memory emissions:', error);
    
    // Handle 400 errors with region validation - dynamically filter the valid regions
    if (error.message && error.message.includes('400') && error.message.includes('valid_values')) {
      const success = await updateValidRegionsFromError(error.message);
      if (success) {
        // Don't show the raw error, show a helpful message instead
        apiError.value = 'Some regions are not available for memory calculations. Please select a different region and try again.';
        return;
      }
    }
    
    // Provide user-friendly error messages
    if (error?.message) {
      apiError.value = error.message;
    } else if (error?.code === 'NETWORK_ERROR') {
      apiError.value = 'Network connection failed. Please check your internet connection and try again.';
    } else {
      apiError.value = 'Unable to calculate memory emissions. Please check your inputs and try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

// Helper functions for regions  
const getAvailableRegions = () => {
  // Return dynamically discovered valid memory regions
  return validMemoryRegions.value;
};

const formatRegionName = (region: string) => {
  // Convert region codes to human-readable names for memory regions
  const regionMappings: Record<string, string> = {
    // AWS regions
    'af_south_1': 'Africa (Cape Town)',
    'ap_east_1': 'Asia Pacific (Hong Kong)',
    'ap_northeast_1': 'Asia Pacific (Tokyo)',
    'ap_northeast_2': 'Asia Pacific (Seoul)',
    'ap_northeast_3': 'Asia Pacific (Osaka)',
    'ap_south_1': 'Asia Pacific (Mumbai)',
    'ap_southeast_1': 'Asia Pacific (Singapore)',
    'ap_southeast_2': 'Asia Pacific (Sydney)',
    'ap_southeast_3': 'Asia Pacific (Jakarta)',
    'ca_central_1': 'Canada (Central)',
    'cn_north_1': 'China (Beijing)',
    'cn_northwest_1': 'China (Ningxia)',
    'eu_central_1': 'Europe (Frankfurt)',
    'eu_central_2': 'Europe (Zurich)',
    'eu_north_1': 'Europe (Stockholm)',
    'eu_south_1': 'Europe (Milan)',
    'eu_west_1': 'Europe (Ireland)',
    'eu_west_2': 'Europe (London)',
    'eu_west_3': 'Europe (Paris)',
    'me_south_1': 'Middle East (Bahrain)',
    'sa_east_1': 'South America (São Paulo)',
    'us_east_1': 'US East (N. Virginia)',
    'us_east_2': 'US East (Ohio)',
    'us_gov_east_1': 'US GovCloud East',
    'us_gov_west_1': 'US GovCloud West',
    'us_west_1': 'US West (N. California)',
    'us_west_2': 'US West (Oregon)',
    
    // Legacy region mappings (in case some old regions are still supported)
    'asia_east_1': 'Asia East 1',
    'asia_east_2': 'Asia East 2',
    'asia_northeast_1': 'Asia Northeast 1 (Tokyo)',
    'asia_northeast_2': 'Asia Northeast 2 (Seoul)',
    'asia_northeast_3': 'Asia Northeast 3 (Osaka)',
    'asia_south_1': 'Asia South 1 (Mumbai)',
    'asia_south_2': 'Asia South 2 (Hyderabad)',
    'asia_southeast_1': 'Asia Southeast 1 (Singapore)',
    'asia_southeast_2': 'Asia Southeast 2 (Jakarta)',
    'australia_southeast_1': 'Australia Southeast 1 (Sydney)',
    'australia_southeast_2': 'Australia Southeast 2 (Melbourne)',
    'europe_central_2': 'Europe Central 2 (Warsaw)',
    'europe_north_1': 'Europe North 1 (Stockholm)',
  };
  
  return regionMappings[region] || region
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/Us/g, 'US')
    .replace(/Uk/g, 'UK');
};

const saveToHistory = async () => {
  if (!apiResults.value) return;
  
  try {
    await historyStore.addEmissionRecord({
      category: 'cloud-memory',
      categoryLabel: 'Cloud Memory',
      co2e: parseFloat(apiResults.value.co2e),
      co2e_unit: 'kg',
      co2: parseFloat(apiResults.value.co2),
      ch4: parseFloat(apiResults.value.ch4),
      n2o: parseFloat(apiResults.value.n2o),
      details: {
        memory_type: formData.value.memoryType,
        total_memory: formData.value.totalMemory,
        memory_unit: memoryUnit.value,
        region: formData.value.region,
        duration: formData.value.duration,
        duration_unit: durationUnit.value
      },
      formData: { ...formData.value, memoryUnit: memoryUnit.value, durationUnit: durationUnit.value },
      source: apiResults.value.source,
      lcaActivity: apiResults.value.lcaActivity
    }, saveName.value.trim() || undefined);
      showSaveModal.value = false;
    saveName.value = '';
    success('Calculation saved to history successfully!');
  } catch (error: any) {
    console.error('Error saving to history:', error);
    showError('Error saving to history: ' + error.message);
  }
};
</script>

<template>
  <div class="page-container">
    <div class="form-container">
      <h1 class="page-title fade-in">Cloud Computing - Memory Carbon Calculator</h1>
      
      <form @submit.prevent="submitForm" class="carbon-form">
        <div class="form-group slide-up delay-1">
          <label class="form-label">Memory Type</label>
          <select v-model="formData.memoryType" class="form-control" required>
            <option value="">Select memory type</option>
            <option value="ddr4">DDR4</option>
            <option value="ddr5">DDR5</option>
            <option value="lpddr4">LPDDR4 (Low Power)</option>
            <option value="ecc">ECC Memory</option>
          </select>
        </div>
          <div class="form-group slide-up delay-4">
          <label class="form-label">Data Center Region</label>
          <select v-model="formData.region" class="form-control" required>
            <option value="">Select a region</option>
            <option 
              v-for="region in getAvailableRegions()" 
              :key="region" 
              :value="region"
            >
              {{ formatRegionName(region) }}
            </option>
          </select>
        </div>


        <div class="form-group slide-up delay-2">
          <label class="form-label">Total Memory</label>
          <div class="input-slider-container">
            <input 
              type="range" 
              :value="getInvertedValue(formData.totalMemory, getMemoryMax())"
              @input="formData.totalMemory = String(getInvertedValue(($event.target as HTMLInputElement).value, getMemoryMax()))"
              min="0" 
              :max="getMemoryMax()" 
              :step="getMemoryStep()" 
              class="slider inverted-slider"
              :style="getSliderBackgroundStyle(formData.totalMemory, getMemoryMax())"
            />
            <div class="slider-labels">
              <span>{{ getMemoryMax() }}</span>
              <span>{{ getMemoryMax() / 2 }}</span>
              <span>0</span>
            </div>
            <div class="value-display">
              <input 
                type="number" 
                v-model="formData.totalMemory" 
                min="0"
                :max="getMemoryMax()"
                :step="getMemoryStep()"
                class="value-input"
              />
              <div class="unit-buttons memory-units">
                <button 
                  type="button" 
                  @click="convertMemory('MB')" 
                  :class="{ active: memoryUnit === 'MB' }"
                >
                  MB
                </button>
                <button 
                  type="button" 
                  @click="convertMemory('GB')" 
                  :class="{ active: memoryUnit === 'GB' }"
                >
                  GB
                </button>
                <button 
                  type="button" 
                  @click="convertMemory('TB')" 
                  :class="{ active: memoryUnit === 'TB' }"
                >
                  TB
                </button>
                <button 
                  type="button" 
                  @click="convertMemory('PB')" 
                  :class="{ active: memoryUnit === 'PB' }"
                >
                  PB
                </button>
              </div>
            </div>
          </div>        </div>
        
        <div class="form-group slide-up delay-3">
          <label class="form-label">Duration</label>
          <div class="input-slider-container">
            <input 
              type="range" 
              :value="getInvertedValue(formData.duration, getDurationMax())"
              @input="formData.duration = String(getInvertedValue(($event.target as HTMLInputElement).value, getDurationMax()))"
              min="0" 
              :max="getDurationMax()" 
              :step="getDurationStep()" 
              class="slider inverted-slider"
              :style="getSliderBackgroundStyle(formData.duration, getDurationMax())"
            />
            <div class="slider-labels">
              <span>{{ getDurationMax() }}</span>
              <span>{{ getDurationMax() / 2 }}</span>
              <span>0</span>
            </div>
            <div class="value-display">
              <input 
                type="number" 
                v-model="formData.duration" 
                min="0"
                :max="getDurationMax()"
                :step="getDurationStep()"
                class="value-input"
              />
              <div class="unit-buttons duration-units">
                <button 
                  type="button" 
                  @click="convertDuration('m')" 
                  :class="{ active: durationUnit === 'm' }"
                >
                  min
                </button>
                <button 
                  type="button" 
                  @click="convertDuration('h')" 
                  :class="{ active: durationUnit === 'h' }"
                >
                  h
                </button>
                <button 
                  type="button" 
                  @click="convertDuration('d')" 
                  :class="{ active: durationUnit === 'd' }"
                >
                  d
                </button>
                <button 
                  type="button" 
                  @click="convertDuration('w')" 
                  :class="{ active: durationUnit === 'w' }"
                >
                  w
                </button>
              </div>
            </div>
          </div>
        </div>
        

          <div class="form-actions slide-up delay-5">          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading">Calculating...</span>
            <span v-else>Calculate Carbon Footprint</span>
          </button>
        </div>
        
        <div v-if="apiError" class="error-message slide-up">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <h4>Calculation Error</h4>
            <p>{{ apiError }}</p>
          </div>
        </div>
      </form>
    </div>
    
    <div class="results-or-icon-container fade-in">
      <div v-if="showResults" class="results-container memory-container slide-up">
        <h2 class="results-title">Your Cloud Memory Carbon Footprint</h2>
        
        <div style="max-height: 350px" class="memory-visualization">
          <video autoplay loop muted class="visualization-video">
            <source src="/video/cloud_memory.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div class="results-details-panel">
          <div class="detail-card">
            <h3>Emission Details</h3>
            <div class="detail-row">
              <span class="detail-label">🌍 CO2e:</span>
              <span class="detail-value">{{ apiResults.co2e }} kg</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🏭 CO2:</span>
              <span class="detail-value">{{ apiResults.co2 }} kg</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🔥 CH4:</span>
              <span class="detail-value">{{ apiResults.ch4 }} kg</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">💨 N2O:</span>
              <span class="detail-value">{{ apiResults.n2o }} kg</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🔄 LCA Activity:</span>
              <span class="detail-value">{{ apiResults.lcaActivity }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📊 Source:</span>
              <span class="detail-value">{{ apiResults.source }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📅 Year:</span>
              <span class="detail-value">{{ apiResults.year }}</span>
            </div>
          </div>
        </div>
          <div class="results-actions">
          <button @click="showResults = false" class="btn btn-secondary">
            Reset
          </button>
          <button @click="showSaveModal = true" class="btn btn-success">
            Save to History
          </button>
        </div>
      </div>
    </div>

    <!-- Save Modal -->
    <div v-if="showSaveModal" class="modal-overlay" @click="showSaveModal = false">
      <div class="modal-content" @click.stop>
        <h3>Save Calculation to History</h3>
        <p>Give your calculation a custom name (optional):</p>
        <input 
          v-model="saveName" 
          type="text" 
          placeholder="e.g., Database Memory Usage - June 2025"
          class="save-name-input"
          @keyup.enter="saveToHistory"
        />
        <div class="modal-actions">
          <button @click="showSaveModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="saveToHistory" class="btn btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/CloudMemory.scss';

/* Save Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.modal-content h3 {
  margin-bottom: 1rem;
  color: #333;
}

.modal-content p {
  margin-bottom: 1.5rem;
  color: #666;
}

.save-name-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  transition: border-color 0.3s ease;
}

.save-name-input:focus {
  outline: none;
  border-color: #A8352B;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-success {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>