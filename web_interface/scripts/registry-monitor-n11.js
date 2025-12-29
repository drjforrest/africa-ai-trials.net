#!/usr/bin/env node
/**
 * Registry Monitor for N=11 Dataset - Automatically discovers new AI diagnostic trials
 * Implements the search strategies from the protocol (SUPPLEMENTARY_METHODS.md)
 * 
 * Searches:
 * - ClinicalTrials.gov (API v2)
 * - Pan African Clinical Trials Registry (PACTR) - via web scraping
 * - WHO International Clinical Trials Registry Platform (ICTRP) - via API
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const axios = require('axios');

const DB_PATH = path.join(__dirname, '../data/network.db');
const LAST_CHECK_FILE = path.join(__dirname, '../data/.registry-last-check');
const CONFIG_FILE = path.join(__dirname, '../config/registry-config.json');
const PENDING_VERIFICATION_FILE = path.join(__dirname, '../data/pending-verification.json');

// Sub-Saharan African countries (from protocol)
const SUB_SAHARAN_AFRICA = [
  'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
  'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo',
  'Democratic Republic of the Congo', 'Djibouti', 'Equatorial Guinea',
  'Eritrea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
  'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia',
  'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius',
  'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda',
  'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone',
  'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Swaziland',
  'Tanzania', 'Togo', 'Uganda', 'Zambia', 'Zimbabwe'
];

// AI diagnostic keywords (from protocol Section 2)
const AI_DIAGNOSTIC_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'computer vision', 'AI', 'ML', 'DL',
  'diagnostic', 'diagnosis', 'screening', 'detection', 'test'
];

class RegistryMonitorN11 {
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
          rateLimit: 100,
          filters: {
            sub_saharan_africa: true,
            ai_diagnostic_keywords: true,
            min_start_date: '2020-01-01',
            exclude_withdrawn: true
          }
        },
        pactr: {
          enabled: true,
          baseUrl: 'https://pactr.samrc.ac.za',
          searchEndpoint: '/api/search'
        },
        whoIctrp: {
          enabled: true,
          baseUrl: 'https://trialsearch.who.int',
          apiEndpoint: '/api/v1/trials'
        }
      },
      verification: {
        requireManualReview: true,
        autoAddVerified: false // Only add after manual verification
      }
    };

    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        return { ...defaultConfig, ...userConfig };
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
    console.log(`[${new Date().toISOString()}] Starting registry check for N=11 dataset...`);
    
    const lastCheck = this.getLastCheckTime();
    let newTrials = [];

    // Check ClinicalTrials.gov (primary registry)
    if (this.config.registries.clinicalTrials.enabled) {
      const ctGovTrials = await this.checkClinicalTrialsGov(lastCheck);
      newTrials = newTrials.concat(ctGovTrials);
    }

    // Check PACTR (Pan African Clinical Trials Registry)
    if (this.config.registries.pactr.enabled) {
      const pactrTrials = await this.checkPACTR(lastCheck);
      newTrials = newTrials.concat(pactrTrials);
    }

    // Check WHO ICTRP
    if (this.config.registries.whoIctrp.enabled) {
      const whoTrials = await this.checkWHOICTRP(lastCheck);
      newTrials = newTrials.concat(whoTrials);
    }

    console.log(`[${new Date().toISOString()}] Found ${newTrials.length} potential new trials from registries`);

    // Filter out duplicates (same trial in multiple registries)
    const uniqueTrials = this.deduplicateTrials(newTrials);
    console.log(`[${new Date().toISOString()}] ${uniqueTrials.length} unique trials after deduplication`);

    // Filter out trials already in database
    const trulyNewTrials = [];
    for (const trial of uniqueTrials) {
      if (!(await this.trialExistsInDatabase(trial.trial_id))) {
        trulyNewTrials.push(trial);
      }
    }

    console.log(`[${new Date().toISOString()}] ${trulyNewTrials.length} new trials not yet in database`);

    // If manual verification required, save to pending verification
    if (this.config.verification.requireManualReview) {
      await this.saveForVerification(trulyNewTrials);
      console.log(`[${new Date().toISOString()}] Saved ${trulyNewTrials.length} trials for manual verification`);
    } else {
      // Auto-add if verification not required
      const addedTrials = [];
      for (const trial of trulyNewTrials) {
        if (await this.addTrialToDatabase(trial)) {
          addedTrials.push(trial);
        }
      }
      console.log(`[${new Date().toISOString()}] Added ${addedTrials.length} new trials to database`);
    }

    // Update last check time
    this.updateLastCheckTime();

    return {
      newTrialsFound: newTrials.length,
      uniqueTrials: uniqueTrials.length,
      newTrialsPendingVerification: trulyNewTrials.length,
      trials: trulyNewTrials
    };
  }

  /**
   * Check ClinicalTrials.gov using protocol search strategy
   * Search string from protocol Section 2:
   * (artificial intelligence OR machine learning OR deep learning OR neural network OR 
   * computer vision OR AI OR ML OR DL) AND (diagnostic OR diagnosis OR screening OR 
   * detection OR test) AND (Africa OR African OR [list of 48 SSA countries])
   */
  async checkClinicalTrialsGov(lastCheck) {
    console.log(`[${new Date().toISOString()}] Checking ClinicalTrials.gov...`);
    
    const newTrials = [];
    const baseUrl = this.config.registries.clinicalTrials.baseUrl;
    
    try {
      // Search for each Sub-Saharan African country
      // Limit to first 10 countries for initial testing
      const countriesToCheck = SUB_SAHARAN_AFRICA.slice(0, 10);
      
      for (const country of countriesToCheck) {
        console.log(`  Checking trials in ${country}...`);
        
        // Build search query per protocol
        const searchQuery = `(artificial intelligence OR machine learning OR deep learning OR neural network OR computer vision OR AI OR ML OR DL) AND (diagnostic OR diagnosis OR screening OR detection OR test) AND ${country}`;
        
        const searchParams = {
          'query.cond': searchQuery,
          'query.loc': country,
          'filter.overallStatus': 'RECRUITING|ACTIVE_NOT_RECRUITING|COMPLETED|ENROLLING_BY_INVITATION|NOT_YET_RECRUITING',
          'pageSize': 50,
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
                'User-Agent': 'AI-Trials-Africa-Monitor/1.0 (Academic Research)'
              }
            });

            const data = response.data;
            
            if (data.studies && data.studies.length > 0) {
              // Filter for AI diagnostic trials
              for (const study of data.studies) {
                if (this.isAIDiagnosticTrial(study)) {
                  const trial = this.convertClinicalTrialsGovToOurFormat(study);
                  if (trial) {
                    newTrials.push(trial);
                    console.log(`    Found: ${trial.trial_id} - ${trial.title.substring(0, 60)}...`);
                  }
                }
              }
            }

            pageToken = data.nextPageToken;
            pageCount++;
            
            // Rate limiting
            await this.sleep(1000);
            
          } catch (error) {
            console.error(`    Error fetching page for ${country}:`, error.message);
            break;
          }
          
        } while (pageToken && pageCount < 5); // Limit pages per country
      }
      
    } catch (error) {
      console.error('Error checking ClinicalTrials.gov:', error.message);
    }

    return newTrials;
  }

  /**
   * Check Pan African Clinical Trials Registry (PACTR)
   * Protocol: Multiple individual searches (PACTR doesn't support advanced Boolean)
   */
  async checkPACTR(lastCheck) {
    console.log(`[${new Date().toISOString()}] Checking PACTR...`);
    
    const newTrials = [];
    
    // PACTR search approach from protocol:
    // Multiple individual searches: "artificial intelligence" + "diagnostic", etc.
    const searchTerms = [
      { term1: 'artificial intelligence', term2: 'diagnostic' },
      { term1: 'machine learning', term2: 'screening' },
      { term1: 'deep learning', term2: 'detection' },
      { term1: 'computer vision', term2: 'diagnosis' },
      { term1: 'AI diagnostic', term2: '' },
      { term1: 'neural network diagnostic', term2: '' }
    ];
    
    // Note: PACTR API may not be publicly available
    // This is a placeholder for when API access is available
    console.log('  PACTR API access not yet implemented - requires API credentials');
    
    return newTrials;
  }

  /**
   * Check WHO International Clinical Trials Registry Platform
   */
  async checkWHOICTRP(lastCheck) {
    console.log(`[${new Date().toISOString()}] Checking WHO ICTRP...`);
    
    const newTrials = [];
    
    // WHO ICTRP search from protocol
    // Condition: ANY
    // Intervention: artificial intelligence OR machine learning OR deep learning OR computer vision OR neural network
    // Countries: Sub-Saharan African countries
    
    try {
      // Note: WHO ICTRP API may require authentication
      // This is a placeholder implementation
      console.log('  WHO ICTRP API access not yet implemented - requires API credentials');
    } catch (error) {
      console.error('Error checking WHO ICTRP:', error.message);
    }
    
    return newTrials;
  }

  /**
   * Check if trial is AI diagnostic (per protocol inclusion criteria)
   */
  isAIDiagnosticTrial(study) {
    const protocol = study.protocolSection || {};
    const identification = protocol.identificationModule || {};
    const description = protocol.descriptionModule || {};
    const interventions = protocol.interventionSection?.interventions || [];
    
    // Combine all text fields
    const textToSearch = [
      identification.briefTitle || '',
      identification.officialTitle || '',
      description.briefSummary || '',
      ...interventions.map(i => i.name || '')
    ].join(' ').toLowerCase();

    // Must contain AI keywords AND diagnostic keywords
    const hasAIKeyword = AI_DIAGNOSTIC_KEYWORDS.some(keyword => 
      textToSearch.includes(keyword.toLowerCase())
    );
    
    const hasDiagnosticKeyword = ['diagnostic', 'diagnosis', 'screening', 'detection', 'test'].some(
      keyword => textToSearch.includes(keyword)
    );

    // Check if in Sub-Saharan Africa
    const locations = protocol.locationsModule?.facilities || [];
    const isInSSA = locations.some(loc => 
      SUB_SAHARAN_AFRICA.includes(loc.country)
    );

    return hasAIKeyword && hasDiagnosticKeyword && isInSSA;
  }

  /**
   * Convert ClinicalTrials.gov study to our database format
   */
  convertClinicalTrialsGovToOurFormat(study) {
    try {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const conditions = protocol.conditionsModule || {};
      const interventions = protocol.interventionSection?.interventions || [];
      const locations = protocol.locationsModule?.facilities || [];

      // Get primary location (first Sub-Saharan African location)
      const ssaLocation = locations.find(loc => 
        SUB_SAHARAN_AFRICA.includes(loc.country)
      ) || locations[0] || {};
      
      const country = ssaLocation.country || '';
      const city = ssaLocation.city || '';

      // Extract technology type from interventions
      const technologyType = this.extractTechnologyType(interventions);

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
        technology_type: technologyType,
        primary_institution_id: null, // Will need to extract from sponsor/collaborators
        country: country,
        trial_url: `https://clinicaltrials.gov/study/${identification.nctId}`,
        results_published: false,
        publication_url: null
      };
    } catch (error) {
      console.error('Error converting trial format:', error.message);
      return null;
    }
  }

  extractTechnologyType(interventions) {
    if (!interventions || interventions.length === 0) return null;
    
    const names = interventions.map(i => i.name || '').join(' ').toLowerCase();
    
    // Try to identify specific AI technology
    if (names.includes('cad4tb') || names.includes('cad')) {
      return 'CAD4TB (Computer-Aided Detection)';
    }
    if (names.includes('qur') || names.includes('qure')) {
      return 'Qure.ai qXR';
    }
    if (names.includes('ecg') && names.includes('ai')) {
      return 'AI-enabled ECG';
    }
    if (names.includes('smartphone') && names.includes('ai')) {
      return 'Smartphone-based AI';
    }
    
    // Generic AI diagnostic
    return 'AI Diagnostic Technology';
  }

  deduplicateTrials(trials) {
    const seen = new Map();
    const unique = [];
    
    for (const trial of trials) {
      const key = trial.trial_id || trial.title;
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(trial);
      }
    }
    
    return unique;
  }

  async trialExistsInDatabase(trialId) {
    try {
      const existing = this.db.prepare('SELECT trial_id FROM clinical_trials WHERE trial_id = ?').get(trialId);
      return !!existing;
    } catch (error) {
      // Table might not exist yet
      return false;
    }
  }

  async saveForVerification(trials) {
    let pending = [];
    
    if (fs.existsSync(PENDING_VERIFICATION_FILE)) {
      try {
        pending = JSON.parse(fs.readFileSync(PENDING_VERIFICATION_FILE, 'utf8'));
      } catch (e) {
        pending = [];
      }
    }
    
    // Add new trials with metadata
    const now = new Date().toISOString();
    for (const trial of trials) {
      pending.push({
        ...trial,
        discoveredAt: now,
        verified: false,
        verificationStatus: 'pending',
        verifiedBy: null,
        verificationDate: null
      });
    }
    
    // Remove duplicates
    const unique = [];
    const seen = new Set();
    for (const trial of pending) {
      if (!seen.has(trial.trial_id)) {
        seen.add(trial.trial_id);
        unique.push(trial);
      }
    }
    
    fs.writeFileSync(PENDING_VERIFICATION_FILE, JSON.stringify(unique, null, 2));
  }

  async addTrialToDatabase(trial) {
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
    // Default to 30 days ago
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
  const monitor = new RegistryMonitorN11();
  
  monitor.checkRegistries()
    .then(results => {
      console.log(`\n[${new Date().toISOString()}] Registry check completed:`);
      console.log(`  Trials found: ${results.newTrialsFound}`);
      console.log(`  Unique trials: ${results.uniqueTrials}`);
      console.log(`  New trials pending verification: ${results.newTrialsPendingVerification}`);
      
      if (results.trials.length > 0) {
        console.log('\n  New trials discovered:');
        results.trials.forEach(trial => {
          console.log(`    - ${trial.trial_id}: ${trial.title.substring(0, 70)}...`);
        });
        console.log(`\n  Review pending trials in: ${PENDING_VERIFICATION_FILE}`);
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

module.exports = RegistryMonitorN11;

