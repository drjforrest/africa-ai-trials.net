#!/usr/bin/env node

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// NOTE: This is a deprecated test file. Old synthetic data has been moved to archive/old_synthetic_data
const DB_PATH = path.join(__dirname, '../data/network.db');
const CSV_DIR = path.join(__dirname, '../../archive/old_synthetic_data/');

function checkDatabase() {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    
    console.log('=== DATABASE RELATIONSHIPS CHECK ===\n');
    
    // Check relationships table
    const relationshipCount = db.prepare('SELECT COUNT(*) as count FROM relationships').get();
    console.log(`Relationships in database: ${relationshipCount.count}`);
    
    // Check if there are any relationships
    if (relationshipCount.count > 0) {
      console.log('\n=== SAMPLE RELATIONSHIPS ===');
      const sampleRelationships = db.prepare('SELECT * FROM relationships LIMIT 5').all();
      sampleRelationships.forEach((rel, idx) => {
        console.log(`${idx + 1}. ${rel.entity1_type}(${rel.entity1_id}) -> ${rel.entity2_type}(${rel.entity2_id})`);
        console.log(`   Type: ${rel.relationship_type}, Start: ${rel.start_date}`);
        if (rel.funding_amount_usd) console.log(`   Funding: $${rel.funding_amount_usd}`);
        console.log('');
      });
    } else {
      console.log(`No relationships found in database!`);
    }
    
    // Check what entities we do have
    console.log('\n=== AVAILABLE ENTITIES ===');
    const trialCount = db.prepare('SELECT COUNT(*) as count FROM clinical_trials').get();
    const instCount = db.prepare('SELECT COUNT(*) as count FROM institutions').get();  
    const compCount = db.prepare('SELECT COUNT(*) as count FROM companies').get();
    
    console.log(`Trials: ${trialCount.count}`);
    console.log(`Institutions: ${instCount.count}`);
    console.log(`Companies: ${compCount.count}`);
    
    // Show sample entities
    if (trialCount.count > 0) {
      console.log('\n=== SAMPLE TRIALS ===');
      const trials = db.prepare('SELECT trial_id, title, primary_institution_id FROM clinical_trials LIMIT 3').all();
      trials.forEach(trial => {
        console.log(`- ${trial.trial_id}: ${trial.title}`);
        console.log(`  Primary institution: ${trial.primary_institution_id}`);
      });
    }
    
    if (instCount.count > 0) {
      console.log('\n=== SAMPLE INSTITUTIONS ===');
      const institutions = db.prepare('SELECT institution_id, name, country FROM institutions LIMIT 3').all();
      institutions.forEach(inst => {
        console.log(`- ${inst.institution_id}: ${inst.name} (${inst.country})`);
      });
    }
    
    db.close();
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

function checkCSVFiles() {
  console.log('\n=== CSV FILES CHECK ===\n');
  
  const csvFiles = ['relationships.csv', 'clinical_trials.csv', 'institutions.csv', 'companies.csv'];
  
  csvFiles.forEach(filename => {
    const filepath = path.join(CSV_DIR, filename);
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf8');
      const lines = content.trim().split('\n');
      console.log(`${filename}: ${lines.length - 1} data rows`);
      
      if (filename === 'relationships.csv' && lines.length > 1) {
        console.log('   Header:', lines[0]);
        console.log('   Sample:', lines[1]);
      }
    } else {
      console.log(`${filename}: NOT FOUND`);
    }
  });
}

function analyzeRelationshipGaps() {
  console.log('\n=== RELATIONSHIP ANALYSIS ===\n');
  
  try {
    const db = new Database(DB_PATH, { readonly: true });
    
    const trialsWithInstitutions = db.prepare(`
      SELECT trial_id, title, primary_institution_id, secondary_institution_ids, company_partner_ids
      FROM clinical_trials 
      WHERE primary_institution_id IS NOT NULL 
      LIMIT 5
    `).all();
    
    console.log('Trials with institution references:');
    trialsWithInstitutions.forEach(trial => {
      console.log(`- ${trial.trial_id}: Primary inst = ${trial.primary_institution_id}`);
      if (trial.secondary_institution_ids) {
        console.log(`  Secondary insts = ${trial.secondary_institution_ids}`);
      }
      if (trial.company_partner_ids) {
        console.log(`  Company partners = ${trial.company_partner_ids}`);
      }
      
      // Check if relationships exist for this trial
      const relCount = db.prepare(`
        SELECT COUNT(*) as count FROM relationships 
        WHERE (entity1_type = 'trial' AND entity1_id = ?) 
           OR (entity2_type = 'trial' AND entity2_id = ?)
      `).get(trial.trial_id, trial.trial_id);
      
      console.log(`  Relationships in DB: ${relCount.count}`);
      console.log('');
    });
    
    db.close();
    
  } catch (error) {
    console.error('Error analyzing relationships:', error.message);
  }
}

// Run all checks
console.log('🔍 SATN Relationships Diagnostic Tool\n');
checkDatabase();
checkCSVFiles();
analyzeRelationshipGaps();

console.log('\n=== WHAT SHOULD BE IN RELATIONSHIPS TABLE ===');
console.log(`
The relationships table should contain connections like:
1. Trial -> Institution (primary institution running the trial)
2. Trial -> Company (company partners/funders)  
3. Institution -> Institution (collaborations)
4. Institution -> Company (partnerships)
5. Company -> Company (parent-subsidiary relationships)

Each relationship should have:
- entity1_type, entity1_id (source)
- entity2_type, entity2_id (target)  
- relationship_type (collaboration, funding, primary_investigator, etc.)
- start_date, end_date (when relationship was active)
- strength (strong, medium, weak)
- funding_amount_usd (if applicable)
- other metadata

If this table is empty, your network visualization will have nodes but no connections!
`);