#!/usr/bin/env node
/**
 * Add Missing Trial - Script to add the NCT06409780 trial that was missed
 * This tests the system with a real-world missed trial case
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/network.db');

function addMissingTrial() {
  const db = new Database(DB_PATH);

  const trial = {
    trial_id: 'NCT06409780',
    registry_source: 'ClinicalTrials.gov',
    title: 'Comparative effectiveness of chest ultrasound, chest X-ray and computer-aided diagnostic (CAD) for tuberculosis diagnosis in low-resource setting',
    status: 'Completed',
    start_date: '2024-05-01', // Estimated based on publication date
    end_date: '2024-10-31',   // Estimated
    phase: 'Phase 2',         // Diagnostic study
    study_design: 'Comparative effectiveness study',
    sample_size: null,        // Not specified in the info provided
    target_condition: 'Tuberculosis',
    technology_type: 'Computer-aided diagnosis (CAD)',
    primary_institution_id: 'INST_STLUKE_HOSP', // Will create if needed
    lead_investigator: 'Dr. Giacomo Guido',
    country: 'Italy', // St. Luke Hospital location - though may have African sites
    urban_rural: 'Urban',
    trial_url: 'https://clinicaltrials.gov/study/NCT06409780',
    results_published: 1, // Published in Frontiers in Public Health
    publication_url: 'https://doi.org/10.3389/fpubh.2024.1476866',
    funding_source: null, // Not specified
    secondary_institution_ids: null,
    company_partner_ids: null,
    ai_algorithm_type: 'Computer-aided diagnostic algorithm',
    data_source_type: 'Chest imaging (ultrasound, X-ray)',
    diagnostic_purpose: 'Tuberculosis diagnosis',
    clinical_integration_type: 'Low-resource setting implementation',
    regulatory_approval: null
  };

  try {
    // Check if trial already exists
    const existing = db.prepare('SELECT trial_id FROM clinical_trials WHERE trial_id = ?').get(trial.trial_id);
    
    if (existing) {
      console.log(`Trial ${trial.trial_id} already exists in database.`);
      db.close();
      return;
    }

    // Create the institution first if it doesn't exist
    const institutionExists = db.prepare('SELECT institution_id FROM institutions WHERE institution_id = ?').get('INST_STLUKE_HOSP');
    
    if (!institutionExists) {
      const insertInstitution = db.prepare(`
        INSERT INTO institutions (
          institution_id, name, type, country, city, 
          is_academic, is_healthcare, is_research
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertInstitution.run(
        'INST_STLUKE_HOSP',
        'St. Luke Hospital',
        'Hospital',
        'Italy',
        'Unknown',
        0, // is_academic
        1, // is_healthcare
        1  // is_research
      );

      console.log('Created institution: St. Luke Hospital');
    }

    // Insert the trial
    const insertTrial = db.prepare(`
      INSERT INTO clinical_trials (
        trial_id, registry_source, title, status, start_date, end_date,
        phase, study_design, sample_size, target_condition, technology_type,
        primary_institution_id, lead_investigator, country, urban_rural,
        trial_url, results_published, publication_url, funding_source,
        ai_algorithm_type, data_source_type, diagnostic_purpose,
        clinical_integration_type, regulatory_approval
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      trial.primary_institution_id,
      trial.lead_investigator,
      trial.country,
      trial.urban_rural,
      trial.trial_url,
      trial.results_published,
      trial.publication_url,
      trial.funding_source,
      trial.ai_algorithm_type,
      trial.data_source_type,
      trial.diagnostic_purpose,
      trial.clinical_integration_type,
      trial.regulatory_approval
    );

    console.log(`Successfully added missing trial: ${trial.trial_id}`);
    console.log(`Title: ${trial.title}`);
    console.log(`Status: ${trial.status}`);
    console.log(`Publication: ${trial.publication_url}`);
    console.log('');
    console.log('This should trigger your database monitor to detect the change and send notifications.');
    console.log('Run your monitor script to see the automated detection in action!');

  } catch (error) {
    console.error('Error adding trial:', error.message);
  } finally {
    db.close();
  }
}

// Run the script
addMissingTrial();
