#!/usr/bin/env node
/**
 * Database Monitor - Watches for changes in the SQLite database and automatically updates JSON data
 * Sends notifications when new trials are registered or completed
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { spawn } = require('child_process');

const DB_PATH = path.join(__dirname, '../data/network.db');
const LAST_CHECK_FILE = path.join(__dirname, '../data/.last-check');
const LOCK_FILE = path.join(__dirname, '../data/.monitor-lock');

class DatabaseMonitor {
  constructor() {
    this.db = new Database(DB_PATH, { readonly: true });
    this.isProcessing = false;
  }

  async start() {
    console.log(`[${new Date().toISOString()}] Starting database monitor...`);
    
    // Initial check
    await this.checkForChanges();
    
    // Set up file watcher
    fs.watchFile(DB_PATH, { interval: 5000 }, async (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log(`[${new Date().toISOString()}] Database file changed, checking for updates...`);
        await this.checkForChanges();
      }
    });

    console.log(`[${new Date().toISOString()}] Monitor started. Watching ${DB_PATH}`);
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log(`[${new Date().toISOString()}] Monitor stopping...`);
      this.cleanup();
      process.exit(0);
    });
  }

  async checkForChanges() {
    if (this.isProcessing) {
      console.log(`[${new Date().toISOString()}] Already processing, skipping...`);
      return;
    }

    // Create lock file
    if (fs.existsSync(LOCK_FILE)) {
      console.log(`[${new Date().toISOString()}] Lock file exists, skipping...`);
      return;
    }

    try {
      fs.writeFileSync(LOCK_FILE, new Date().toISOString());
      this.isProcessing = true;

      const lastCheck = this.getLastCheckTime();
      const changes = await this.detectChanges(lastCheck);

      if (changes.hasChanges) {
        console.log(`[${new Date().toISOString()}] Changes detected:`, changes.summary);
        
        // Send notifications
        await this.sendNotifications(changes);
        
        // Update JSON data
        await this.updateJsonData();
        
        // Update last check time
        this.updateLastCheckTime();
        
        console.log(`[${new Date().toISOString()}] Data update completed successfully`);
      } else {
        console.log(`[${new Date().toISOString()}] No changes detected`);
      }

    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error checking for changes:`, error);
    } finally {
      this.isProcessing = false;
      if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
      }
    }
  }

  getLastCheckTime() {
    if (fs.existsSync(LAST_CHECK_FILE)) {
      return fs.readFileSync(LAST_CHECK_FILE, 'utf8').trim();
    }
    return '2000-01-01 00:00:00'; // Default to very old date
  }

  updateLastCheckTime() {
    fs.writeFileSync(LAST_CHECK_FILE, new Date().toISOString());
  }

  async detectChanges(lastCheck) {
    const changes = {
      hasChanges: false,
      newTrials: [],
      completedTrials: [],
      newInstitutions: [],
      newCompanies: [],
      newRelationships: [],
      summary: {}
    };

    try {
      // Check for new clinical trials
      const newTrials = this.db.prepare(`
        SELECT * FROM clinical_trials 
        WHERE datetime(start_date) > datetime(?)
        ORDER BY start_date DESC
      `).all(lastCheck);

      if (newTrials.length > 0) {
        changes.newTrials = newTrials;
        changes.hasChanges = true;
      }

      // Check for recently completed trials
      const completedTrials = this.db.prepare(`
        SELECT * FROM clinical_trials 
        WHERE status = 'Completed' 
        AND datetime(COALESCE(end_date, start_date)) > datetime(?)
        ORDER BY COALESCE(end_date, start_date) DESC
      `).all(lastCheck);

      if (completedTrials.length > 0) {
        changes.completedTrials = completedTrials;
        changes.hasChanges = true;
      }

      // Check for new institutions (those that appear in recent relationships)
      const newInstitutions = this.db.prepare(`
        SELECT DISTINCT i.* FROM institutions i
        JOIN relationships r ON (r.entity1_type = 'institution' AND r.entity1_id = i.institution_id)
                             OR (r.entity2_type = 'institution' AND r.entity2_id = i.institution_id)
        WHERE datetime(r.start_date) > datetime(?)
        ORDER BY r.start_date DESC
      `).all(lastCheck);

      if (newInstitutions.length > 0) {
        changes.newInstitutions = newInstitutions;
        changes.hasChanges = true;
      }

      // Check for new companies
      const newCompanies = this.db.prepare(`
        SELECT DISTINCT c.* FROM companies c
        JOIN relationships r ON (r.entity1_type = 'company' AND r.entity1_id = c.company_id)
                             OR (r.entity2_type = 'company' AND r.entity2_id = c.company_id)
        WHERE datetime(r.start_date) > datetime(?)
        ORDER BY r.start_date DESC
      `).all(lastCheck);

      if (newCompanies.length > 0) {
        changes.newCompanies = newCompanies;
        changes.hasChanges = true;
      }

      // Check for new relationships
      const newRelationships = this.db.prepare(`
        SELECT * FROM relationships 
        WHERE datetime(start_date) > datetime(?)
        ORDER BY start_date DESC
      `).all(lastCheck);

      if (newRelationships.length > 0) {
        changes.newRelationships = newRelationships;
        changes.hasChanges = true;
      }

      // Create summary
      changes.summary = {
        newTrials: changes.newTrials.length,
        completedTrials: changes.completedTrials.length,
        newInstitutions: changes.newInstitutions.length,
        newCompanies: changes.newCompanies.length,
        newRelationships: changes.newRelationships.length
      };

    } catch (error) {
      console.error('Error detecting changes:', error);
    }

    return changes;
  }

  async sendNotifications(changes) {
    const notifications = [];

    // New trial notifications
    changes.newTrials.forEach(trial => {
      notifications.push({
        type: 'NEW_TRIAL',
        title: `New Clinical Trial Registered: ${trial.title}`,
        message: `Phase ${trial.phase} trial started in ${trial.country} - ${trial.target_condition}`,
        data: trial,
        timestamp: new Date().toISOString()
      });
    });

    // Completed trial notifications
    changes.completedTrials.forEach(trial => {
      notifications.push({
        type: 'TRIAL_COMPLETED',
        title: `Clinical Trial Completed: ${trial.title}`,
        message: `Phase ${trial.phase} trial completed in ${trial.country} with ${trial.sample_size} participants`,
        data: trial,
        timestamp: new Date().toISOString()
      });
    });

    // New institution notifications
    changes.newInstitutions.forEach(institution => {
      notifications.push({
        type: 'NEW_INSTITUTION',
        title: `New Institution Joined Network: ${institution.name}`,
        message: `${institution.type} from ${institution.city}, ${institution.country}`,
        data: institution,
        timestamp: new Date().toISOString()
      });
    });

    // New company notifications
    changes.newCompanies.forEach(company => {
      notifications.push({
        type: 'NEW_COMPANY',
        title: `New Company Joined Network: ${company.name}`,
        message: `${company.company_type} focused on ${company.primary_focus}`,
        data: company,
        timestamp: new Date().toISOString()
      });
    });

    if (notifications.length > 0) {
      // Log notifications to console
      console.log(`[${new Date().toISOString()}] === NOTIFICATIONS ===`);
      notifications.forEach(notif => {
        console.log(`[${notif.type}] ${notif.title}`);
        console.log(`  ${notif.message}`);
      });

      // Save notifications to file for review
      const notifFile = path.join(__dirname, '../data/notifications.json');
      let existingNotifs = [];
      if (fs.existsSync(notifFile)) {
        try {
          existingNotifs = JSON.parse(fs.readFileSync(notifFile, 'utf8'));
        } catch (e) {
          existingNotifs = [];
        }
      }

      existingNotifs.push(...notifications);
      
      // Keep only last 100 notifications
      if (existingNotifs.length > 100) {
        existingNotifs = existingNotifs.slice(-100);
      }

      fs.writeFileSync(notifFile, JSON.stringify(existingNotifs, null, 2));
      
      // Send desktop notification (macOS)
      if (process.platform === 'darwin') {
        const title = notifications.length === 1 
          ? notifications[0].title 
          : `${notifications.length} Network Updates`;
        const message = notifications.length === 1 
          ? notifications[0].message 
          : `${changes.summary.newTrials} new trials, ${changes.summary.completedTrials} completed trials`;
        
        spawn('osascript', [
          '-e', 
          `display notification "${message}" with title "${title}" sound name "Glass"`
        ]);
      }
    }
  }

  async updateJsonData() {
    console.log(`[${new Date().toISOString()}] Updating JSON data...`);
    
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
          console.log(`[${new Date().toISOString()}] JSON data updated successfully`);
          console.log(output);
          resolve();
        } else {
          console.error(`[${new Date().toISOString()}] Error updating JSON data:`, errorOutput);
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new DatabaseMonitor();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--check-once')) {
    // Run once and exit
    monitor.checkForChanges().then(() => {
      monitor.cleanup();
      process.exit(0);
    }).catch(error => {
      console.error('Error:', error);
      monitor.cleanup();
      process.exit(1);
    });
  } else {
    // Run continuously
    monitor.start().catch(error => {
      console.error('Error starting monitor:', error);
      monitor.cleanup();
      process.exit(1);
    });
  }
}

module.exports = DatabaseMonitor;