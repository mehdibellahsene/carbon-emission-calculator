import { defineStore } from 'pinia';
import { useUserStore } from './user';

export interface CarbonEmissionRecord {
  id: string;
  userId: string; // Add user ID to each record
  timestamp: string;
  category: 'business-travel' | 'intermodal-freight' | 'cloud-cpu' | 'cloud-storage' | 'cloud-memory';
  categoryLabel: string;
  customName?: string; // Optional custom name for the record
  co2e: number;
  co2e_unit: string;
  co2?: number;
  ch4?: number;
  n2o?: number;
  details: {
    [key: string]: any;
  };
  formData: {
    [key: string]: any;
  };
  source?: string;
  lcaActivity?: string;
}

export interface CarbonHistoryState {
  records: CarbonEmissionRecord[];
  isLoading: boolean;
  lastUpdated: string | null;
}

export interface MonthlyTotal {
  month: string;
  year: number;
  total: number;
  count: number;
}

export interface CategoryTotal {
  category: string;
  categoryLabel: string;
  total: number;
  count: number;
  percentage: number;
}

export const useCarbonHistoryStore = defineStore('carbonHistory', {
  state: (): CarbonHistoryState => ({
    records: [],
    isLoading: false,
    lastUpdated: null
  }),

  getters: {
    // Filter records by current user
    userRecords(): CarbonEmissionRecord[] {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      if (!currentUserId) return [];
      
      return this.records.filter(record => record.userId === currentUserId);
    },

    totalEmissions(): number {
      return this.userRecords.reduce((sum, record) => sum + record.co2e, 0);
    },

    totalRecords(): number {
      return this.userRecords.length;
    },

    categoryTotals(): CategoryTotal[] {
      const categoryMap = new Map<string, { total: number; count: number; label: string }>();
      
      this.userRecords.forEach(record => {
        const existing = categoryMap.get(record.category) || { total: 0, count: 0, label: record.categoryLabel };
        existing.total += record.co2e;
        existing.count += 1;
        categoryMap.set(record.category, existing);
      });

      const total = this.totalEmissions;
      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        categoryLabel: data.label,
        total: data.total,
        count: data.count,
        percentage: total > 0 ? (data.total / total) * 100 : 0
      })).sort((a, b) => b.total - a.total);
    },    monthlyTotals(): MonthlyTotal[] {
      const monthlyMap = new Map<string, { total: number; count: number; year: number }>();
      
      this.userRecords.forEach(record => {
        const date = new Date(record.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const existing = monthlyMap.get(monthKey) || { total: 0, count: 0, year: date.getFullYear() };
        existing.total += record.co2e;
        existing.count += 1;
        monthlyMap.set(monthKey, existing);
      });

      return Array.from(monthlyMap.entries()).map(([monthKey, data]) => ({
        month: monthKey,
        year: data.year,
        total: data.total,
        count: data.count
      })).sort((a, b) => a.month.localeCompare(b.month));
    },

    recentRecords(): CarbonEmissionRecord[] {
      return [...this.userRecords]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    },

    averageEmissionPerCategory(): { [key: string]: number } {
      const averages: { [key: string]: number } = {};
      
      this.categoryTotals.forEach(category => {
        averages[category.category] = category.count > 0 ? category.total / category.count : 0;
      });
      
      return averages;
    }
  },
  actions: {
    async loadHistoryFromFile() {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      
      if (!currentUserId) {
        console.warn('No authenticated user, cannot load history');
        this.records = [];
        return;
      }

      this.isLoading = true;
      try {
        // Load user-specific data from localStorage
        const storageKey = `carbonEmissionHistory_${currentUserId}`;
        const storedData = localStorage.getItem(storageKey);
        
        if (storedData) {
          const parsed = JSON.parse(storedData);
          // Filter records to ensure they all belong to the current user
          this.records = (parsed.records || []).filter((record: CarbonEmissionRecord) => record.userId === currentUserId);
          this.lastUpdated = parsed.lastUpdated || null;
        } else {
          this.records = [];
        }
      } catch (error) {
        console.error('Error loading carbon history:', error);
        this.records = [];
      } finally {
        this.isLoading = false;
      }
    },

    async saveHistoryToFile() {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      
      if (!currentUserId) {
        console.warn('No authenticated user, cannot save history');
        return;
      }

      try {
        // Only save records for the current user
        const userRecords = this.records.filter(record => record.userId === currentUserId);
        
        const data = {
          records: userRecords,
          lastUpdated: new Date().toISOString(),
          version: '1.0',
          userId: currentUserId
        };
        
        // Save to user-specific localStorage key
        const storageKey = `carbonEmissionHistory_${currentUserId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        this.lastUpdated = data.lastUpdated;
        
        // Also create/update a JSON file in the public directory for download
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error saving carbon history:', error);
        throw error;
      }
    },    async addEmissionRecord(record: Omit<CarbonEmissionRecord, 'id' | 'timestamp' | 'userId'>, customName?: string) {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      
      if (!currentUserId) {
        console.warn('No authenticated user, cannot add emission record');
        return null;
      }

      const newRecord: CarbonEmissionRecord = {
        ...record,
        id: crypto.randomUUID(),
        userId: currentUserId,
        timestamp: new Date().toISOString(),
        customName: customName
      };
      
      this.records.push(newRecord);
      await this.saveHistoryToFile();
      
      return newRecord.id;
    },

    async deleteRecord(id: string) {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      
      if (!currentUserId) {
        console.warn('No authenticated user, cannot delete record');
        return;
      }

      const index = this.records.findIndex(record => record.id === id && record.userId === currentUserId);
      if (index > -1) {
        this.records.splice(index, 1);
        await this.saveHistoryToFile();
      }
    },

    async clearAllHistory() {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      
      if (!currentUserId) {
        console.warn('No authenticated user, cannot clear history');
        return;
      }

      // Only clear records for the current user
      this.records = this.records.filter(record => record.userId !== currentUserId);
      await this.saveHistoryToFile();
    },

    async exportToJson(): Promise<string> {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      
      if (!currentUserId) {
        throw new Error('No authenticated user, cannot export data');
      }

      const userRecords = this.userRecords;
      const data = {
        exportDate: new Date().toISOString(),
        userId: currentUserId,
        userEmail: userStore.currentUser?.email || 'Unknown',
        totalRecords: userRecords.length,
        totalEmissions: this.totalEmissions,
        records: userRecords,
        summary: {
          categoryTotals: this.categoryTotals,
          monthlyTotals: this.monthlyTotals
        }
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      
      // Download the file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carbon-emissions-history-${userStore.currentUser?.email?.split('@')[0] || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return jsonString;
    },

    async importFromJson(jsonData: string) {
      const userStore = useUserStore();
      const currentUserId = userStore.currentUser?.uid;
      
      if (!currentUserId) {
        throw new Error('No authenticated user, cannot import data');
      }

      try {
        const data = JSON.parse(jsonData);
        if (data.records && Array.isArray(data.records)) {
          // Filter imported records to only include those without userId or with matching userId
          // and assign current user ID to all imported records
          const importedRecords = data.records.map((record: any) => ({
            ...record,
            userId: currentUserId,
            id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
            timestamp: record.timestamp || new Date().toISOString()
          }));
          
          // Remove existing records for current user and add imported ones
          this.records = this.records.filter(record => record.userId !== currentUserId);
          this.records.push(...importedRecords);
          
          await this.saveHistoryToFile();
        } else {
          throw new Error('Invalid JSON format');
        }
      } catch (error) {
        console.error('Error importing carbon history:', error);
        throw error;
      }
    },

    getEmissionTrend(days: number = 30): { date: string; emissions: number }[] {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const dailyEmissions = new Map<string, number>();
      
      // Initialize all days with 0
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyEmissions.set(dateKey, 0);
      }
      
      // Add actual emissions for current user only
      this.userRecords.forEach(record => {
        const recordDate = new Date(record.timestamp);
        if (recordDate >= startDate && recordDate <= endDate) {
          const dateKey = recordDate.toISOString().split('T')[0];
          const currentValue = dailyEmissions.get(dateKey) || 0;
          dailyEmissions.set(dateKey, currentValue + record.co2e);
        }
      });
      
      return Array.from(dailyEmissions.entries()).map(([date, emissions]) => ({
        date,
        emissions
      })).sort((a, b) => a.date.localeCompare(b.date));
    },

    // Clear all data when user logs out
    clearUserData() {
      this.records = [];
      this.lastUpdated = null;
    }
  }
});
