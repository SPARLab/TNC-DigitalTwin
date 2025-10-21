import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Progress Tracking Script
 * Analyzes trends across all checkpoints
 * Shows improvements and regressions over time
 */

interface CheckpointSummary {
  timestamp: string;
  totalLayers: number;
  layersPassingAll: number;
  totalBugs: number;
  layers: Map<string, LayerStatus>;
}

interface LayerStatus {
  layerId: string;
  layerTitle: string;
  passedTests: number;
  totalTests: number;
  allPassed: boolean;
}

/**
 * Parse CSV row
 */
function parseCSVRow(line: string): string[] {
  const cleanLine = line.replace(/\r/g, '');
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < cleanLine.length; i++) {
    const char = cleanLine[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());
  
  return values;
}

/**
 * Read all checkpoints from CSV
 */
function readAllCheckpoints(csvPath: string): CheckpointSummary[] {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Checkpoint CSV not found: ${csvPath}`);
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    throw new Error('No checkpoint data found in CSV');
  }
  
  // Group rows by timestamp
  const checkpointMap = new Map<string, CheckpointSummary>();
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    if (values.length < 13) continue;
    
    const timestamp = values[0];
    const layerId = values[1];
    const layerTitle = values[2];
    const tests = [values[4], values[5], values[6], values[8], values[9], values[10], values[11]]; // Skip test 4 (description)
    
    if (!checkpointMap.has(timestamp)) {
      checkpointMap.set(timestamp, {
        timestamp,
        totalLayers: 0,
        layersPassingAll: 0,
        totalBugs: 0,
        layers: new Map()
      });
    }
    
    const checkpoint = checkpointMap.get(timestamp)!;
    
    // Count passed tests
    const passedTests = tests.filter(t => t === 'PASS').length;
    const totalTests = tests.filter(t => t !== 'SKIP').length;
    const allPassed = passedTests === totalTests && totalTests > 0;
    
    checkpoint.layers.set(layerId, {
      layerId,
      layerTitle,
      passedTests,
      totalTests,
      allPassed
    });
    
    checkpoint.totalLayers++;
    if (allPassed) {
      checkpoint.layersPassingAll++;
    }
    checkpoint.totalBugs += (totalTests - passedTests);
  }
  
  // Convert to array and sort by timestamp
  const checkpoints = Array.from(checkpointMap.values()).sort((a, b) => 
    a.timestamp.localeCompare(b.timestamp)
  );
  
  return checkpoints;
}

/**
 * Find regressions (layers that were passing, now fail)
 */
function findRegressions(
  prevCheckpoint: CheckpointSummary,
  currentCheckpoint: CheckpointSummary
): string[] {
  const regressions: string[] = [];
  
  for (const [layerId, prevStatus] of prevCheckpoint.layers.entries()) {
    const currentStatus = currentCheckpoint.layers.get(layerId);
    
    if (!currentStatus) continue;
    
    // Regression: was passing all tests, now failing some
    if (prevStatus.allPassed && !currentStatus.allPassed) {
      regressions.push(currentStatus.layerTitle);
    }
  }
  
  return regressions;
}

/**
 * Find progressions (layers that were failing, now pass)
 */
function findProgressions(
  prevCheckpoint: CheckpointSummary,
  currentCheckpoint: CheckpointSummary
): string[] {
  const progressions: string[] = [];
  
  for (const [layerId, currentStatus] of currentCheckpoint.layers.entries()) {
    const prevStatus = prevCheckpoint.layers.get(layerId);
    
    if (!prevStatus) continue;
    
    // Progression: was failing some tests, now passing all
    if (!prevStatus.allPassed && currentStatus.allPassed) {
      progressions.push(currentStatus.layerTitle);
    }
  }
  
  return progressions;
}

/**
 * Format date for display
 */
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Main progress reporting logic
 */
function main() {
  const checkpointCSV = path.join(__dirname, '../checkpoints/test-results-history.csv');
  
  console.log('\n═══════════════════════════════════════════');
  console.log('   QUALITY PROGRESS REPORT');
  console.log('═══════════════════════════════════════════\n');
  
  const checkpoints = readAllCheckpoints(checkpointCSV);
  
  if (checkpoints.length === 0) {
    console.log('No checkpoints found. Run `npm run test:e2e:checkpoint` first.');
    return;
  }
  
  console.log(`Found ${checkpoints.length} checkpoint(s)\n`);
  
  // Display each checkpoint
  for (let i = 0; i < checkpoints.length; i++) {
    const checkpoint = checkpoints[i];
    const prevCheckpoint = i > 0 ? checkpoints[i - 1] : null;
    
    console.log(`───────────────────────────────────────────`);
    console.log(`Checkpoint ${i + 1}: ${formatDate(checkpoint.timestamp)}`);
    console.log(`───────────────────────────────────────────`);
    
    const passRate = (checkpoint.layersPassingAll / checkpoint.totalLayers) * 100;
    console.log(`Layers passing all tests: ${checkpoint.layersPassingAll}/${checkpoint.totalLayers} (${passRate.toFixed(1)}%)`);
    console.log(`Total bugs: ${checkpoint.totalBugs}`);
    
    if (prevCheckpoint) {
      const layersDelta = checkpoint.layersPassingAll - prevCheckpoint.layersPassingAll;
      const bugsDelta = checkpoint.totalBugs - prevCheckpoint.totalBugs;
      
      if (layersDelta > 0) {
        console.log(`⬆️  +${layersDelta} layers improved`);
      } else if (layersDelta < 0) {
        console.log(`⬇️  ${layersDelta} layers regressed`);
      }
      
      if (bugsDelta < 0) {
        console.log(`⬇️  ${Math.abs(bugsDelta)} fewer bugs`);
      } else if (bugsDelta > 0) {
        console.log(`⬆️  +${bugsDelta} more bugs`);
      }
      
      // Find specific progressions and regressions
      const progressions = findProgressions(prevCheckpoint, checkpoint);
      const regressions = findRegressions(prevCheckpoint, checkpoint);
      
      if (progressions.length > 0) {
        console.log(`\n✅ Fixed layers (${progressions.length}):`);
        progressions.forEach(layer => console.log(`   - ${layer}`));
      }
      
      if (regressions.length > 0) {
        console.log(`\n❌ Regressed layers (${regressions.length}):`);
        regressions.forEach(layer => console.log(`   - ${layer}`));
      }
    }
    
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════');
  
  // Show overall trend
  if (checkpoints.length >= 2) {
    const firstCheckpoint = checkpoints[0];
    const lastCheckpoint = checkpoints[checkpoints.length - 1];
    
    const initialPassRate = (firstCheckpoint.layersPassingAll / firstCheckpoint.totalLayers) * 100;
    const currentPassRate = (lastCheckpoint.layersPassingAll / lastCheckpoint.totalLayers) * 100;
    const improvement = currentPassRate - initialPassRate;
    
    console.log('\nOVERALL TREND:');
    console.log(`Initial: ${initialPassRate.toFixed(1)}% layers passing`);
    console.log(`Current: ${currentPassRate.toFixed(1)}% layers passing`);
    
    if (improvement > 0) {
      console.log(`📈 Improvement: +${improvement.toFixed(1)}%`);
    } else if (improvement < 0) {
      console.log(`📉 Decline: ${improvement.toFixed(1)}%`);
    } else {
      console.log(`➡️  No change`);
    }
    
    const bugChange = lastCheckpoint.totalBugs - firstCheckpoint.totalBugs;
    if (bugChange < 0) {
      console.log(`🐛 ${Math.abs(bugChange)} fewer bugs total`);
    } else if (bugChange > 0) {
      console.log(`🐛 ${bugChange} more bugs total`);
    }
  }
  
  console.log('═══════════════════════════════════════════\n');
}

main();

