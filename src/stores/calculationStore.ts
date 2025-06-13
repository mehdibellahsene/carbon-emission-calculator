import { defineStore } from 'pinia';

export interface CalculationState {
  results: {
    travelResult: number | null;
    freightResult: number | null;
    cpuResult: number | null;
    storageResult: number | null;
    memoryResult: number | null;
  };
  currentTab: string;
}

export const useCalculationStore = defineStore('calculation', {
  state: (): CalculationState => ({
    results: {
      travelResult: null,
      freightResult: null,
      cpuResult: null,
      storageResult: null,
      memoryResult: null,
    },
    currentTab: 'business-travel',
  }),
  
  actions: {
    setCurrentTab(tab: string) {
      this.currentTab = tab;
    },
    
    saveTravelResult(result: number) {
      this.results.travelResult = result;
    },
    
    saveFreightResult(result: number) {
      this.results.freightResult = result;
    },
    
    saveCpuResult(result: number) {
      this.results.cpuResult = result;
    },
    
    saveStorageResult(result: number) {
      this.results.storageResult = result;
    },
    
    saveMemoryResult(result: number) {
      this.results.memoryResult = result;
    },
    

    calculateCarbon(data: any, type: string): number {
      console.log(`Calculating carbon footprint for ${type} with data:`, data);

      const baseValue = 100;
      
      switch (type) {
        case 'travel':
          return baseValue * (parseInt(data.distance) / 100) * (data.returnTrip ? 2 : 1);
        case 'freight':
          return baseValue * (parseInt(data.weight) / 10) * (parseInt(data.distance) / 1000);
        case 'cpu':
          return baseValue * parseInt(data.cpuCores) * (parseInt(data.utilizationRate) / 100);
        case 'storage':
          return baseValue * (parseInt(data.storageSize) / 100);
        case 'memory':
          return baseValue * (parseInt(data.totalMemory) / 10) * (parseInt(data.utilizationRate) / 100);
        default:
          return 0;
      }
    }
  }
});