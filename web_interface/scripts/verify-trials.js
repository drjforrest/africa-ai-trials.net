#!/usr/bin/env node
/**
 * Manual Verification Tool for N=11 Dataset
 * Implements the manual verification workflow from protocol Section 1
 * 
 * Two independent reviewers verify each trial meets inclusion criteria:
 * - Conducted entirely or partially in Sub-Saharan Africa
 * - Evaluates AI diagnostic technology as primary intervention
 * - Involves prospective human participants
 * - Registered in recognized clinical trial registry
 * - Sufficient documentation to extract institutional relationships
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const readline = require('readline');

const PENDING_VERIFICATION_FILE = path.join(__dirname, '../data/pending-verification.json');
const VERIFIED_TRIALS_FILE = path.join(__dirname, '../data/verified-trials.json');
const DB_PATH = path.join(__dirname, '../data/network.db');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

class TrialVerifier {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  loadPendingTrials() {
    if (!fs.existsSync(PENDING_VERIFICATION_FILE)) {
      return [];
    }
    try {
      const data = fs.readFileSync(PENDING_VERIFICATION_FILE, 'utf8');
      return JSON.parse(data).filter(t => !t.verified);
    } catch (e) {
      return [];
    }
  }

  async verifyTrial(trial, reviewer) {
    console.log('\n' + '='.repeat(70));
    console.log(`Trial: ${trial.trial_id}`);
    console.log(`Title: ${trial.title}`);
    console.log(`Registry: ${trial.registry_source}`);
    console.log(`Country: ${trial.country}`);
    console.log(`Technology: ${trial.technology_type || 'Not specified'}`);
    console.log('='.repeat(70));

    console.log('\nInclusion Criteria (from protocol):');
    console.log('1. Conducted entirely or partially in Sub-Saharan Africa');
    console.log('2. Evaluates AI diagnostic technology as primary intervention');
    console.log('3. Involves prospective human participants');
    console.log('4. Registered in recognized clinical trial registry');
    console.log('5. Sufficient documentation to extract institutional relationships');

    const meetsCriteria = await question('\nDoes this trial meet ALL inclusion criteria? (y/n): ');
    
    if (meetsCriteria.toLowerCase() !== 'y') {
      const reason = await question('Exclusion reason: ');
      return {
        verified: false,
        included: false,
        reviewer: reviewer,
        verificationDate: new Date().toISOString(),
        exclusionReason: reason
      };
    }

    // Check if institutional relationships can be extracted
    const hasInstitutions = await question('Can institutional relationships be extracted? (y/n): ');
    if (hasInstitutions.toLowerCase() !== 'y') {
      return {
        verified: false,
        included: false,
        reviewer: reviewer,
        verificationDate: new Date().toISOString(),
        exclusionReason: 'Insufficient documentation for institutional relationships'
      };
    }

    return {
      verified: true,
      included: true,
      reviewer: reviewer,
      verificationDate: new Date().toISOString(),
      exclusionReason: null
    };
  }

  async addVerifiedTrialToDatabase(trial) {
    try {
      const insertTrial = this.db.prepare(`
        INSERT INTO clinical_trials (
          trial_id, registry_source, title, status, start_date, end_date,
          phase, study_design, sample_size, target_condition, technology_type,
          country, trial_url, results_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertTrial.run(
        trial.trial_id,
        trial.registry_source,
        trial.title,
        trial.status,
        trial.start_date,
        trial.end_date,
        trial.phase,
        trial.study_design,
        trial.sample_size,
        trial.target_condition,
        trial.technology_type,
        trial.country,
        trial.trial_url,
        trial.results_published ? 1 : 0
      );

      console.log(`  ✓ Added verified trial to database: ${trial.trial_id}`);
      return true;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        console.log(`  ℹ️ Trial already in database: ${trial.trial_id}`);
        return false;
      }
      console.error(`  ✗ Error adding trial: ${error.message}`);
      return false;
    }
  }

  saveVerificationResults(pending, verified) {
    // Update pending file (remove verified trials)
    const stillPending = pending.filter(t => !t.verified);
    fs.writeFileSync(PENDING_VERIFICATION_FILE, JSON.stringify(stillPending, null, 2));

    // Save verified trials
    let verifiedList = [];
    if (fs.existsSync(VERIFIED_TRIALS_FILE)) {
      try {
        verifiedList = JSON.parse(fs.readFileSync(VERIFIED_TRIALS_FILE, 'utf8'));
      } catch (e) {
        verifiedList = [];
      }
    }
    verifiedList.push(...verified);
    fs.writeFileSync(VERIFIED_TRIALS_FILE, JSON.stringify(verifiedList, null, 2));
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
    rl.close();
  }
}

async function main() {
  const verifier = new TrialVerifier();
  const pendingTrials = verifier.loadPendingTrials();

  if (pendingTrials.length === 0) {
    console.log('No pending trials for verification.');
    verifier.cleanup();
    return;
  }

  console.log(`\nFound ${pendingTrials.length} pending trial(s) for verification`);
  console.log('Per protocol: Two independent reviewers should verify each trial\n');

  const reviewer = await question('Reviewer name (e.g., JF, MT): ');
  
  const verifiedTrials = [];
  const updatedPending = [];

  for (const trial of pendingTrials) {
    const result = await verifier.verifyTrial(trial, reviewer);
    
    const updatedTrial = {
      ...trial,
      ...result
    };

    if (result.verified && result.included) {
      // Add to database
      await verifier.addVerifiedTrialToDatabase(trial);
      verifiedTrials.push(updatedTrial);
    } else {
      updatedPending.push(updatedTrial);
    }

    const continueReview = await question('\nContinue to next trial? (y/n): ');
    if (continueReview.toLowerCase() !== 'y') {
      break;
    }
  }

  // Save results
  verifier.saveVerificationResults(updatedPending, verifiedTrials);

  console.log(`\n✓ Verification complete:`);
  console.log(`  - Verified and included: ${verifiedTrials.length}`);
  console.log(`  - Excluded: ${updatedPending.filter(t => t.verified && !t.included).length}`);
  console.log(`  - Still pending: ${updatedPending.filter(t => !t.verified).length}`);

  if (verifiedTrials.length > 0) {
    console.log('\nNext steps:');
    console.log('1. Run: npm run data:update (to update JSON data)');
    console.log('2. Second reviewer should verify the same trials');
    console.log('3. Resolve any discrepancies between reviewers');
  }

  verifier.cleanup();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = TrialVerifier;

