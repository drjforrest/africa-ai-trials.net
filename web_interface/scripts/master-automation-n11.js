#!/usr/bin/env node
/**
 * Master Automation Script for N=11 Dataset
 * Implements Living Systematic Review Platform (LSRP) from protocol
 * 
 * Workflow:
 * 1. Check external registries for new trials
 * 2. Save new trials for manual verification (per protocol)
 * 3. Process verified trials and update database
 * 4. Update JSON data for frontend
 * 5. Generate notifications
 */

const RegistryMonitorN11 = require('./registry-monitor-n11');
const DatabaseMonitor = require('./monitor-database');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const LOCK_FILE = path.join(__dirname, '../data/.master-automation-lock');
const PENDING_VERIFICATION_FILE = path.join(__dirname, '../data/pending-verification.json');

class MasterAutomationN11 {
  constructor() {
    this.registryMonitor = new RegistryMonitorN11();
    this.databaseMonitor = new DatabaseMonitor();
  }

  async run() {
    // Prevent multiple instances
    if (fs.existsSync(LOCK_FILE)) {
      console.log(`[${new Date().toISOString()}] Master automation already running, exiting...`);
      return;
    }

    try {
      fs.writeFileSync(LOCK_FILE, new Date().toISOString());
      
      console.log(`[${new Date().toISOString()}] ========================================`);
      console.log(`[${new Date().toISOString()}] AI Trials Africa - Master Automation (N=11)`);
      console.log(`[${new Date().toISOString()}] Living Systematic Review Platform`);
      console.log(`[${new Date().toISOString()}] ========================================`);

      // Step 1: Check external registries for new trials
      console.log(`\n[${new Date().toISOString()}] Step 1: Checking external registries...`);
      console.log(`[${new Date().toISOString()}]   - ClinicalTrials.gov`);
      console.log(`[${new Date().toISOString()}]   - Pan African Clinical Trials Registry (PACTR)`);
      console.log(`[${new Date().toISOString()}]   - WHO International Clinical Trials Registry Platform`);
      
      const registryResults = await this.registryMonitor.checkRegistries();
      
      console.log(`[${new Date().toISOString()}] ✅ Registry check completed`);
      console.log(`[${new Date().toISOString()}]   - Trials found: ${registryResults.newTrialsFound}`);
      console.log(`[${new Date().toISOString()}]   - Unique trials: ${registryResults.uniqueTrials}`);
      console.log(`[${new Date().toISOString()}]   - Pending verification: ${registryResults.newTrialsPendingVerification}`);
      
      if (registryResults.newTrialsPendingVerification > 0) {
        console.log(`\n[${new Date().toISOString()}] Step 2: New trials require manual verification`);
        console.log(`[${new Date().toISOString()}]   Review pending trials in: ${PENDING_VERIFICATION_FILE}`);
        console.log(`[${new Date().toISOString()}]   Run: node scripts/verify-trials.js to review`);
      } else {
        console.log(`\n[${new Date().toISOString()}] ℹ️ No new trials found in registries`);
      }

      // Step 3: Process database changes (for already verified trials)
      console.log(`\n[${new Date().toISOString()}] Step 3: Processing database changes...`);
      await this.databaseMonitor.checkForChanges();
      console.log(`[${new Date().toISOString()}] ✅ Database processing completed`);

      // Step 4: Update JSON data for frontend
      console.log(`\n[${new Date().toISOString()}] Step 4: Updating frontend data...`);
      await this.updateJsonData();
      console.log(`[${new Date().toISOString()}] ✅ Frontend data updated`);

      console.log(`\n[${new Date().toISOString()}] ========================================`);
      console.log(`[${new Date().toISOString()}] Automation Completed`);
      console.log(`[${new Date().toISOString()}] ========================================`);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Master automation error:`, error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  async updateJsonData() {
    return new Promise((resolve, reject) => {
      const processScript = path.join(__dirname, 'process-sqlite-data-n11.js');
      const child = spawn('node', [processScript], {
        cwd: path.dirname(processScript),
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  cleanup() {
    if (this.registryMonitor) {
      this.registryMonitor.cleanup();
    }
    if (this.databaseMonitor) {
      this.databaseMonitor.cleanup();
    }
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  }
}

// CLI interface
if (require.main === module) {
  const automation = new MasterAutomationN11();
  
  // Handle shutdown signals
  process.on('SIGINT', () => {
    console.log(`[${new Date().toISOString()}] Received SIGINT, shutting down...`);
    automation.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(`[${new Date().toISOString()}] Received SIGTERM, shutting down...`);
    automation.cleanup();
    process.exit(0);
  });

  automation.run().catch(error => {
    console.error('Master automation failed:', error);
    automation.cleanup();
    process.exit(1);
  });
}

module.exports = MasterAutomationN11;

