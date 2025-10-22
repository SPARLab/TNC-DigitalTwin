import type { Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Custom Playwright Reporter for Checkpoint System
 * Captures test results and appends them to CSV for historical tracking
 */
class CheckpointReporter implements Reporter {
  private checkpointDir: string;
  private timestamp: string;
  private timestampISO: string;
  private results: Map<string, LayerTestResult> = new Map();

  constructor() {
    this.timestampISO = new Date().toISOString();
    this.timestamp = this.formatTimestampPST(new Date());
    this.checkpointDir = path.join(__dirname, '../checkpoints');
    
    // Ensure checkpoint directory exists
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  /**
   * Format timestamp as human-readable PST (CSV-safe, no commas)
   * Example: "Oct 21 2025 3:30 PM"
   */
  private formatTimestampPST(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    // Format and remove commas to make it CSV-safe
    return new Intl.DateTimeFormat('en-US', options).format(date).replace(/,/g, '');
  }

  onBegin() {
    console.log('\n📋 Checkpoint Reporter: Starting test run');
    console.log(`⏰ Timestamp: ${this.timestamp}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Extract layer info from test title
    // test.titlePath() = ["LayerTitle [layer-id] @dynamic", "Complete Quality Check (8 Criteria)"]
    const testDescribeTitle = test.parent?.title || test.titlePath()[0] || 'Unknown';
    
    console.log(`[Checkpoint Reporter] Processing test: "${testDescribeTitle}"`);
    
    // Extract layer ID from brackets (e.g., "Layer [id] @dynamic" -> "id")
    const idMatch = testDescribeTitle.match(/\[([^\]]+)\]/);
    const layerId = idMatch ? idMatch[1] : this.titleToId(testDescribeTitle);
    
    // Extract layer title (remove [id] and @dynamic)
    const layerTitle = testDescribeTitle
      .replace(/\s*\[([^\]]+)\]\s*/g, '') // Remove [id]
      .replace(/\s*@dynamic\s*/g, '')      // Remove @dynamic
      .trim();
    
    console.log(`[Checkpoint Reporter] Extracted - ID: ${layerId}, Title: ${layerTitle}`);
    
    // Extract test step results
    const testStepResults: Record<string, string> = {
      test_1_shows_in_categories: 'SKIP',
      test_2_layers_load: 'SKIP',
      test_3_download_works: 'SKIP',
      test_4_description_matches: 'SKIP',
      test_5_tooltips_popup: 'SKIP',
      test_6_legend_exists: 'SKIP',
      test_7_legend_labels_descriptive: 'SKIP',
      test_8_filters_work: 'SKIP',
    };
    
    // Parse test steps for pass/fail status
    if (result.steps) {
      for (const step of result.steps) {
        const stepTitle = step.title;
        
        // Extract feature status from step title
        // Format: "X. Test Name [WORKS]" or "X. Test Name [BROKEN]" or "X. Test Name [SKIP]"
        const extractFeatureStatus = (title: string): 'PASS' | 'FAIL' | 'SKIP' => {
          if (title.includes('[WORKS]')) {
            return 'PASS';
          } else if (title.includes('[BROKEN]')) {
            return 'FAIL';
          } else if (title.includes('[SKIP]')) {
            return 'SKIP';
          }
          // Default to SKIP if no status tag found
          return 'SKIP';
        };
        
        const status = extractFeatureStatus(stepTitle);
        
        if (stepTitle.includes('1.')) {
          testStepResults.test_1_shows_in_categories = status;
        } else if (stepTitle.includes('2.')) {
          testStepResults.test_2_layers_load = status;
        } else if (stepTitle.includes('3.')) {
          testStepResults.test_3_download_works = status;
        } else if (stepTitle.includes('4.')) {
          testStepResults.test_4_description_matches = status;
        } else if (stepTitle.includes('5.')) {
          testStepResults.test_5_tooltips_popup = status;
        } else if (stepTitle.includes('6.')) {
          testStepResults.test_6_legend_exists = status;
        } else if (stepTitle.includes('7.')) {
          testStepResults.test_7_legend_labels_descriptive = status;
        } else if (stepTitle.includes('8.')) {
          testStepResults.test_8_filters_work = status;
        }
      }
    }
    
    // Determine layer type (FeatureService or ImageService)
    // This would ideally come from test metadata, for now infer from results
    const layerType = 'FeatureService'; // TODO: Get from test metadata
    
    // Store result
    this.results.set(layerId, {
      layerId,
      layerTitle,
      layerType,
      test_1_shows_in_categories: testStepResults.test_1_shows_in_categories,
      test_2_layers_load: testStepResults.test_2_layers_load,
      test_3_download_works: testStepResults.test_3_download_works,
      test_4_description_matches: testStepResults.test_4_description_matches,
      test_5_tooltips_popup: testStepResults.test_5_tooltips_popup,
      test_6_legend_exists: testStepResults.test_6_legend_exists,
      test_7_legend_labels_descriptive: testStepResults.test_7_legend_labels_descriptive,
      test_8_filters_work: testStepResults.test_8_filters_work,
      notes: result.error ? `Error: ${result.error.message}` : ''
    });
  }

  onEnd() {
    console.log('\n📝 Checkpoint Reporter: Writing results...');
    
    // Load expected data to determine if this is a full run
    const expectedResultsPath = path.join(__dirname, '../test-data/all-arcgis-layers.json');
    const expectedData = JSON.parse(fs.readFileSync(expectedResultsPath, 'utf-8'));
    const totalCategorizedLayers = expectedData.layers.filter((l: any) => 
      l.categories.length > 0 && !l.categories.includes('Uncategorized')
    ).length;
    
    // Determine run type
    const runType = this.results.size === totalCategorizedLayers ? 'FULL' : 'PARTIAL';
    
    // Save detailed JSON snapshot to appropriate folder
    const jsonFilename = this.saveJSONSnapshot(runType);
    
    // Calculate summary statistics
    const stats = this.calculateSummaryStats();
    
    console.log(`📊 Run Type: ${runType} (${this.results.size}/${totalCategorizedLayers} layers)`);
    console.log(`📊 Test Validation: TP=${stats.truePositives}, TN=${stats.trueNegatives}, FP=${stats.falsePositives}, FN=${stats.falseNegatives}, Accuracy=${stats.overallAccuracy}%`);
    console.log(`📊 Actual Quality: ${stats.totalPassingTests} passing, ${stats.totalFailingTests} failing tests`);
    console.log(`💾 Detailed results: ${runType.toLowerCase()}/${jsonFilename}`);
    
    // Only save FULL runs to history CSVs
    if (runType === 'FULL') {
      this.writeTestValidationHistory(stats, jsonFilename);
      this.writeCheckpointHistory(stats, jsonFilename);
      
      console.log(`✅ Appended FULL run to both history files`);
    } else {
      console.log(`⏭️  Skipped PARTIAL run (not saved to history)`);
      console.log(`ℹ️  PARTIAL runs are for manual review only`);
    }
  }

  /**
   * Write to test-validation-history.csv (temporary, for test validation phase)
   */
  private writeTestValidationHistory(stats: any, jsonFilename: string) {
    const validationPath = path.join(this.checkpointDir, 'test-validation-history.csv');
    const headers = 'timestamp,run_type,total_layers,feature_services,image_services,true_positives,true_negatives,false_positives,false_negatives,test_accuracy,passing_services,failing_services,failing_service_names,details_file\n';
    
    if (!fs.existsSync(validationPath)) {
      fs.writeFileSync(validationPath, headers, 'utf-8');
    }
    
    // Format failing service names
    let failingServiceNames: string;
    if (stats.failingServices.length === 0) {
      failingServiceNames = 'None';
    } else if (stats.failingServices.length <= 5) {
      failingServiceNames = stats.failingServices.join('; ');
    } else {
      failingServiceNames = `More than 5 failing, see ${jsonFilename}`;
    }
    
    const row = [
      this.timestamp,
      'FULL',
      this.results.size,
      stats.featureServicesCount,
      stats.imageServicesCount,
      stats.truePositives,
      stats.trueNegatives,
      stats.falsePositives,
      stats.falseNegatives,
      stats.overallAccuracy + '%',
      stats.passingServices.length,
      stats.failingServices.length,
      `"${failingServiceNames.replace(/"/g, '""')}"`,
      `full/${jsonFilename}`
    ].join(',') + '\n';
    
    fs.appendFileSync(validationPath, row, 'utf-8');
    console.log(`📋 Test Validation: ${validationPath}`);
  }

  /**
   * Write to checkpoint-history.csv (permanent, tracks actual service quality)
   */
  private writeCheckpointHistory(stats: any, jsonFilename: string) {
    const checkpointPath = path.join(this.checkpointDir, 'checkpoint-history.csv');
    const headers = 'timestamp,total_tests_passing,total_tests_failing,feature_services_passing,feature_services_failing,image_services_passing,image_services_failing,failing_service_names,details_file\n';
    
    if (!fs.existsSync(checkpointPath)) {
      fs.writeFileSync(checkpointPath, headers, 'utf-8');
    }
    
    // Format failing service names
    let failingServiceNames: string;
    if (stats.failingServices.length === 0) {
      failingServiceNames = 'None';
    } else if (stats.failingServices.length <= 5) {
      failingServiceNames = stats.failingServices.join('; ');
    } else {
      failingServiceNames = `More than 5 failing, see ${jsonFilename}`;
    }
    
    const row = [
      this.timestamp,
      stats.totalPassingTests,
      stats.totalFailingTests,
      stats.featureServicesPassing,
      stats.featureServicesFailing,
      stats.imageServicesPassing,
      stats.imageServicesFailing,
      `"${failingServiceNames.replace(/"/g, '""')}"`,
      jsonFilename
    ].join(',') + '\n';
    
    fs.appendFileSync(checkpointPath, row, 'utf-8');
    console.log(`📈 Checkpoint History: ${checkpointPath}`);
  }

  /**
   * Save detailed JSON snapshot for this checkpoint
   */
  private saveJSONSnapshot(runType: 'FULL' | 'PARTIAL'): string {
    const jsonFilename = `checkpoint-${this.timestampISO.replace(/[:.]/g, '-')}.json`;
    
    // Save to full/ or partial/ subfolder
    const subfolder = runType.toLowerCase();
    const subfolderPath = path.join(this.checkpointDir, subfolder);
    
    // Ensure subfolder exists
    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath, { recursive: true });
    }
    
    const jsonPath = path.join(subfolderPath, jsonFilename);
    
    const snapshot = {
      timestamp: this.timestamp, // Human-readable timestamp
      timestampISO: this.timestampISO, // ISO timestamp for reference
      runType, // FULL or PARTIAL
      totalLayers: this.results.size,
      results: Array.from(this.results.values())
    };
    
    fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    return jsonFilename;
  }

  /**
   * Calculate summary statistics for this checkpoint
   */
  private calculateSummaryStats() {
    // Load expected results
    const expectedResultsPath = path.join(__dirname, '../test-data/all-arcgis-layers.json');
    const expectedData = JSON.parse(fs.readFileSync(expectedResultsPath, 'utf-8'));
    
    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    let totalTests = 0;
    let totalPassingTests = 0;
    let totalFailingTests = 0;
    
    let featureServicesCount = 0;
    let imageServicesCount = 0;
    let featureServicesPassing = 0;
    let featureServicesFailing = 0;
    let imageServicesPassing = 0;
    let imageServicesFailing = 0;
    
    const failingServices: string[] = [];
    const passingServices: string[] = [];
    
    for (const layerResult of this.results.values()) {
      const expected = expectedData.layers.find((l: any) => l.id === layerResult.layerId);
      if (!expected) continue;
      
      // Count by type
      const isFeatureService = expected.type === 'FeatureService';
      const isImageService = expected.type === 'ImageService';
      
      if (isFeatureService) featureServicesCount++;
      else if (isImageService) imageServicesCount++;
      
      // Check each test (skip test 1 and 4 as they're not quality tests)
      const tests = [
        { actual: layerResult.test_2_layers_load, expected: expected.expectedResults.layersLoad },
        { actual: layerResult.test_3_download_works, expected: expected.expectedResults.downloadLinkWorks },
        { actual: layerResult.test_5_tooltips_popup, expected: expected.expectedResults.tooltipsPopUp },
        { actual: layerResult.test_6_legend_exists, expected: expected.expectedResults.legendExists },
        { actual: layerResult.test_7_legend_labels_descriptive, expected: expected.expectedResults.legendLabelsDescriptive },
        { actual: layerResult.test_8_filters_work, expected: expected.expectedResults.legendFiltersWork },
      ];
      
      let layerHasFailure = false;
      for (const test of tests) {
        if (test.expected === null || test.expected === undefined || test.actual === 'SKIP') continue;
        totalTests++;
        
        const actualPass = test.actual === 'PASS';
        const expectedPass = test.expected === true;
        
        // For test validation (TP/TN/FP/FN)
        if (actualPass && expectedPass) {
          truePositives++;
        } else if (!actualPass && !expectedPass) {
          trueNegatives++;
        } else if (actualPass && !expectedPass) {
          falsePositives++;
          layerHasFailure = true;
        } else if (!actualPass && expectedPass) {
          falseNegatives++;
          layerHasFailure = true;
        }
        
        // For actual quality tracking (regardless of expected)
        if (actualPass) {
          totalPassingTests++;
        } else {
          totalFailingTests++;
        }
      }
      
      // Track service pass/fail
      if (layerHasFailure) {
        failingServices.push(layerResult.layerTitle);
        if (isFeatureService) featureServicesFailing++;
        else if (isImageService) imageServicesFailing++;
      } else {
        passingServices.push(layerResult.layerTitle);
        if (isFeatureService) featureServicesPassing++;
        else if (isImageService) imageServicesPassing++;
      }
    }
    
    const overallAccuracy = totalTests > 0 ? ((truePositives + trueNegatives) / totalTests * 100).toFixed(1) : '0.0';
    
    return {
      // Test validation metrics
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
      overallAccuracy,
      totalTests,
      
      // Actual quality metrics
      totalPassingTests,
      totalFailingTests,
      
      // Service counts
      featureServicesCount,
      imageServicesCount,
      featureServicesPassing,
      featureServicesFailing,
      imageServicesPassing,
      imageServicesFailing,
      
      // Lists
      passingServices,
      failingServices
    };
  }

  /**
   * Convert layer title to ID (kebab-case)
   */
  private titleToId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

interface LayerTestResult {
  layerId: string;
  layerTitle: string;
  layerType: string;
  test_1_shows_in_categories: string;
  test_2_layers_load: string;
  test_3_download_works: string;
  test_4_description_matches: string;
  test_5_tooltips_popup: string;
  test_6_legend_exists: string;
  test_7_legend_labels_descriptive: string;
  test_8_filters_work: string;
  notes: string;
}

export default CheckpointReporter;

