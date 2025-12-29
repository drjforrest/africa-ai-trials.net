const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/network.db');
const OUTPUT_FILE = path.join(__dirname, '../src/data/network-data.json');

const processNetworkData = () => {
  const db = new Database(DB_PATH, { readonly: true });
  
  const nodes = [];
  const links = [];
  const nodeIdMap = new Map();
  let nodeIdCounter = 1;

  // Helper function to generate unique node ID
  const getNodeId = (type, originalId) => {
    const key = `${type}_${originalId}`;
    if (!nodeIdMap.has(key)) {
      nodeIdMap.set(key, `N${nodeIdCounter++}`);
    }
    return nodeIdMap.get(key);
  };

  // Helper function to get earliest participation date for an entity
  const getEntityParticipationDate = (entityType, entityId) => {
    let minDate = null;
    
    // Check relationships where this entity participates
    const relationshipDates = db.prepare(`
      SELECT start_date 
      FROM relationships 
      WHERE (entity1_type = ? AND entity1_id = ?) 
         OR (entity2_type = ? AND entity2_id = ?)
         AND start_date IS NOT NULL
      ORDER BY start_date ASC
      LIMIT 1
    `).all(entityType, entityId, entityType, entityId);
    
    if (relationshipDates.length > 0) {
      minDate = relationshipDates[0].start_date;
    }
    
    // For clinical trials, also check their start date
    if (entityType === 'trial') {
      const trialDate = db.prepare('SELECT start_date FROM clinical_trials WHERE trial_id = ?').get(entityId);
      if (trialDate && trialDate.start_date) {
        if (!minDate || trialDate.start_date < minDate) {
          minDate = trialDate.start_date;
        }
      }
    }
    
    // For funding relationships
    if (entityType === 'institution' || entityType === 'trial' || entityType === 'company') {
      const fundingDates = db.prepare(`
        SELECT start_date 
        FROM funding_relationships 
        WHERE recipient_id = ? AND start_date IS NOT NULL
        ORDER BY start_date ASC
        LIMIT 1
      `).all(entityId);
      
      if (fundingDates.length > 0) {
        if (!minDate || fundingDates[0].start_date < minDate) {
          minDate = fundingDates[0].start_date;
        }
      }
    }
    
    return minDate ? new Date(minDate).getFullYear() : 2020; // Default fallback
  };

  console.log('Processing institutions...');
  // Process institutions
  const institutions = db.prepare('SELECT * FROM institutions').all();
  institutions.forEach(institution => {
    const nodeId = getNodeId('institution', institution.institution_id);
    const participationYear = getEntityParticipationDate('institution', institution.institution_id);
    
    nodes.push({
      id: nodeId,
      originalId: institution.institution_id,
      title: institution.name,
      type: 'institution',
      country: institution.country,
      city: institution.city,
      year: participationYear, // Use participation year, not founding year
      foundingYear: institution.founding_year, // Keep original for reference
      category: institution.type,
      specialization: institution.specialization,
      size: institution.size_category
    });
  });

  console.log('Processing companies...');
  // Process companies
  const companies = db.prepare('SELECT * FROM companies').all();
  companies.forEach(company => {
    const nodeId = getNodeId('company', company.company_id);
    const participationYear = getEntityParticipationDate('company', company.company_id);
    
    nodes.push({
      id: nodeId,
      originalId: company.company_id,
      title: company.name,
      type: 'company',
      country: company.headquarters_country,
      city: company.headquarters_city,
      year: participationYear, // Use participation year
      foundingYear: company.founding_year, // Keep original for reference
      category: company.company_type,
      focus: company.primary_focus,
      technology: company.primary_technology
    });
  });

  console.log('Processing clinical trials...');
  // Process clinical trials
  const trials = db.prepare('SELECT * FROM clinical_trials').all();
  trials.forEach(trial => {
    const nodeId = getNodeId('trial', trial.trial_id);
    const startYear = trial.start_date ? new Date(trial.start_date).getFullYear() : 2020;
    
    nodes.push({
      id: nodeId,
      originalId: trial.trial_id,
      title: trial.title,
      type: 'clinical_trial',
      country: trial.country,
      year: startYear,
      category: trial.phase,
      status: trial.status,
      condition: trial.target_condition,
      technology: trial.technology_type,
      sampleSize: trial.sample_size || 0,
      startDate: trial.start_date,
      endDate: trial.end_date
    });
  });

  console.log('Processing relationships...');
  // Process relationships to create links
  const relationships = db.prepare('SELECT * FROM relationships').all();
  relationships.forEach(rel => {
    const entity1Id = getNodeId(rel.entity1_type, rel.entity1_id);
    const entity2Id = getNodeId(rel.entity2_type, rel.entity2_id);
    
    // Only create link if both nodes exist
    const entity1Exists = nodes.some(node => node.id === entity1Id);
    const entity2Exists = nodes.some(node => node.id === entity2Id);
    
    if (entity1Exists && entity2Exists) {
      links.push({
        source: entity1Id,
        target: entity2Id,
        type: rel.relationship_type,
        strength: rel.strength,
        fundingAmount: rel.funding_amount_usd || 0,
        fundingType: rel.funding_type,
        hasPersonnelExchange: rel.has_personnel_exchange === 1,
        hasTechTransfer: rel.technology_transfer === 1,
        startDate: rel.start_date,
        endDate: rel.end_date
      });
    }
  });

  console.log('Processing funding relationships...');
  // Add funding relationships as links
  const fundingRels = db.prepare(`
    SELECT fr.*, fs.name as funder_name, fs.type as funder_type
    FROM funding_relationships fr
    JOIN funding_sources fs ON fr.funder_id = fs.funding_id
  `).all();
  
  fundingRels.forEach(rel => {
    // Create funder node if it doesn't exist
    const funderNodeId = getNodeId('funder', rel.funder_id);
    if (!nodes.some(n => n.id === funderNodeId)) {
      const participationYear = rel.start_date ? new Date(rel.start_date).getFullYear() : 2018;
      nodes.push({
        id: funderNodeId,
        originalId: rel.funder_id,
        title: rel.funder_name,
        type: 'funder',
        country: 'Multiple', // Most funders operate internationally
        year: participationYear,
        category: rel.funder_type,
        focus: 'Funding'
      });
    }
    
    const recipientId = getNodeId(rel.recipient_type, rel.recipient_id);
    const recipientExists = nodes.some(node => node.id === recipientId);
    
    if (recipientExists) {
      links.push({
        source: funderNodeId,
        target: recipientId,
        type: 'funding',
        strength: 'Strong',
        fundingAmount: rel.amount_usd || 0,
        fundingType: rel.funding_type,
        hasPersonnelExchange: false,
        hasTechTransfer: false,
        startDate: rel.start_date,
        endDate: rel.end_date
      });
    }
  });

  // Create the final network data structure
  const networkData = {
    nodes: nodes,
    links: links,
    metadata: {
      totalNodes: nodes.length,
      totalLinks: links.length,
      nodeTypes: {
        institutions: nodes.filter(n => n.type === 'institution').length,
        companies: nodes.filter(n => n.type === 'company').length,
        trials: nodes.filter(n => n.type === 'clinical_trial').length,
        funders: nodes.filter(n => n.type === 'funder').length
      },
      yearRange: {
        min: Math.min(...nodes.map(n => n.year).filter(y => y > 1900)),
        max: Math.max(...nodes.map(n => n.year).filter(y => y < 2030))
      },
      countries: [...new Set(nodes.map(n => n.country).filter(c => c))],
      dataSource: 'SQLite database with proper foreign key relationships',
      generatedAt: new Date().toISOString()
    }
  };

  // Write to output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(networkData, null, 2));
  console.log(`Successfully processed ${nodes.length} nodes and ${links.length} links`);
  console.log(`Year range: ${networkData.metadata.yearRange.min} - ${networkData.metadata.yearRange.max}`);
  console.log(`Data written to: ${OUTPUT_FILE}`);
  
  db.close();
};

// Run the processing
try {
  processNetworkData();
} catch (error) {
  console.error('Error processing data:', error);
  process.exit(1);
}