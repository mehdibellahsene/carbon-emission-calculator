// Test file to verify Climatiq API integration
import { ClimatiqService } from './climatiqService';

// Test cloud metadata
export async function testCloudMetadata() {
  try {
    console.log('Testing cloud metadata...');
    const metadata = await ClimatiqService.getCloudMetadata();
    console.log('Cloud providers available:', Object.keys(metadata.cloud_providers));
    
    // Log some example regions
    Object.entries(metadata.cloud_providers).forEach(([providerId, provider]) => {
      console.log(`${provider.provider_full_name} (${providerId}):`, provider.regions.slice(0, 3));
    });
    
    return metadata;
  } catch (error) {
    console.error('Cloud metadata test failed:', error);
    throw error;
  }
}

// Test CPU calculation
export async function testCpuCalculation() {
  try {
    console.log('Testing CPU calculation...');
    const result = await ClimatiqService.calculateCpuEmissions('aws', {
      region: 'us_east_1',
      cpu_count: 2,
      average_vcpu_utilization: 0.5,
      duration: 1,
      duration_unit: 'hour'
    });
    
    console.log('CPU Calculation Result:', {
      co2e: result.co2e,
      co2e_unit: result.co2e_unit,
      source: result.emission_factor.source,
      activity_value: result.activity_data.activity_value,
      activity_unit: result.activity_data.activity_unit
    });
    
    return result;
  } catch (error) {
    console.error('CPU calculation test failed:', error);
    throw error;
  }
}

// Test Memory calculation
export async function testMemoryCalculation() {
  try {
    console.log('Testing Memory calculation...');
    const result = await ClimatiqService.calculateMemoryEmissions('gcp', {
      region: 'us_west_1',
      data: 8,
      data_unit: 'GB',
      duration: 24,
      duration_unit: 'hour'
    });
    
    console.log('Memory Calculation Result:', {
      co2e: result.co2e,
      co2e_unit: result.co2e_unit,
      source: result.emission_factor.source
    });
    
    return result;
  } catch (error) {
    console.error('Memory calculation test failed:', error);
    throw error;
  }
}

// Test Storage calculation
export async function testStorageCalculation() {
  try {
    console.log('Testing Storage calculation...');
    const result = await ClimatiqService.calculateStorageEmissions('aws', {
      region: 'us_east_1',
      storage_type: 'ssd',
      data: 100,
      data_unit: 'GB',
      duration: 24,
      duration_unit: 'hour'
    });
    
    console.log('Storage Calculation Result:', {
      co2e: result.co2e,
      co2e_unit: result.co2e_unit,
      source: result.emission_factor.source
    });
    
    return result;
  } catch (error) {
    console.error('Storage calculation test failed:', error);
    throw error;
  }
}

// Test Travel calculation
export async function testTravelCalculation() {
  try {
    console.log('Testing Travel calculation...');
    const result = await ClimatiqService.calculateTravelEmissions({
      travel_mode: 'air',
      origin: { query: 'New York' },
      destination: { query: 'London' }
    });
    
    console.log('Travel Calculation Result:', {
      co2e: result.co2e,
      co2e_unit: result.co2e_unit,
      distance_km: result.distance_km,
      origin: result.origin?.name,
      destination: result.destination?.name
    });
    
    return result;
  } catch (error) {
    console.error('Travel calculation test failed:', error);
    throw error;
  }
}

// Test Freight calculation
export async function testFreightCalculation() {
  try {
    console.log('Testing Freight calculation...');
    const result = await ClimatiqService.calculateFreightEmissions({
      route: [
        { 
          location: { 
            query: 'Hamburg',
            location_options: {
              tolerance_km: 20
            }
          } 
        },
        { transport_mode: 'road' },
        { 
          location: { 
            query: 'Berlin',
            location_options: {
              tolerance_km: 20
            }
          } 
        }
      ],
      cargo: {
        weight: 10,
        weight_unit: 't'
      }
    });
    
    console.log('Freight Calculation Result:', {
      co2e: result.co2e,
      co2e_unit: result.co2e_unit,
      distance_km: result.distance_km,
      cargo_tonnes: result.cargo_tonnes
    });
    
    return result;
  } catch (error) {
    console.error('Freight calculation test failed:', error);
    throw error;
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🧪 Starting Climatiq API Tests...\n');
  
  try {
    // Test 1: Cloud Metadata
    await testCloudMetadata();
    console.log('✅ Cloud metadata test passed\n');
    
    // Test 2: CPU Calculation
    await testCpuCalculation();
    console.log('✅ CPU calculation test passed\n');
    
    // Test 3: Memory Calculation  
    await testMemoryCalculation();
    console.log('✅ Memory calculation test passed\n');
    
    // Test 4: Storage Calculation
    await testStorageCalculation();
    console.log('✅ Storage calculation test passed\n');
    
    // Test 5: Travel Calculation
    await testTravelCalculation();
    console.log('✅ Travel calculation test passed\n');
    
    // Test 6: Freight Calculation
    await testFreightCalculation();
    console.log('✅ Freight calculation test passed\n');
    
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    throw error;
  }
}
