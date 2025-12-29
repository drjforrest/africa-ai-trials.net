#!/usr/bin/env node
/**
 * Registry Monitor - Automatically discovers new clinical trials from registries
 * This is the missing piece for true automation - it fetches from external registries
 * rather than just monitoring local database changes
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const axios = require('axios');

const DB_PATH = path.join(__dirname, '../data/network.db');
const LAST_CHECK_FILE = path.join(__dirname, '../data/.registry-last-check');
const CONFIG_FILE = path.join(__dirname, '../config/registry-config.json');

// African countries for location filtering
const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
  'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo',
  'Democratic Republic of the Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea',
  'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau',
  'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar',
  'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique',
  'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe',
  'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
  'South Sudan', 'Sudan', 'Swaziland', 'Tanzania', 'Togo', 'Tunisia',
  'Uganda', 'Zambia', 'Zimbabwe'
];

// Keywords for AI/digital health trials
const AI_KEYWORDS = [
  'artificial intelligence', 'AI', 'machine learning', 'deep learning',
  'computer vision', 'neural network', 'algorithm', 'digital health',
  'mHealth', 'mobile health', 'telemedicine', 'telehealth', 'digital',
  'computer-aided', 'automated diagnosis', 'diagnostic algorithm',
  'clinical decision support', 'predictive model', 'digital biomarker'
];

class RegistryMonitor {
  constructor() {
    this.db = new Database(DB_PATH);
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      checkIntervalHours: 24,
      registries: {
        clinicalTrials: {
          enabled: true,
          baseUrl: 'https://clinicaltrials.gov/api/v2/studies',
          rateLimit: 100, // requests per hour
          filters: {
            african_countries: true,
            ai_keywords: true,
            min_start_date: '2020-01-01'
          }
        },
        pactr: {
          enabled: false, // Will implement later
          baseUrl: 'https://pactr.samrc.ac.za'
        }
      }
    };

    if (fs.existsSync(CONFIG_FILE)) {
      try {
        return { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
      } catch (e) {
        console.warn('Error reading config, using defaults:', e.message);
        return defaultConfig;
      }
    }

    // Create default config file
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  async checkRegistries() {
    console.log(`[${new Date().toISOString()}] Starting registry check...`);
    
    const lastCheck = this.getLastCheckTime();
    let newTrials = [];

    // Check ClinicalTrials.gov
    if (this.config.registries.clinicalTrials.enabled) {
      const ctGovTrials = await this.checkClinicalTrialsGov(lastCheck);
      newTrials = newTrials.concat(ctGovTrials);
    }

    console.log(`[${new Date().toISOString()}] Found ${newTrials.length} new trials from registries`);

    // Process and add new trials to database
    const addedTrials = [];
    for (const trial of newTrials) {
      if (await this.addTrialToDatabase(trial)) {
        addedTrials.push(trial);
      }
    }

    console.log(`[${new Date().toISOString()}] Added ${addedTrials.length} new trials to database`);

    // Update last check time
    this.updateLastCheckTime();

    return {
      newTrialsFound: newTrials.length,
      newTrialsAdded: addedTrials.length,
      trials: addedTrials
    };
  }

  async checkClinicalTrialsGov(lastCheck) {
    console.log(`[${new Date().toISOString()}] Checking ClinicalTrials.gov...`);
    
    const newTrials = [];
    const baseUrl = this.config.registries.clinicalTrials.baseUrl;
    
    try {
      // Search for trials in African countries with AI-related terms  
      for (const country of ['Kenya', 'Nigeria', 'South Africa'].slice(0, 2)) { // Test with just 2 countries first
        console.log(`  Checking trials in ${country}...`);
        
        const searchParams = {
          'query.loc': country,
          'query.cond': 'artificial intelligence OR machine learning OR AI OR digital health OR telemedicine',
          'pageSize': 20,
          'format': 'json'
        };

        let pageToken = null;
        let pageCount = 0;
        
        do {
          if (pageToken) {
            searchParams.pageToken = pageToken;
          }
          
          const url = `${baseUrl}?${new URLSearchParams(searchParams)}`;
          
          try {
            const response = await axios.get(url, {
              timeout: 30000,
              headers: {
                'User-Agent': 'SATN-Registry-Monitor/1.0 (Academic Research)'
              }
            });

            const data = response.data;
            
            if (data.studies && data.studies.length > 0) {
              // Filter for AI-related trials
              const filteredTrials = data.studies.filter(study => 
                this.isAIRelatedTrial(study)
              );

              // Convert to our format and add to results
              for (const study of filteredTrials) {
                const trial = this.convertClinicalTrialsGovToOurFormat(study);
                if (trial && !await this.trialExistsInDatabase(trial.trial_id)) {
                  newTrials.push(trial);
                  console.log(`    Found new AI/digital health trial: ${trial.trial_id} - ${trial.title}`);
                }
              }
            }

            pageToken = data.nextPageToken;
            pageCount++;
            
            // Rate limiting - wait between requests
            await this.sleep(1000);
            
          } catch (error) {
            console.error(`    Error fetching page for ${country}:`, error.message);
            break;
          }
          
        } while (pageToken && pageCount < 3); // Limit pages per country for now
      }
      
    } catch (error) {
      console.error('Error checking ClinicalTrials.gov:', error.message);
    }

    return newTrials;
  }

  isAIRelatedTrial(study) {
    const textToSearch = [
      study.protocolSection?.identificationModule?.briefTitle || '',
      study.protocolSection?.identificationModule?.officialTitle || '',
      study.protocolSection?.descriptionModule?.briefSummary || '',
      study.protocolSection?.interventionSection?.interventions?.map(i => i.name).join(' ') || ''
    ].join(' ').toLowerCase();

    return AI_KEYWORDS.some(keyword => textToSearch.includes(keyword.toLowerCase()));
  }

  convertClinicalTrialsGovToOurFormat(study) {
    try {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const conditions = protocol.conditionsModule || {};
      const interventions = protocol.interventionSection || {};
      const locations = protocol.locationsModule?.facilities || [];

      // Get primary location (first location)
      const primaryLocation = locations[0] || {};
      const country = primaryLocation.country || '';
      const city = primaryLocation.city || '';

      return {
        trial_id: identification.nctId || '',
        registry_source: 'ClinicalTrials.gov',
        title: identification.briefTitle || identification.officialTitle || '',
        status: status.overallStatus || 'Unknown',
        start_date: status.startDateStruct?.date || null,
        end_date: status.completionDateStruct?.date || null,
        phase: design.phases?.join(', ') || null,
        study_design: design.studyType || null,
        sample_size: status.enrollmentInfo?.count || null,
        target_condition: conditions.conditions?.join(', ') || null,
        technology_type: this.extractTechnologyType(interventions.interventions || []),
        primary_institution_id: null, // Will need to create/map institutions
        lead_investigator: null, // Not easily available in basic search
        country: country,
        urban_rural: city ? 'Urban' : null,
        trial_url: `https://clinicaltrials.gov/study/${identification.nctId}`,
        results_published: false, // Will need to check separately
        publication_url: null,
        funding_source: protocol.sponsorCollaboratorsModule?.leadSponsor?.name || null,
        secondary_institution_ids: null,
        company_partner_ids: null,
        ai_algorithm_type: null,
        data_source_type: null,
        diagnostic_purpose: null,
        clinical_integration_type: null,
        regulatory_approval: null
      };
    } catch (error) {
      console.error('Error converting trial format:', error.message);
      return null;
    }
  }

  extractTechnologyType(interventions) {
    if (!interventions || interventions.length === 0) return null;
    
    const types = interventions.map(i => i.type).filter(Boolean);
    const names = interventions.map(i => i.name).filter(Boolean).join(' ').toLowerCase();
    
    // Try to determine if it's AI-related based on intervention names
    if (AI_KEYWORDS.some(keyword => names.includes(keyword.toLowerCase()))) {
      return 'AI-based diagnostic/therapeutic tool';
    }
    
    return types.join(', ');
  }

  async trialExistsInDatabase(trialId) {
    const existing = this.db.prepare('SELECT trial_id FROM clinical_trials WHERE trial_id = ?').get(trialId);
    return !!existing;
  }

  async addTrialToDatabase(trial) {
    try {
      // Insert trial into database
      const insertTrial = this.db.prepare(`
        INSERT INTO clinical_trials (
          trial_id, registry_source, title, status, start_date, end_date,
          phase, study_design, sample_size, target_condition, technology_type,
          country, urban_rural, trial_url, results_published, funding_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        trial.urban_rural,
        trial.trial_url,
        trial.results_published ? 1 : 0,
        trial.funding_source
      );

      console.log(`  Added trial to database: ${trial.trial_id}`);
      return true;
      
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        console.log(`  Trial already exists: ${trial.trial_id}`);
        return false;
      }
      console.error(`  Error adding trial ${trial.trial_id}:`, error.message);
      return false;
    }
  }

  getLastCheckTime() {
    if (fs.existsSync(LAST_CHECK_FILE)) {
      return fs.readFileSync(LAST_CHECK_FILE, 'utf8').trim();
    }
    // Default to 30 days ago to get recent trials
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo.toISOString().split('T')[0];
  }

  updateLastCheckTime() {
    fs.writeFileSync(LAST_CHECK_FILE, new Date().toISOString());
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new RegistryMonitor();
  
  monitor.checkRegistries()
    .then(results => {
      console.log(`[${new Date().toISOString()}] Registry check completed:`);
      console.log(`  Trials found: ${results.newTrialsFound}`);
      console.log(`  Trials added: ${results.newTrialsAdded}`);
      
      if (results.newTrialsAdded > 0) {
        console.log('  New trials:');
        results.trials.forEach(trial => {
          console.log(`    - ${trial.trial_id}: ${trial.title}`);
        });
      }
      
      monitor.cleanup();
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      monitor.cleanup();
      process.exit(1);
    });
}

module.exports = RegistryMonitor;
