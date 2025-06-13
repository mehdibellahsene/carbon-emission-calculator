<script setup lang="ts">
import { ref } from "vue";
import FormInput from "../components/FormInput.vue";
import TransportOption from "../components/TransportOption.vue";
import { ClimatiqService } from "../services/climatiqService";
import { popularCities } from "../sampleData";
import { useCarbonHistoryStore } from "../stores/historyStore";
import { useToast } from "../composables/useToast";
import "../styles/BusinessTravel.scss";

const emit = defineEmits(["set-transition"]);
const historyStore = useCarbonHistoryStore();
const { success, error: showError } = useToast();

const formData = ref({
  departureCity: "",
  arrivalCity: "",
  transportMode: "plane",
  passengers: 1,
  distance: "",
  returnTrip: false,
});

const apiResults = ref<any>(null);
const showResults = ref(false);
const isLoading = ref(false);
const apiError = ref<string | null>(null);
const showSaveModal = ref(false);
const saveName = ref('');

const getClimatiqTravelMode = (mode: string) => {
  const modeMap = {
    car: "car",
    plane: "air",
    train: "rail",
  };
  return modeMap[mode as keyof typeof modeMap] || "air";
};

const transportOptions = [
  {
    value: "car",
    label: "Car",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>`,
  },
  {
    value: "plane",
    label: "Plane",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16Z"/></svg>`,
  },
  {
    value: "rail",
    label: "Rail",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4m0 2c3.51 0 4.96.48 5.57 1H6.43c.61-.52 2.06-1 5.57-1m-6 3h2v3H6V7m4 0h4v3h-4V7m6 0h2v3h-2V7M6 12h12v4H6v-4Z"/></svg>`,
  },
];

const submitForm = async () => {
  console.log("Submitting form data:", formData.value);

  isLoading.value = true;
  apiError.value = null;

  try {
    const travelParams: any = {
      origin: { query: formData.value.departureCity },
      destination: { query: formData.value.arrivalCity },
      travel_mode: getClimatiqTravelMode(formData.value.transportMode) as 'air' | 'car' | 'rail',
      year: new Date().getFullYear()
    };

    // Add car-specific details if transport mode is car
    if (formData.value.transportMode === 'car') {
      travelParams.car_details = {
        car_type: 'average',
        car_size: 'medium'
      };
    }    // Add air-specific details if transport mode is plane
    if (formData.value.transportMode === 'plane') {
      travelParams.air_details = {
        aircraft_type: 'average',
        radiative_forcing_index: 2,
        class: 'economy'
      };
    }

    const data = await ClimatiqService.calculateTravelEmissions(travelParams);
    console.log("API response:", data);    apiResults.value = {
      co2e: data.co2e.toFixed(2),
      co2: data.direct_emissions?.co2e.toFixed(2) || "0.00",
      ch4: "0.0000",
      n2o: "0.0000",
      lcaActivity: "Business Travel",
      source: data.source_trail?.[0]?.name || "Travel Emissions",
      year: data.source_trail?.[0]?.year || new Date().getFullYear(),
      distance_km: data.distance_km,
      origin_name: data.origin?.name,
      destination_name: data.destination?.name,
      co2e_unit: data.co2e_unit,
      indirect_emissions: data.indirect_emissions?.co2e.toFixed(2) || "0.00",
    };

    showResults.value = true;
  } catch (error: any) {
    console.error("Error fetching carbon footprint data:", error);
    apiError.value = error.message || "Failed to calculate carbon footprint";
  } finally {
    isLoading.value = false;  }
};

const saveToHistory = async () => {
  if (!apiResults.value) return;
  
  try {
    await historyStore.addEmissionRecord({
      category: 'business-travel',
      categoryLabel: 'Business Travel',
      co2e: parseFloat(apiResults.value.co2e),
      co2e_unit: apiResults.value.co2e_unit || 'kg',
      co2: parseFloat(apiResults.value.co2),
      ch4: 0,
      n2o: 0,
      details: {
        distance_km: apiResults.value.distance_km,
        origin_name: apiResults.value.origin_name || formData.value.departureCity,
        destination_name: apiResults.value.destination_name || formData.value.arrivalCity,
        transport_mode: formData.value.transportMode,
        indirect_emissions: parseFloat(apiResults.value.indirect_emissions)
      },
      formData: { ...formData.value },
      source: apiResults.value.source,
      lcaActivity: apiResults.value.lcaActivity
    }, saveName.value.trim() || undefined);    const journeyName = saveName.value.trim() || 'Journey';
    showSaveModal.value = false;
    saveName.value = '';
    success(`"${journeyName}" saved to history successfully!`);
  } catch (error: any) {
    console.error('Error saving to history:', error);
    showError('Error saving to history: ' + error.message);
  }
};

const getTransportVideo = (mode: string) => {
  switch (mode) {
    case "car":
      return "/video/car.mp4";
    case "plane":
      return "/video/plane.mp4";
    case "train":
      return "/video/travel_TRAIN.mp4";
    default:
      return "/video/plane.mp4";
  }
};


</script>

<template>
  <div class="page-container">
    <div class="form-container">
      <h1 class="page-title fade-in">Business Travel Carbon Calculator</h1>

      <datalist id="departure-cities">
        <option v-for="city in popularCities" :key="city" :value="city"></option>
      </datalist>
      <datalist id="arrival-cities">
        <option v-for="city in popularCities" :key="city" :value="city"></option>
      </datalist>
        <form @submit.prevent="submitForm" class="carbon-form">
        <FormInput 
          v-model="formData.departureCity" 
          label="From" 
          placeholder="Departure City"
          list="departure-cities"
          required
        />

        <FormInput 
          v-model="formData.arrivalCity" 
          label="Destination" 
          placeholder="Arrival City"
          list="arrival-cities"
          required
        />

        <div class="form-group slide-up delay-1">
          <label class="form-label">Mode of Transportation</label>
          <TransportOption v-model="formData.transportMode" :options="transportOptions" :text-color="'#38c96d'"
            :active-color="'#38c96d'" />
        </div>

        <div class="form-actions slide-up delay-4">
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading">Calculating...</span>
            <span v-else>Calculate Carbon Footprint</span>
          </button>
        </div>        <div v-if="apiError" class="error-message slide-up">
          <div class="error-icon">⚠️</div>
          <div class="error-content">
            <h4>Calculation Error</h4>
            <p>{{ apiError }}</p>
          </div>
        </div>
      </form>
    </div>

    <div class="results-or-icon-container fade-in">
      <div v-if="showResults" class="results-container travel-container slide-up">
        <h2 class="results-title">Your Business Travel Carbon Footprint</h2>

        <div style="max-height: 350px" class="travel-visualization">
          <video  class="background-video" :src="getTransportVideo(formData.transportMode)" autoplay muted loop></video>

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
              <span class="detail-label">🏭 Direct Emissions:</span>
              <span class="detail-value">{{ apiResults.co2 }} {{ apiResults.co2e_unit }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⚡ Indirect Emissions:</span>
              <span class="detail-value">{{ apiResults.indirect_emissions }}
                {{ apiResults.co2e_unit }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📏 Distance:</span>
              <span class="detail-value">{{ apiResults.distance_km }} km</span>
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
        </div>        <div class="results-actions">
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
          placeholder="e.g., Business Trip to Paris - June 2025"
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
/* Error Message Styles */
.error-message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.2rem;
  background: linear-gradient(135deg, #fee, #fdd);
  border: 1px solid #f5c6c6;
  border-radius: 12px;
  color: #c53030;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(197, 48, 48, 0.1);
}

.error-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.error-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #c53030;
}

.error-content p {
  margin: 0;
  line-height: 1.5;
  color: #9b2c2c;
}

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
  border-color: #38c96d;
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
