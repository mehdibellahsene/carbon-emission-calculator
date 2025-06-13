<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useCarbonHistoryStore } from '../stores/historyStore';
import { useUserStore } from '../stores/user';
import { useRouter } from 'vue-router';
import '../styles/CarbonHistory.scss';

const historyStore = useCarbonHistoryStore();
const userStore = useUserStore();
const router = useRouter();

const selectedTimeframe = ref<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
const selectedCategory = ref<string>('all');
const showExportModal = ref(false);
const showImportModal = ref(false);
const importFileInput = ref<HTMLInputElement | null>(null);

// Load history on component mount and when user changes
onMounted(async () => {
  // Check if user is authenticated
  if (!userStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  
  await historyStore.loadHistoryFromFile();
});

// Watch for user changes and reload data
watch(() => userStore.currentUser, async (newUser, oldUser) => {
  if (newUser && newUser !== oldUser) {
    await historyStore.loadHistoryFromFile();
  } else if (!newUser) {
    // User logged out, clear data and redirect
    historyStore.clearUserData();
    router.push('/login');
  }
}, { immediate: false });

// Computed properties for filtered data - now uses userRecords from store
const filteredRecords = computed(() => {
  let records = historyStore.userRecords; // Use userRecords instead of records
  
  // Filter by category
  if (selectedCategory.value !== 'all') {
    records = records.filter(record => record.category === selectedCategory.value);
  }
  
  // Filter by timeframe
  if (selectedTimeframe.value !== 'all') {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[selectedTimeframe.value];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - days);
    
    records = records.filter(record => new Date(record.timestamp) >= cutoffDate);
  }
  
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
});

const filteredTotal = computed(() => {
  return filteredRecords.value.reduce((sum, record) => sum + record.co2e, 0);
});

// Format functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'business-travel': '#38c96d',
    'intermodal-freight': '#67387C',
    'cloud-cpu': '#D02556',
    'cloud-storage': '#4A98E9',
    'cloud-memory': '#DB9537'
  };
  return colors[category] || '#6b7280';
};

const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    'business-travel': '✈️',
    'intermodal-freight': '🚛',
    'cloud-cpu': '💻',
    'cloud-storage': '💾',
    'cloud-memory': '🧠'
  };
  return icons[category] || '📊';
};

// Export functionality
const exportData = async () => {
  try {
    await historyStore.exportToJson();
    showExportModal.value = false;
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please try again.');
  }
};

// Import functionality
const importData = () => {
  importFileInput.value?.click();
};

const handleFileImport = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (file) {
    try {
      const text = await file.text();
      await historyStore.importFromJson(text);
      showImportModal.value = false;
      alert('Data imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format.');
    }
  }
};

// Delete record
const deleteRecord = async (id: string) => {
  if (confirm('Are you sure you want to delete this record?')) {
    await historyStore.deleteRecord(id);
  }
};

// Clear all data
const clearAllData = async () => {
  if (confirm('Are you sure you want to delete all emission records? This action cannot be undone.')) {
    await historyStore.clearAllHistory();
  }
};

const pageIcon = ref(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="120" height="120">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
`);
</script>

<template>
  <div class="page-container">
    <div class="history-container">     
        <div class="header-section fade-in">
        <h1 class="page-title">Carbon Emission History & Analytics</h1>
        <p class="page-subtitle">Track your environmental impact over time</p>
        
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-icon">🌍</div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(historyStore.totalEmissions) }}</div>
              <div class="stat-label">Total CO2e (kg)</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ historyStore.totalRecords }}</div>
              <div class="stat-label">Total Calculations</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⚡</div>
            <div class="stat-content">
              <div class="stat-value">{{ formatNumber(filteredTotal) }}</div>
              <div class="stat-label">Filtered Total (kg)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls-section slide-up delay-1">
        <div class="filter-controls">
          <div class="filter-group">
            <label>Timeframe:</label>
            <select v-model="selectedTimeframe" class="filter-select">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Category:</label>
            <select v-model="selectedCategory" class="filter-select">
              <option value="all">All Categories</option>
              <option value="business-travel">Business Travel</option>
              <option value="intermodal-freight">Intermodal Freight</option>
              <option value="cloud-cpu">Cloud CPU</option>
              <option value="cloud-storage">Cloud Storage</option>
              <option value="cloud-memory">Cloud Memory</option>
            </select>
          </div>
        </div>
        
        <div class="action-controls">
          <button @click="showExportModal = true" class="btn btn-secondary">
            📤 Export Data
          </button>
          <button @click="showImportModal = true" class="btn btn-secondary">
            📥 Import Data
          </button>
          <button @click="clearAllData" class="btn btn-danger">
            🗑️ Clear All
          </button>
        </div>
      </div>

      <!-- Analytics Section -->
      <div class="analytics-section slide-up delay-2">
        <div class="analytics-grid">
          <!-- Category Breakdown -->
          <div class="analytics-card">
            <h3>Emissions by Category</h3>
            <div class="category-breakdown">
              <div 
                v-for="category in historyStore.categoryTotals" 
                :key="category.category"
                class="category-item"
              >
                <div class="category-header">
                  <div class="category-info">
                    <span class="category-icon">{{ getCategoryIcon(category.category) }}</span>
                    <span class="category-name">{{ category.categoryLabel }}</span>
                  </div>
                  <div class="category-values">
                    <span class="category-total">{{ formatNumber(category.total) }} kg</span>
                    <span class="category-percentage">{{ formatNumber(category.percentage) }}%</span>
                  </div>
                </div>
                <div class="category-bar">
                  <div 
                    class="category-fill" 
                    :style="{ 
                      width: `${category.percentage}%`, 
                      backgroundColor: getCategoryColor(category.category) 
                    }"
                  ></div>
                </div>
                <div class="category-count">{{ category.count }} calculations</div>
              </div>
            </div>
          </div>

          <!-- Monthly Trends -->
          <div class="analytics-card">
            <h3>Monthly Trends</h3>
            <div class="trend-chart">
              <div 
                v-for="month in historyStore.monthlyTotals.slice(-6)" 
                :key="month.month"
                class="trend-bar"
              >
                <div 
                  class="trend-fill"
                  :style="{ 
                    height: `${(month.total / Math.max(...historyStore.monthlyTotals.map(m => m.total))) * 100}%` 
                  }"
                ></div>
                <div class="trend-label">{{ new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short' }) }}</div>
                <div class="trend-value">{{ formatNumber(month.total) }}</div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="analytics-card recent-activity">
            <h3>Recent Calculations</h3>
            <div class="recent-list">
              <div 
                v-for="record in historyStore.recentRecords.slice(0, 5)" 
                :key="record.id"
                class="recent-item"
              >
                <div class="recent-icon" :style="{ color: getCategoryColor(record.category) }">
                  {{ getCategoryIcon(record.category) }}
                </div>
                <div class="recent-content">
                  <div class="recent-category">{{ record.categoryLabel }}</div>
                  <div class="recent-date">{{ formatDate(record.timestamp) }}</div>
                </div>
                <div class="recent-emission">{{ formatNumber(record.co2e) }} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Records -->
      <div class="records-section slide-up delay-3">
        <h3>Detailed Records</h3>
        <div class="records-table">
          <div class="table-header">
            <div class="col-date">Date</div>
            <div class="col-category">Category</div>
            <div class="col-emissions">Emissions</div>
            <div class="col-details">Details</div>
            <div class="col-actions">Actions</div>
          </div>
          
          <div v-if="filteredRecords.length === 0" class="no-records">
            <div class="no-records-icon" v-html="pageIcon"></div>
            <p>No emission records found for the selected filters.</p>
            <p>Start calculating your carbon footprint to see data here!</p>
          </div>
          
          <div 
            v-for="record in filteredRecords" 
            :key="record.id"
            class="table-row"
          >
            <div class="col-date">
              <div class="date-main">{{ new Date(record.timestamp).toLocaleDateString() }}</div>
              <div class="date-time">{{ new Date(record.timestamp).toLocaleTimeString() }}</div>
            </div>
            
            <div class="col-category">
              <div class="category-badge" :style="{ backgroundColor: getCategoryColor(record.category) }">
                <span class="category-icon">{{ getCategoryIcon(record.category) }}</span>
                {{ record.categoryLabel }}
              </div>
            </div>
            
            <div class="col-emissions">
              <div class="emission-main">{{ formatNumber(record.co2e) }} {{ record.co2e_unit || 'kg' }}</div>
              <div v-if="record.co2" class="emission-detail">CO2: {{ formatNumber(record.co2) }} kg</div>
            </div>
            
            <div class="col-details">
              <div v-if="record.details.distance_km" class="detail-item">
                📏 {{ record.details.distance_km }} km
              </div>
              <div v-if="record.details.transport_mode" class="detail-item">
                🚗 {{ record.details.transport_mode }}
              </div>
              <div v-if="record.details.weight" class="detail-item">
                ⚖️ {{ record.details.weight }} {{ record.details.weight_unit || 'kg' }}
              </div>
              <div v-if="record.source" class="detail-item">
                📊 {{ record.source }}
              </div>
            </div>
            
            <div class="col-actions">
              <button @click="deleteRecord(record.id)" class="btn-delete" title="Delete record">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal-overlay" @click="showExportModal = false">
      <div class="modal-content" @click.stop>
        <h3>Export Carbon Emission Data</h3>
        <p>This will download a JSON file containing all your carbon emission records and analytics.</p>
        <div class="modal-actions">
          <button @click="showExportModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="exportData" class="btn btn-primary">Download JSON</button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal-content" @click.stop>
        <h3>Import Carbon Emission Data</h3>
        <p>Select a JSON file exported from this application to import your data.</p>
        <div class="modal-actions">
          <button @click="showImportModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="importData" class="btn btn-primary">Select File</button>
        </div>
        <input 
          ref="importFileInput" 
          type="file" 
          accept=".json" 
          @change="handleFileImport" 
          style="display: none"
        />
      </div>
    </div>
  </div>
</template>
