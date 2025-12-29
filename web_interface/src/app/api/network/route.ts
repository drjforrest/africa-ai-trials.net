// src/app/api/network/route.ts
import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data/network.db');

interface NetworkNode {
  id: string;
  originalId: string;
  title: string;
  type: string;
  country?: string;
  city?: string;
  year?: number;
  category?: string;
  status?: string;
  condition?: string;
  technology?: string;
  sampleSize?: number;
  specialization?: string;
  focus?: string;
  size?: string;
}

interface NetworkLink {
  source: string;
  target: string;
  type: string;
  strength: string;
  fundingAmount?: number;
  fundingType?: string;
  hasPersonnelExchange?: boolean;
  hasTechTransfer?: boolean;
}

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    
    const nodes: NetworkNode[] = [];
    const links: NetworkLink[] = [];
    const nodeIdMap = new Map<string, string>();
    let nodeIdCounter = 1;

    // Helper function to generate unique node ID
    const getNodeId = (type: string, originalId: string): string => {
      const key = `${type}_${originalId}`;
      if (!nodeIdMap.has(key)) {
        nodeIdMap.set(key, `N${nodeIdCounter++}`);
      }
      return nodeIdMap.get(key)!;
    };

    // Process institutions
    const institutions = db.prepare('SELECT * FROM institutions').all();
    institutions.forEach((institution: any) => {
      const nodeId = getNodeId('institution', institution.institution_id);
      nodes.push({
        id: nodeId,
        originalId: institution.institution_id,
        title: institution.name,
        type: 'institution',
        country: institution.country,
        city: institution.city,
        year: institution.founding_year || 2020,
        category: institution.type,
        specialization: institution.specialization,
        size: institution.size_category
      });
    });

    // Process funding sources (N=11 dataset includes funding)
    try {
      const fundingSources = db.prepare('SELECT * FROM funding_sources').all();
      fundingSources.forEach((funder: any) => {
        const nodeId = getNodeId('funder', funder.funding_id);
        nodes.push({
          id: nodeId,
          originalId: funder.funding_id,
          title: funder.name,
          type: 'funder',
          country: funder.headquarters_country || '',
          year: 2020, // Default year
          category: funder.funder_type || 'Funder',
          focus: 'Funding'
        });
      });
    } catch (error) {
      // Funding sources table might not exist
      console.log('Funding sources table not found (optional)');
    }

    // Process companies (if table exists - N=11 dataset doesn't have companies)
    try {
      const companies = db.prepare('SELECT * FROM companies').all();
      companies.forEach((company: any) => {
        const nodeId = getNodeId('company', company.company_id);
        nodes.push({
          id: nodeId,
          originalId: company.company_id,
          title: company.name,
          type: 'company',
          country: company.headquarters_country,
          city: company.headquarters_city,
          year: company.founding_year || 2020,
          category: company.company_type,
          focus: company.primary_focus,
          technology: company.primary_technology
        });
      });
    } catch (error) {
      // Companies table doesn't exist in N=11 dataset - this is expected
      console.log('Companies table not found (N=11 dataset)');
    }

    // Process clinical trials
    const trials = db.prepare('SELECT * FROM clinical_trials').all();
    trials.forEach((trial: any) => {
      const nodeId = getNodeId('clinical_trial', trial.trial_id);
      const startYear = trial.start_date ? new Date(trial.start_date).getFullYear() : 2020;
      
      nodes.push({
        id: nodeId,
        originalId: trial.trial_id,
        title: trial.title,
        type: 'clinical_trial',
        country: trial.country,
        year: startYear,
        category: trial.phase || 'Not Specified',
        status: trial.status,
        condition: trial.target_condition,
        technology: trial.technology_type,
        sampleSize: trial.sample_size || 0
      });
    });

    // Process funding relationships
    try {
      const fundingRels = db.prepare(`
        SELECT fr.*, fs.name as funder_name
        FROM funding_relationships fr
        JOIN funding_sources fs ON fr.funder_id = fs.funding_id
      `).all();
      
      fundingRels.forEach((rel: any) => {
        const funderId = getNodeId('funder', rel.funder_id);
        const recipientId = getNodeId('clinical_trial', rel.recipient_id);
        
        const funderExists = nodes.some(node => node.id === funderId);
        const recipientExists = nodes.some(node => node.id === recipientId);
        
        if (funderExists && recipientExists) {
          links.push({
            source: funderId,
            target: recipientId,
            type: 'funding',
            strength: 'strong',
            fundingType: rel.funding_type || 'Research Grant',
            fundingAmount: 0,
            hasPersonnelExchange: false,
            hasTechTransfer: false
          });
        }
      });
    } catch (error) {
      // Funding relationships table might not exist
      console.log('Funding relationships table not found (optional)');
    }

    // Process relationships to create links (excluding funding, handled above)
    const relationships = db.prepare('SELECT * FROM relationships WHERE relationship_type != "funding"').all();
    relationships.forEach((rel: any) => {
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
          strength: rel.strength || 'medium',
          fundingAmount: rel.funding_amount_usd || 0,
          fundingType: rel.funding_type,
          hasPersonnelExchange: rel.has_personnel_exchange || false,
          hasTechTransfer: rel.technology_transfer || false
        });
      }
    });

    // Calculate metadata
    const metadata = {
      totalNodes: nodes.length,
      totalLinks: links.length,
      nodeTypes: {
        institutions: nodes.filter(n => n.type === 'institution').length,
        companies: nodes.filter(n => n.type === 'company').length,
        trials: nodes.filter(n => n.type === 'clinical_trial').length,
        funders: nodes.filter(n => n.type === 'funder').length
      },
      fundingSources: nodes.filter(n => n.type === 'funder').length,
      fundingRelationships: links.filter(l => l.type === 'funding').length,
      yearRange: {
        min: Math.min(...nodes.map(n => n.year).filter((y): y is number => y !== undefined && y > 1900)),
        max: Math.max(...nodes.map(n => n.year).filter((y): y is number => y !== undefined && y < 2030))
      },
      countries: [...new Set(nodes.map(n => n.country).filter((c): c is string => !!c))],
      subSaharanCountries: [...new Set(nodes.map(n => n.country).filter((c): c is string => !!c && isSubSaharanAfrica(c)))].length,
      avgConnections: nodes.length > 0 ? (links.length * 2) / nodes.length : 0,
      mostConnectedEntity: getMostConnectedEntity(nodes, links)
    };

    db.close();

    return NextResponse.json({
      nodes,
      links,
      metadata
    });

  } catch (error) {
    console.error('Error fetching network data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network data' },
      { status: 500 }
    );
  }
}

// Helper function to check if country is in Sub-Saharan Africa
function isSubSaharanAfrica(country: string): boolean {
  const subSaharanCountries = [
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
  return subSaharanCountries.includes(country);
}

// Helper function to find most connected entity
function getMostConnectedEntity(nodes: NetworkNode[], links: NetworkLink[]) {
  const connections: { [key: string]: number } = {};
  
  // Count connections for each node
  links.forEach(link => {
    connections[link.source] = (connections[link.source] || 0) + 1;
    connections[link.target] = (connections[link.target] || 0) + 1;
  });
  
  // Find the node with most connections
  let maxConnections = 0;
  let mostConnected = null;
  
  Object.entries(connections).forEach(([nodeId, count]) => {
    if (count > maxConnections) {
      maxConnections = count;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        mostConnected = {
          name: node.title,
          connections: count
        };
      }
    }
  });
  
  return mostConnected;
}