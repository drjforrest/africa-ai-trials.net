const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/network.db');

function calculateNetworkMetrics() {
  const db = new Database(DB_PATH, { readonly: true });
  
  console.log('=== NETWORK METRICS ANALYSIS ===\n');
  
  // Basic counts
  const trialCount = db.prepare('SELECT COUNT(*) as count FROM clinical_trials').get().count;
  const institutionCount = db.prepare('SELECT COUNT(*) as count FROM institutions').get().count;
  const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  const relationshipCount = db.prepare('SELECT COUNT(*) as count FROM relationships').get().count;
  
  console.log(`📊 Basic Network Structure:`);
  console.log(`• Clinical trials: ${trialCount}`);
  console.log(`• Institutions: ${institutionCount}`);
  console.log(`• Companies: ${companyCount}`);
  console.log(`• Total relationships: ${relationshipCount}`);
  console.log(`• Total entities in network: ${trialCount + institutionCount + companyCount}\n`);
  
  // Technology Types Analysis
  console.log(`🔬 Technology Types:`);
  const techTypes = db.prepare(`
    SELECT technology_type, ai_algorithm_type, COUNT(*) as count 
    FROM clinical_trials 
    WHERE technology_type IS NOT NULL 
    GROUP BY technology_type, ai_algorithm_type
    ORDER BY count DESC
  `).all();
  
  let deepLearningCount = 0;
  let computerVisionCount = 0;
  let llmCount = 0;
  
  techTypes.forEach(tech => {
    console.log(`• ${tech.technology_type} (${tech.ai_algorithm_type}): ${tech.count} trials`);
    if (tech.ai_algorithm_type && tech.ai_algorithm_type.toLowerCase().includes('deep learning')) {
      deepLearningCount += tech.count;
    }
    if (tech.ai_algorithm_type && tech.ai_algorithm_type.toLowerCase().includes('computer vision')) {
      computerVisionCount += tech.count;
    }
    if (tech.ai_algorithm_type && tech.ai_algorithm_type.toLowerCase().includes('language')) {
      llmCount += tech.count;
    }
  });
  
  console.log(`\nTechnology Distribution:`);
  console.log(`• Deep learning: ${deepLearningCount}/${trialCount} trials (${Math.round(deepLearningCount/trialCount*100)}%)`);
  console.log(`• Computer vision: ${computerVisionCount}/${trialCount} trials (${Math.round(computerVisionCount/trialCount*100)}%)`);
  console.log(`• LLMs: ${llmCount}/${trialCount} trials (${Math.round(llmCount/trialCount*100)}%)\n`);
  
  // Clinical Areas
  console.log(`🏥 Clinical Areas:`);
  const conditions = db.prepare(`
    SELECT target_condition, COUNT(*) as count 
    FROM clinical_trials 
    WHERE target_condition IS NOT NULL 
    GROUP BY target_condition 
    ORDER BY count DESC
  `).all();
  
  let diagnosticImagingCount = 0;
  let primaryCareCount = 0;
  let specializedCount = 0;
  
  conditions.forEach(condition => {
    console.log(`• ${condition.target_condition}: ${condition.count} trials`);
    const conditionLower = condition.target_condition.toLowerCase();
    if (conditionLower.includes('retinopathy') || conditionLower.includes('cardiomyopathy') || 
        conditionLower.includes('tuberculosis') || conditionLower.includes('glaucoma')) {
      diagnosticImagingCount += condition.count;
    } else if (conditionLower.includes('primary care') || conditionLower.includes('decision support')) {
      primaryCareCount += condition.count;
    } else {
      specializedCount += condition.count;
    }
  });
  
  console.log(`\nClinical Area Distribution:`);
  console.log(`• Diagnostic imaging: ${Math.round(diagnosticImagingCount/trialCount*100)}%`);
  console.log(`• Primary care decision support: ${Math.round(primaryCareCount/trialCount*100)}%`);
  console.log(`• Specialized diagnostics: ${Math.round(specializedCount/trialCount*100)}%\n`);
  
  // Geographic Distribution
  console.log(`🌍 Geographic Distribution:`);
  const countries = db.prepare(`
    SELECT country, COUNT(*) as count 
    FROM clinical_trials 
    WHERE country IS NOT NULL 
    GROUP BY country 
    ORDER BY count DESC
  `).all();
  
  countries.forEach(country => {
    console.log(`• ${country.country}: ${country.count} trials`);
  });
  
  const multiCountryCount = countries.filter(c => c.country.includes(',')).reduce((sum, c) => sum + c.count, 0);
  console.log(`\nMulti-country trials: ${multiCountryCount}/${trialCount} (${Math.round(multiCountryCount/trialCount*100)}%)\n`);
  
  // Urban/Rural Distribution
  const urbanRural = db.prepare(`
    SELECT urban_rural, COUNT(*) as count 
    FROM clinical_trials 
    WHERE urban_rural IS NOT NULL 
    GROUP BY urban_rural
  `).all();
  
  console.log(`Urban/Rural Implementation:`);
  urbanRural.forEach(ur => {
    console.log(`• ${ur.urban_rural}: ${ur.count} trials (${Math.round(ur.count/trialCount*100)}%)`);
  });
  console.log();
  
  // Funding Analysis
  console.log(`💰 Funding Mechanisms:`);
  const funding = db.prepare(`
    SELECT fr.funding_type, fs.type as funder_type, COUNT(*) as count, 
           AVG(fr.amount_usd) as avg_amount, SUM(fr.amount_usd) as total_amount
    FROM funding_relationships fr
    JOIN funding_sources fs ON fr.funder_id = fs.funding_id
    WHERE fr.recipient_type = 'trial'
    GROUP BY fr.funding_type, fs.type
    ORDER BY count DESC
  `).all();
  
  let foundationCount = 0;
  let govtCount = 0;
  let mixedCount = 0;
  let totalFunding = 0;
  
  funding.forEach(fund => {
    console.log(`• ${fund.funder_type} (${fund.funding_type}): ${fund.count} relationships, avg $${Math.round(fund.avg_amount).toLocaleString()}`);
    totalFunding += fund.total_amount;
    
    if (fund.funder_type.toLowerCase().includes('foundation')) {
      foundationCount += fund.count;
    } else if (fund.funder_type.toLowerCase().includes('government')) {
      govtCount += fund.count;
    } else {
      mixedCount += fund.count;
    }
  });
  
  const avgFundingPerTrial = totalFunding / trialCount;
  console.log(`\nFunding Distribution:`);
  console.log(`• Foundation-led: ${Math.round(foundationCount/(foundationCount+govtCount+mixedCount)*100)}%`);
  console.log(`• Government agency: ${Math.round(govtCount/(foundationCount+govtCount+mixedCount)*100)}%`);
  console.log(`• Mixed sources: ${Math.round(mixedCount/(foundationCount+govtCount+mixedCount)*100)}%`);
  console.log(`• Average funding per trial: $${Math.round(avgFundingPerTrial/1000000*10)/10}M\n`);
  
  // Research Output
  console.log(`📚 Research Output:`);
  const publications = db.prepare(`
    SELECT COUNT(*) as total_pubs, 
           AVG(citation_count) as avg_citations,
           COUNT(CASE WHEN affiliated_trial_id IS NOT NULL THEN 1 END) as trial_pubs
    FROM publications
  `).get();
  
  const pubsPerTrial = publications.trial_pubs / trialCount;
  console.log(`• Total publications: ${publications.total_pubs}`);
  console.log(`• Publications per trial: ${Math.round(pubsPerTrial*10)/10}`);
  console.log(`• Average citations: ${Math.round(publications.avg_citations)}`);
  
  const highImpactPubs = db.prepare(`
    SELECT COUNT(DISTINCT affiliated_trial_id) as trials_with_pubs
    FROM publications 
    WHERE affiliated_trial_id IS NOT NULL AND citation_count > 20
  `).get();
  
  console.log(`• Trials with high-impact publications: ${highImpactPubs.trials_with_pubs}/${trialCount} (${Math.round(highImpactPubs.trials_with_pubs/trialCount*100)}%)\n`);
  
  // Network Centrality Analysis
  console.log(`🕸️ Network Centrality Metrics:`);
  
  // Calculate degree centrality for each entity
  const entityConnections = db.prepare(`
    SELECT entity_id, entity_type, COUNT(*) as connections
    FROM (
      SELECT entity1_id as entity_id, entity1_type as entity_type FROM relationships
      UNION ALL
      SELECT entity2_id as entity_id, entity2_type as entity_type FROM relationships
    ) combined
    GROUP BY entity_id, entity_type
    ORDER BY connections DESC
  `).all();
  
  const totalConnections = entityConnections.reduce((sum, e) => sum + e.connections, 0);
  const meanCentrality = totalConnections / entityConnections.length / 2; // Divide by 2 since each connection is counted twice
  
  console.log(`• Mean centrality score: ${Math.round(meanCentrality*10)/10}`);
  
  // Calculate network density
  const totalEntities = entityConnections.length;
  const possibleConnections = (totalEntities * (totalEntities - 1)) / 2;
  const actualConnections = relationshipCount;
  const networkDensity = actualConnections / possibleConnections;
  
  console.log(`• Network density: ${Math.round(networkDensity*100)/100}`);
  
  // Calculate collaboration strength
  const strongRelationships = db.prepare(`
    SELECT COUNT(*) as count FROM relationships WHERE strength = 'Strong'
  `).get().count;
  
  const collaborationStrength = strongRelationships / relationshipCount;
  console.log(`• Collaboration strength (% strong ties): ${Math.round(collaborationStrength*100)/100}\n`);
  
  // Institutions per trial
  const institutionsPerTrial = db.prepare(`
    SELECT AVG(inst_count) as avg_institutions
    FROM (
      SELECT trial_id, COUNT(DISTINCT institution_id) as inst_count
      FROM (
        SELECT r.entity1_id as trial_id, r.entity2_id as institution_id
        FROM relationships r
        WHERE r.entity1_type = 'trial' AND r.entity2_type = 'institution'
        UNION
        SELECT r.entity2_id as trial_id, r.entity1_id as institution_id  
        FROM relationships r
        WHERE r.entity2_type = 'trial' AND r.entity1_type = 'institution'
      ) trial_institutions
      GROUP BY trial_id
    ) counts
  `).get();
  
  console.log(`📈 Additional Metrics:`);
  console.log(`• Average institutions per trial: ${Math.round(institutionsPerTrial.avg_institutions*10)/10}`);
  
  db.close();
}

calculateNetworkMetrics();