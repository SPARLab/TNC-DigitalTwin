/**
 * eBird Query Test Script
 * 
 * Run this to test eBird service queries and identify any constraints.
 * 
 * Usage: 
 * 1. Start the dev server: npm run dev
 * 2. Open browser console
 * 3. Run: (window as any).testEBirdQueries()
 */

import { eBirdService } from './services/eBirdService';

interface QueryTestResult {
  testName: string;
  params: any;
  resultCount: number;
  exceededLimit: boolean;
  error?: string;
  duration: number;
}

async function runQueryTest(
  testName: string,
  params: any
): Promise<QueryTestResult> {
  const startTime = performance.now();
  
  try {
    console.log(`\n🧪 Running test: ${testName}`);
    console.log('   Parameters:', JSON.stringify(params, null, 2));
    
    const response = await eBirdService.queryObservations(params);
    const duration = performance.now() - startTime;
    
    const result: QueryTestResult = {
      testName,
      params,
      resultCount: response.observations.length,
      exceededLimit: response.exceededLimit,
      duration: Math.round(duration)
    };
    
    console.log(`   ✅ Results: ${result.resultCount} observations in ${result.duration}ms`);
    console.log(`   📊 Exceeded limit: ${result.exceededLimit}`);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    const result: QueryTestResult = {
      testName,
      params,
      resultCount: 0,
      exceededLimit: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Math.round(duration)
    };
    
    console.error(`   ❌ Error: ${result.error}`);
    return result;
  }
}

export async function testEBirdQueries() {
  console.log('🐦 ========================================');
  console.log('🐦 eBird Query Diagnostic Tests');
  console.log('🐦 ========================================');
  
  const results: QueryTestResult[] = [];
  
  // Calculate date ranges
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const fiveYearsAgo = new Date(today);
  fiveYearsAgo.setFullYear(today.getFullYear() - 5);
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  // Test 1: Default query (no filters)
  results.push(await runQueryTest('Test 1: Default query (no filters)', {}));
  
  // Test 2: Last 1 year with default maxResults
  results.push(await runQueryTest('Test 2: Last 1 year (default maxResults=2000)', {
    startDate: formatDate(oneYearAgo),
    endDate: formatDate(today)
  }));
  
  // Test 3: Last 5 years with default maxResults
  results.push(await runQueryTest('Test 3: Last 5 years (default maxResults=2000)', {
    startDate: formatDate(fiveYearsAgo),
    endDate: formatDate(today)
  }));
  
  // Test 4: Last 1 year with maxResults=500
  results.push(await runQueryTest('Test 4: Last 1 year (maxResults=500)', {
    startDate: formatDate(oneYearAgo),
    endDate: formatDate(today),
    maxResults: 500
  }));
  
  // Test 5: Last 1 year with maxResults=1000
  results.push(await runQueryTest('Test 5: Last 1 year (maxResults=1000)', {
    startDate: formatDate(oneYearAgo),
    endDate: formatDate(today),
    maxResults: 1000
  }));
  
  // Test 6: Last 1 year with maxResults=2000, pageSize=2000
  results.push(await runQueryTest('Test 6: Last 1 year (maxResults=2000, pageSize=2000)', {
    startDate: formatDate(oneYearAgo),
    endDate: formatDate(today),
    maxResults: 2000,
    pageSize: 2000
  }));
  
  // Test 7: Last 5 years with maxResults=5000 (tests pagination - should fetch multiple pages)
  results.push(await runQueryTest('Test 7: Last 5 years (maxResults=5000, pagination test)', {
    startDate: formatDate(fiveYearsAgo),
    endDate: formatDate(today),
    maxResults: 5000
  }));
  
  // Test 7b: Last 1 year with maxResults=10000 (pagination test)
  results.push(await runQueryTest('Test 7b: Last 1 year (maxResults=10000, pagination test)', {
    startDate: formatDate(oneYearAgo),
    endDate: formatDate(today),
    maxResults: 10000
  }));
  
  // Test 8: Preserve-only search mode
  results.push(await runQueryTest('Test 8: Preserve-only mode', {
    startDate: formatDate(oneYearAgo),
    endDate: formatDate(today),
    searchMode: 'preserve-only' as const
  }));
  
  // Test 9: Expanded search mode (1.5 mile buffer)
  results.push(await runQueryTest('Test 9: Expanded mode (1.5 mile buffer)', {
    startDate: formatDate(oneYearAgo),
    endDate: formatDate(today),
    searchMode: 'expanded' as const
  }));
  
  // Test 10: Direct ArcGIS query count
  console.log('\n🧪 Running test: Test 10: Direct count query');
  try {
    const count = await eBirdService.queryObservationsCount({
      startDate: formatDate(oneYearAgo),
      endDate: formatDate(today)
    });
    console.log(`   ✅ Total available observations (1 year): ${count}`);
    results.push({
      testName: 'Test 10: Direct count query (1 year)',
      params: { startDate: formatDate(oneYearAgo), endDate: formatDate(today) },
      resultCount: count,
      exceededLimit: false,
      duration: 0
    });
  } catch (error) {
    console.error(`   ❌ Error:`, error);
  }
  
  // Test 11: Direct ArcGIS query count (5 years)
  console.log('\n🧪 Running test: Test 11: Direct count query (5 years)');
  try {
    const count = await eBirdService.queryObservationsCount({
      startDate: formatDate(fiveYearsAgo),
      endDate: formatDate(today)
    });
    console.log(`   ✅ Total available observations (5 years): ${count}`);
    results.push({
      testName: 'Test 11: Direct count query (5 years)',
      params: { startDate: formatDate(fiveYearsAgo), endDate: formatDate(today) },
      resultCount: count,
      exceededLimit: false,
      duration: 0
    });
  } catch (error) {
    console.error(`   ❌ Error:`, error);
  }
  
  // Print summary table
  console.log('\n📊 ========================================');
  console.log('📊 Test Results Summary');
  console.log('📊 ========================================');
  console.table(results.map(r => ({
    Test: r.testName,
    Count: r.resultCount,
    'Exceeded Limit': r.exceededLimit ? '⚠️ Yes' : 'No',
    'Duration (ms)': r.duration,
    Error: r.error || '-'
  })));
  
  // Analysis
  console.log('\n🔍 Analysis:');
  
  // Check if pagination is working
  const test7b = results.find(r => r.testName.includes('7b'));
  const countTest1Year = results.find(r => r.testName.includes('Test 10'));
  
  if (test7b && countTest1Year && test7b.resultCount > 2000) {
    console.log('✅ PAGINATION WORKING: Fetched more than 2000 records');
    console.log(`   Total fetched: ${test7b.resultCount} of ${countTest1Year.resultCount} available`);
  }
  
  const has500Cap = results.some(r => r.resultCount === 500 && !r.testName.includes('maxResults=500'));
  if (has500Cap) {
    console.log('⚠️  WARNING: Some queries returned exactly 500 observations');
    console.log('   Pagination may not be working correctly.');
  }
  
  const has2000Cap = results.some(r => r.resultCount === 2000 && !r.testName.includes('maxResults=2000'));
  if (has2000Cap) {
    console.log('⚠️  WARNING: Some queries returned exactly 2000 observations');
    console.log('   This is the ArcGIS service limit. Pagination should have fetched more.');
  }
  
  console.log('\n💡 Pagination Status:');
  console.log('   ✅ ArcGIS service limit: 2000 records per request');
  console.log('   ✅ Pagination implemented to fetch all records in batches');
  console.log('   📝 Check browser console for "[eBird] Page X:" logs to see pagination in action');
  
  return results;
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testEBirdQueries = testEBirdQueries;
  console.log('✅ eBird query test loaded. Run: testEBirdQueries()');
}
