<script setup lang="ts">
import { ref } from 'vue';
import FormInput from '../components/FormInput.vue';
import TransportOption from '../components/TransportOption.vue';
import { ClimatiqService } from '../services/climatiqService';
import { popularCities } from '../sampleData';
import { useCarbonHistoryStore } from '../stores/historyStore';
import { useToast } from '../composables/useToast';
import '../styles/IntermodalFreight.scss';

const emit = defineEmits(['set-transition']);
const historyStore = useCarbonHistoryStore();
const { success, error: showError } = useToast();

const formData = ref({
  origin: '',
  destination: '',
  freightType: 'airplane',
  weight: '',
  volume: '',
  distance: ''
});

const apiResults = ref<any>(null);
const showResults = ref(false);
const isLoading = ref(false);
const apiError = ref<string | null>(null);
const weightUnit = ref('kg');
const showSaveModal = ref(false);
const saveName = ref('');

const getClimatiqTransportMode = (mode: string) => {
  const modeMap = {
    'airplane': 'air',
    'ship': 'sea',
    'truck': 'road',
    'train': 'rail'
  };
  return modeMap[mode as keyof typeof modeMap] || 'road';
};

const transportOptions = [
  { 
    value: 'airplane', 
    label: 'Airplane',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16Z"/></svg>`,
  },
  { 
    value: 'ship', 
    label: 'Ship',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`,
  },
  { 
    value: 'truck', 
    label: 'Truck',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  },
  { 
    value: 'train', 
    label: 'Rail',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4m0 2c3.51 0 4.96.48 5.57 1H6.43c.61-.52 2.06-1 5.57-1m-6 3h2v3H6V7m4 0h4v3h-4V7m6 0h2v3h-2V7M6 12h12v4H6v-4Z"/></svg>`,
  }
];

const submitForm = async () => {
  console.log('Submitting freight form data:', formData.value);
  
  isLoading.value = true;
  apiError.value = null;
  
  try {
    const weight = Number(formData.value.weight);
    if (isNaN(weight) || weight <= 0) {
      formData.value.weight = '1';
    }
      const requestData = {
      route: [
        {
          location: {
            query: formData.value.origin,
            location_options: {
              tolerance_km: 20
            }
          }
        },
        {
          transport_mode: getClimatiqTransportMode(formData.value.freightType)
        },
        {
          location: {
            query: formData.value.destination,
            location_options: {
              tolerance_km: 20
            }
          }
        }
      ],
      cargo: {
        weight: Number(formData.value.weight),
        weight_unit: weightUnit.value
      }
    };
    
    console.log('API request data:', JSON.stringify(requestData, null, 2));
    
    const data = await ClimatiqService.calculateFreightEmissions(requestData);
    console.log('API response:', data);
      apiResults.value = {
      co2e: data.co2e.toFixed(2),
      co2e_unit: data.co2e_unit,
      distance_km: data.distance_km,      origin_name: data.route.find((item: any) => item.type === 'location')?.name || formData.value.origin,
      destination_name: data.route[data.route.length - 1]?.name || formData.value.destination,
      transport_mode: formData.value.freightType,
      weight: formData.value.weight,
      weight_unit: weightUnit.value,
      legs: data.route.filter((item: any) => item.type === 'leg').map((leg: any) => ({
        co2e: leg.co2e.toFixed(2),
        co2e_unit: leg.co2e_unit,
        transport_mode: leg.transport_mode,
        distance_km: leg.distance_km,
        source: leg.source_trail?.[0]?.name || 'Transport Emissions'      })),
      co2: data.route.filter((item: any) => item.type === 'leg')
            .reduce((sum: number, leg: any) => sum + (leg.estimates?.[0]?.constituent_gases?.co2 || 0), 0).toFixed(2),
      ch4: '0.0000',
      n2o: '0.0000',
      lcaActivity: 'Freight Transport',
      source: data.route.find((item: any) => item.type === 'leg')?.source_trail?.[0]?.name || `${formData.value.freightType.toUpperCase()} Freight`,      year: data.route.find((item: any) => item.type === 'leg')?.source_trail?.[0]?.year || new Date().getFullYear()
    };
    
    showResults.value = true;  } catch (error: any) {
    console.error('Error fetching carbon footprint data:', error);
    // Provide user-friendly error messages
    if (error?.message) {
      apiError.value = error.message;
    } else if (error?.code === 'NETWORK_ERROR') {
      apiError.value = 'Network connection failed. Please check your internet connection and try again.';
    } else {
      apiError.value = 'Unable to calculate carbon footprint. Please check your inputs and try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

const transportTextColor = ref('#67387C');
const transportActiveColor = ref('#B682AB');

const saveToHistory = async () => {
  if (!apiResults.value) return;
  
  try {
    await historyStore.addEmissionRecord({
      category: 'intermodal-freight',
      categoryLabel: 'Intermodal Freight',
      co2e: parseFloat(apiResults.value.co2e),
      co2e_unit: 'kg',
      co2: parseFloat(apiResults.value.co2),
      ch4: 0,
      n2o: 0,
      details: {
        distance_km: apiResults.value.distance_km,
        origin_name: apiResults.value.origin_name,
        destination_name: apiResults.value.destination_name,
        transport_mode: formData.value.freightType,
        weight: formData.value.weight,
        weight_unit: weightUnit.value
      },
      formData: { ...formData.value, weight_unit: weightUnit.value },
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

const convertWeightToKg = () => {
  if (weightUnit.value === 't') {
    formData.value.weight = (Number(formData.value.weight) * 1000).toString();
    weightUnit.value = 'kg';
  }
};

const convertWeightToTons = () => {
  if (weightUnit.value === 'kg') {
    formData.value.weight = (Number(formData.value.weight) / 1000).toString();
    weightUnit.value = 't';
  }
};

const getSliderBackgroundStyle = (value: string, max: number) => {
  const percentage = (Number(value) / max) * 100;
  return `background: linear-gradient(to right, #67387C 0%, #67387C ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
};

const getInvertedValue = (value: string, max: number) => {
  return max - Number(value);
};

formData.value.weight = '0';

const getFreightVideo = (type: string) => {
  switch (type) {
    case 'airplane': return '/video/plane.mp4';
    case 'ship': return '/video/freight_ship.mp4';
    case 'truck': return '/video/freight_truck.mp4';
    case 'train': return '/video/freight_rail.mp4';
    default: return '/video/freight_truck.mp4';
  }
};
</script>

<template>  <div class="page-container">
    <div class="form-container">
      <h1 class="page-title fade-in">Intermodal Freight Carbon Calculator</h1>
      
      <datalist id="origin-cities">
        <option v-for="city in popularCities" :key="city" :value="city"></option>
      </datalist>
      <datalist id="destination-cities">
        <option v-for="city in popularCities" :key="city" :value="city"></option>
      </datalist>
      
      <form @submit.prevent="submitForm" class="carbon-form">        <FormInput 
          v-model="formData.origin" 
          label="Origin Port/Location" 
          placeholder="Enter origin location"
          list="origin-cities"
          required
        />
        
        <FormInput 
          v-model="formData.destination" 
          label="Destination Port/Location" 
          placeholder="Enter destination location"
          list="destination-cities"
          required
        />
        
        <div class="form-group slide-up delay-1">
          <label class="form-label">Transportation Type</label>
          <TransportOption 
            v-model="formData.freightType" 
            :options="transportOptions"
            :text-color="transportTextColor"
            :active-color="transportActiveColor"
          />
        </div>
        
        <div class="form-group slide-up delay-3">
          <label class="form-label">Weight</label>
          <div class="weight-input-container">            <input 
              type="range" 
              :value="getInvertedValue(formData.weight, 10000)" 
              @input="formData.weight = String(getInvertedValue(($event.target as HTMLInputElement)?.value || '0', 10000))" 
              min="0" 
              max="10000" 
              step="1" 
              class="slider inverted-slider"
              :style="getSliderBackgroundStyle(formData.weight, 10000)"
            />
            <div class="slider-labels">
              <span>10000</span>
              <span>5000</span>
              <span>0</span>
            </div>
            <div class="weight-display">
              <input 
                type="number" 
                v-model="formData.weight" 
                step="1" 
                class="weight-input"
              />
              <div class="unit-buttons">
                <button 
                  type="button" 
                  @click="convertWeightToKg" 
                  :class="{ active: weightUnit === 'kg' }"
                >
                  kg
                </button>
                <button 
                  type="button" 
                  @click="convertWeightToTons" 
                  :class="{ active: weightUnit === 't' }"
                >
                  t
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions slide-up delay-4">
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
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
      <div v-if="showResults" class="results-container freight-container slide-up">
        <h2 class="results-title">Your Freight Carbon Footprint</h2>
        
        <div style="max-height: 350px" class="freight-visualization">
          <video 
            :src="getFreightVideo(formData.freightType)" 
            autoplay 
            loop 
            muted 
            class="freight-video"
          ></video>

          <div class="distance-badge">
            <span>📏 {{ apiResults.distance_km }} km</span>
          </div>
        </div>
        
        <div class="results-details-panel">
          <div class="detail-card">
            <h3>Emission Details</h3>
            <div class="detail-row">
              <span class="detail-label">🌍 CO2e:</span>
              <span class="detail-value">{{ apiResults.co2e }} {{ apiResults.co2e_unit }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📏 Distance:</span>
              <span class="detail-value">{{ apiResults.distance_km }} km</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⚖️ Weight:</span>
              <span class="detail-value">{{ apiResults.weight }} {{ apiResults.weight_unit }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🚢 Transport Mode:</span>
              <span class="detail-value">{{ transportOptions.find(opt => opt.value === apiResults.transport_mode)?.label }}</span>
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
          placeholder="e.g., Freight Shipment to Berlin - June 2025"
          class="save-name-input"
          @keyup.enter="saveToHistory"
        />
        <div class="modal-actions">
          <button @click="showSaveModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="saveToHistory" class="btn btn-success">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/IntermodalFreight.scss';

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
  border-color: #67387C;
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
  cursor: not-allowed;  transform: none;
}
</style>