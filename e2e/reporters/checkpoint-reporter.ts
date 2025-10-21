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
  private csvPath: string;
  private checkpointDir: string;
  private timestamp: string;
  private results: Map<string, LayerTestResult> = new Map();

  constructor() {
    this.timestamp = new Date().toISOString();
    this.checkpointDir = path.join(__dirname, '../checkpoints');
    this.csvPath = path.join(this.checkpointDir, 'test-results-history.csv');
    
    // Ensure checkpoint directory exists
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  onBegin() {
    console.log('\n📋 Checkpoint Reporter: Starting test run');
    console.log(`⏰ Timestamp: ${this.timestamp}`);
    
    // Create CSV with headers if it doesn't exist
    if (!fs.existsSync(this.csvPath)) {
      const headers = [
        'timestamp',
        'layer_id',
        'layer_title',
        'type',
        'test_1_shows_in_categories',
        'test_2_layers_load',
        'test_3_download_works',
        'test_4_description_matches',
        'test_5_tooltips_popup',
        'test_6_legend_exists',
        'test_7_legend_labels_descriptive',
        'test_8_filters_work',
        'notes'
      ].join(',');
      
      fs.writeFileSync(this.csvPath, headers + '\n', 'utf-8');
      console.log(`✅ Created new CSV: ${this.csvPath}`);
    }
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
      ...testStepResults,
      notes: result.error ? `Error: ${result.error.message}` : ''
    });
  }

  onEnd() {
    console.log('\n📝 Checkpoint Reporter: Writing results to CSV');
    
    // Append all results to CSV
    let rowsWritten = 0;
    for (const result of this.results.values()) {
      const row = [
        this.timestamp,
        result.layerId,
        `"${result.layerTitle}"`, // Quote title in case it has commas
        result.layerType,
        result.test_1_shows_in_categories,
        result.test_2_layers_load,
        result.test_3_download_works,
        result.test_4_description_matches,
        result.test_5_tooltips_popup,
        result.test_6_legend_exists,
        result.test_7_legend_labels_descriptive,
        result.test_8_filters_work,
        `"${result.notes}"` // Quote notes in case of commas
      ].join(',');
      
      fs.appendFileSync(this.csvPath, row + '\n', 'utf-8');
      rowsWritten++;
    }
    
    console.log(`✅ Wrote ${rowsWritten} layer results to CSV`);
    console.log(`📊 CSV location: ${this.csvPath}`);
    
    // Optionally save detailed JSON snapshot
    this.saveJSONSnapshot();
  }

  /**
   * Save detailed JSON snapshot for this checkpoint
   */
  private saveJSONSnapshot() {
    const jsonFilename = `checkpoint-${this.timestamp.replace(/[:.]/g, '-')}.json`;
    const jsonPath = path.join(this.checkpointDir, jsonFilename);
    
    const snapshot = {
      timestamp: this.timestamp,
      totalLayers: this.results.size,
      results: Array.from(this.results.values())
    };
    
    fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`💾 Saved detailed JSON snapshot: ${jsonFilename}`);
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

