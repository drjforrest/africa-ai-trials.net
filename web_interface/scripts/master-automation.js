#!/usr/bin/env node
/**
 * Master Automation Script - Fully automated living systematic review
 * Combines registry monitoring + database monitoring for true automation
 */

const RegistryMonitor = require('./registry-monitor');
const DatabaseMonitor = require('./monitor-database');
const FigureGenerator = require('./generate-figures');
const fs = require('fs');
const path = require('path');

const LOCK_FILE = path.join(__dirname, '../data/.master-automation-lock');

class MasterAutomation {
  constructor() {
    this.registryMonitor = new RegistryMonitor();
    this.databaseMonitor = new DatabaseMonitor();
    this.figureGenerator = new FigureGenerator();
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
      console.log(`[${new Date().toISOString()}] SATN Master Automation Started`);
      console.log(`[${new Date().toISOString()}] Living Systematic Review Update`);
      console.log(`[${new Date().toISOString()}] ========================================`);

      // Step 1: Check external registries for new trials
      console.log(`[${new Date().toISOString()}] Step 1: Checking external registries...`);
      const registryResults = await this.registryMonitor.checkRegistries();
      
      if (registryResults.newTrialsAdded > 0) {
        console.log(`[${new Date().toISOString()}] ✅ Added ${registryResults.newTrialsAdded} new trials from registries`);
        
        // Step 2: Process database changes (will detect the new trials we just added)
        console.log(`[${new Date().toISOString()}] Step 2: Processing database changes...`);
        await this.databaseMonitor.checkForChanges();
        console.log(`[${new Date().toISOString()}] ✅ Database processing completed`);
        
        // Step 3: Regenerate figures with updated data
        console.log(`[${new Date().toISOString()}] Step 3: Regenerating analysis figures...`);
        await this.figureGenerator.generateFigures();
        console.log(`[${new Date().toISOString()}] ✅ Figure generation completed`);
        
      } else {
        console.log(`[${new Date().toISOString()}] ℹ️ No new trials found in registries`);
      }

      console.log(`[${new Date().toISOString()}] ========================================`);
      console.log(`[${new Date().toISOString()}] SATN Master Automation Completed`);
      console.log(`[${new Date().toISOString()}] Summary:`);
      console.log(`[${new Date().toISOString()}]   Registry trials found: ${registryResults.newTrialsFound}`);
      console.log(`[${new Date().toISOString()}]   Registry trials added: ${registryResults.newTrialsAdded}`);
      console.log(`[${new Date().toISOString()}] ========================================`);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Master automation error:`, error);
    } finally {
      this.cleanup();
    }
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
  const automation = new MasterAutomation();
  
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

module.exports = MasterAutomation;
