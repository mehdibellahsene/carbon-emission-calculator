<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCarbonHistoryStore } from '../stores/historyStore';
import { ClimatiqService, getProviderApiId } from '../services/climatiqService';
import { useToast } from '../composables/useToast';
import '../styles/CloudCpu.scss';

const emit = defineEmits(['set-transition']);
const historyStore = useCarbonHistoryStore();
const { success, error: showError } = useToast();

const formData = ref({
  provider: '',
  region: '',
  cpuCount: '0',
  cpuLoad: '0',
  duration: '0'
});

const cpuLoadPercentage = ref(true);
const durationUnit = ref('h');
const apiResults = ref<any>(null);
const showResults = ref(false);
const isLoading = ref(false);
const apiError = ref<string | null>(null);
const showSaveModal = ref(false);
const saveName = ref('');
const availableRegions = ref<Record<string, string[]>>({
  aws: [],
  azure: [],
  gcp: []
});

// Load cloud metadata on component mount
onMounted(async () => {
  try {
    const metadata = await ClimatiqService.getCloudMetadata();
    
    // Extract regions for each provider
    Object.entries(metadata.cloud_providers).forEach(([providerId, provider]) => {
      if (availableRegions.value[providerId]) {
        availableRegions.value[providerId] = provider.regions;
      }
    });
    
    console.log('Available regions loaded:', availableRegions.value);  } catch (error) {
    console.error('Failed to load cloud metadata:', error);
    // If metadata API fails, leave regions empty and show error to user
    console.warn('Could not load regions from metadata API. Please check your connection.');
  }
});

const submitForm = async () => {
  console.log('Submitting cloud CPU form data:', formData.value);
    isLoading.value = true;
  apiError.value = null;
  
  try {const providerId = getProviderApiId(formData.value.provider);
    const regionCode = formData.value.region; // Use the selected region directly
    
    // Convert duration to hours if needed
    let durationInHours = Number(formData.value.duration);
    switch (durationUnit.value) {
      case 'm':
        durationInHours = durationInHours / 60;
        break;
      case 's':
        durationInHours = durationInHours / 3600;
        break;
      case 'mo':
        durationInHours = durationInHours * 24 * 30;
        break;
      case 'y':
        durationInHours = durationInHours * 24 * 365;
        break;
    }
    
    // Convert CPU load to decimal if it's in percentage
    let cpuUtilization = Number(formData.value.cpuLoad);
    if (cpuLoadPercentage.value) {
      cpuUtilization = cpuUtilization / 100;
    }
    
    const response = await ClimatiqService.calculateCpuEmissions(providerId, {
      region: regionCode,
      cpu_count: Number(formData.value.cpuCount),
      average_vcpu_utilization: cpuUtilization,
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
    console.error('Error calculating CPU emissions:', error);
    // Provide user-friendly error messages
    if (error?.message) {
      apiError.value = error.message;
    } else if (error?.code === 'NETWORK_ERROR') {
      apiError.value = 'Network connection failed. Please check your internet connection and try again.';
    } else {
      apiError.value = 'Unable to calculate CPU emissions. Please check your inputs and try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

const convertToDecimal = () => {
  if (cpuLoadPercentage.value) {
    formData.value.cpuLoad = (Number(formData.value.cpuLoad) / 100).toString();
    cpuLoadPercentage.value = false;
  }
};

const convertToPercentage = () => {
  if (!cpuLoadPercentage.value) {
    formData.value.cpuLoad = (Number(formData.value.cpuLoad) * 100).toString();
    cpuLoadPercentage.value = true;
  }
};

// Helper functions for regions
const getAvailableRegions = () => {
  if (!formData.value.provider) return [];
  return availableRegions.value[formData.value.provider] || [];
};

const formatRegionName = (region: string) => {
  // Convert region codes to human-readable names
  return region
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/Us/g, 'US')
    .replace(/Uk/g, 'UK');
};

const convertDuration = (newUnit: string) => {
  const currentValue = Number(formData.value.duration);
  let valueInHours = currentValue;
  
  if (durationUnit.value === 'm') valueInHours = currentValue / 60;
  if (durationUnit.value === 's') valueInHours = currentValue / 3600;
  if (durationUnit.value === 'mo') valueInHours = currentValue * 24 * 30;
  if (durationUnit.value === 'y') valueInHours = currentValue * 24 * 365;
  
  let newValue = valueInHours;
  if (newUnit === 'm') newValue = valueInHours * 60;
  if (newUnit === 's') newValue = valueInHours * 3600;
  if (newUnit === 'mo') newValue = valueInHours / (24 * 30);
  if (newUnit === 'y') newValue = valueInHours / (24 * 365);
  
  formData.value.duration = newValue.toFixed(2);
  durationUnit.value = newUnit;
};

const getDurationMax = () => {
  switch (durationUnit.value) {
    case 's': return 3600;
    case 'm': return 1440;
    case 'h': return 168;
    case 'mo': return 24;
    case 'y': return 10;
    default: return 168;
  }
};

const getDurationStep = () => {
  switch (durationUnit.value) {
    case 's': return 1;
    case 'm': return 1;
    case 'h': return 1;
    case 'mo': return 0.5;
    case 'y': return 0.1;
    default: return 1;
  }
};

const getSliderBackgroundStyle = (value: string, max: number) => {
  const percentage = (Number(value) / max) * 100;
  return `background: linear-gradient(to right, #3ca6e3 0%, #3ca6e3 ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
};

const getInvertedValue = (value: string, max: number) => {
  return max - Number(value);
};

const saveToHistory = async () => {
  if (!apiResults.value) return;
  
  try {
    await historyStore.addEmissionRecord({
      category: 'cloud-cpu',
      categoryLabel: 'Cloud CPU',
      co2e: parseFloat(apiResults.value.co2e),
      co2e_unit: 'kg',
      co2: parseFloat(apiResults.value.co2),
      ch4: parseFloat(apiResults.value.ch4),
      n2o: parseFloat(apiResults.value.n2o),
      details: {
        provider: formData.value.provider,
        region: formData.value.region,
        cpu_count: formData.value.cpuCount,
        cpu_load: formData.value.cpuLoad,
        cpu_load_unit: cpuLoadPercentage.value ? '%' : 'decimal',
        duration: formData.value.duration,
        duration_unit: durationUnit.value
      },
      formData: { ...formData.value, durationUnit: durationUnit.value, cpuLoadUnit: cpuLoadPercentage.value ? '%' : 'decimal' },
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

formData.value.duration = '0';
</script>

<template>
  <div class="page-container">
    <div class="form-container">
      <h1 class="page-title fade-in">Cloud Computing - CPU Carbon Calculator</h1>
      
      <form @submit.prevent="submitForm" class="carbon-form">        <div class="form-group slide-up delay-2">
          <label class="form-label">Provider</label>
          <select v-model="formData.provider" @change="formData.region = ''" class="form-control" required>
            <option value="">Select provider</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>
        </div>
          <div class="form-group slide-up delay-3">
          <label class="form-label">Region</label>
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
          <div class="form-group slide-up delay-3">
          <label class="form-label">CPU Count</label>
          <div class="input-slider-container">
            <input 
              type="range" 
              v-model="formData.cpuCount" 
              min="0" 
              max="100" 
              step="1" 
              class="slider"
              :style="getSliderBackgroundStyle(formData.cpuCount, 100)"
            />
            <div class="slider-labels">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div class="value-display">
              <input 
                type="number" 
                v-model="formData.cpuCount" 
                min="0"
                max="100"
                step="1" 
                class="value-input"
              />
              <span class="unit-label">cores</span>
            </div>
          </div>
        </div>
          <div class="form-group slide-up delay-4">
          <label class="form-label">CPU Load</label>
          <div class="input-slider-container">
            <input 
              type="range" 
              v-model="formData.cpuLoad" 
              min="0" 
              :max="cpuLoadPercentage ? 100 : 1" 
              :step="cpuLoadPercentage ? 1 : 0.01" 
              class="slider"
              :style="getSliderBackgroundStyle(formData.cpuLoad, cpuLoadPercentage ? 100 : 1)"
            />
            <div class="slider-labels">
              <span>{{ cpuLoadPercentage ? 100 : 1 }}</span>
              <span>{{ cpuLoadPercentage ? 50 : 0.5 }}</span>
              <span>0</span>
            </div>
            <div class="value-display">
              <input 
                type="number" 
                v-model="formData.cpuLoad" 
                :min="0"
                :max="cpuLoadPercentage ? 100 : 1"
                :step="cpuLoadPercentage ? 1 : 0.01"
                class="value-input"
              />
              <div class="unit-buttons">
                <button 
                  type="button" 
                  @click="convertToPercentage" 
                  :class="{ active: cpuLoadPercentage }"
                >
                  %
                </button>
                <button 
                  type="button" 
                  @click="convertToDecimal" 
                  :class="{ active: !cpuLoadPercentage }"
                >
                  decimal
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-group slide-up delay-3">
          <label class="form-label">Duration</label>
          <div class="input-slider-container">            <input 
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
                  @click="convertDuration('s')" 
                  :class="{ active: durationUnit === 's' }"
                >
                  s
                </button>
                <button 
                  type="button" 
                  @click="convertDuration('m')" 
                  :class="{ active: durationUnit === 'm' }"
                >
                  m
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
                  @click="convertDuration('mo')" 
                  :class="{ active: durationUnit === 'mo' }"
                >
                  mo
                </button>
                <button 
                  type="button" 
                  @click="convertDuration('y')" 
                  :class="{ active: durationUnit === 'y' }"
                >
                  y
                </button>
              </div>
            </div>
          </div>
        </div>
          <div class="form-actions slide-up delay-4">
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading">Calculating...</span>
            <span v-else>Calculate Carbon Footprint</span>
          </button>        </div>
        
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
      <div v-if="showResults" class="results-container space-container slide-up">
        <h2 class="results-title">Your CPU Computing Carbon Footprint</h2>
        
        <div style="max-height: 350px" class="space-visualization">
          <video autoplay loop muted class="visualization-video">
            <source src="/video/cloud_cpu.mp4" type="video/mp4" />
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
          placeholder="e.g., Production Server CPU Usage - March 2025"
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
@import '../styles/CloudCpu.scss';

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
  border-color: #3ca6e3;
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