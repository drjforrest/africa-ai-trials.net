// NOTE: This script is deprecated. Use process-sqlite-data-n11.js instead.
// Old synthetic data has been moved to archive/old_synthetic_data
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const INPUT_DIR = path.join(__dirname, '../../archive/old_synthetic_data');
const OUTPUT_FILE = path.join(__dirname, '../src/data/network-data.json');

const processRealData = async () => {
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

  // Process institutions
  const institutions = await readCSV(path.join(INPUT_DIR, 'institutions.csv'));
  institutions.forEach(institution => {
    const nodeId = getNodeId('institution', institution.institution_id);
    nodes.push({
      id: nodeId,
      originalId: institution.institution_id,
      title: institution.name,
      type: 'institution',
      country: institution.country,
      city: institution.city,
      year: parseInt(institution.founding_year) || 2020,
      category: institution.type,
      specialization: institution.specialization,
      size: institution.size_category
    });
  });

  // Process companies
  const companies = await readCSV(path.join(INPUT_DIR, 'companies.csv'));
  companies.forEach(company => {
    const nodeId = getNodeId('company', company.company_id);
    nodes.push({
      id: nodeId,
      originalId: company.company_id,
      title: company.name,
      type: 'company',
      country: company.headquarters_country,
      city: company.headquarters_city,
      year: parseInt(company.founding_year) || 2020,
      category: company.company_type,
      focus: company.primary_focus,
      technology: company.primary_technology
    });
  });

  // Process clinical trials
  const trials = await readCSV(path.join(INPUT_DIR, 'clinical_trials.csv'));
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
      sampleSize: parseInt(trial.sample_size) || 0
    });
  });

  // Process relationships to create links
  const relationships = await readCSV(path.join(INPUT_DIR, 'relationships.csv'));
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
        fundingAmount: parseFloat(rel.funding_amount_usd) || 0,
        fundingType: rel.funding_type,
        hasPersonnelExchange: rel.has_personnel_exchange === 'Yes',
        hasTechTransfer: rel.technology_transfer === 'Yes'
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
        trials: nodes.filter(n => n.type === 'clinical_trial').length
      },
      yearRange: {
        min: Math.min(...nodes.map(n => n.year).filter(y => y > 1900)),
        max: Math.max(...nodes.map(n => n.year).filter(y => y < 2030))
      },
      countries: [...new Set(nodes.map(n => n.country).filter(c => c))]
    }
  };

  // Write to output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(networkData, null, 2));
  console.log(`Successfully processed ${nodes.length} nodes and ${links.length} links`);
  console.log(`Data written to: ${OUTPUT_FILE}`);
};

// Helper function to read CSV files
function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      resolve([]);
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Run the processing
processRealData().catch(console.error);