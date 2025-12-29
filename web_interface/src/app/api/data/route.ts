import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'network.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Fetch all entities
    const institutions = db.prepare(`
      SELECT 
        institution_id as originalId,
        name as title,
        'institution' as type,
        country,
        city,
        founding_year as foundingYear,
        size_category as size,
        specialization,
        type as category
      FROM institutions
    `).all();

    const companies = db.prepare(`
      SELECT 
        company_id as originalId,
        name as title,
        'company' as type,
        headquarters_country as country,
        headquarters_city as city,
        founding_year as foundingYear,
        company_type as category,
        primary_focus as focus,
        primary_technology as technology
      FROM companies
    `).all();

    const clinicalTrials = db.prepare(`
      SELECT 
        trial_id as originalId,
        title,
        'clinical_trial' as type,
        country,
        start_date,
        end_date,
        phase as category,
        status,
        target_condition as condition,
        technology_type as technology,
        sample_size as sampleSize
      FROM clinical_trials
    `).all();

    const fundingSources = db.prepare(`
      SELECT 
        funding_id as originalId,
        name as title,
        'funder' as type,
        headquarters_country as country,
        type as category,
        funding_focus as focus,
        active_in_africa_since as year
      FROM funding_sources
    `).all();

    // Create nodes
    const nodes = [
      ...institutions.map((item: any, index) => ({
        id: `I${index + 1}`,
        originalId: item.originalId,
        title: item.title,
        type: item.type,
        country: item.country,
        city: item.city,
        year: item.foundingYear,
        foundingYear: item.foundingYear,
        category: item.category,
        specialization: item.specialization,
        size: item.size || 'Unknown'
      })),
      ...companies.map((item: any, index) => ({
        id: `C${index + 1}`,
        originalId: item.originalId,
        title: item.title,
        type: item.type,
        country: item.country,
        city: item.city,
        year: item.foundingYear,
        foundingYear: item.foundingYear,
        category: item.category,
        focus: item.focus,
        technology: item.technology
      })),
      ...clinicalTrials.map((item: any, index) => ({
        id: `T${index + 1}`,
        originalId: item.originalId,
        title: item.title,
        type: item.type,
        country: item.country,
        year: item.start_date ? new Date(item.start_date).getFullYear() : null,
        category: item.category,
        status: item.status,
        condition: item.condition,
        technology: item.technology,
        sampleSize: item.sampleSize
      })),
      ...fundingSources.map((item: any, index) => ({
        id: `F${index + 1}`,
        originalId: item.originalId,
        title: item.title,
        type: item.type,
        country: item.country,
        category: item.category,
        focus: item.focus,
        year: item.year
      }))
    ];

    // Create ID mapping for relationships
    const idMap = new Map();
    nodes.forEach(node => {
      idMap.set(node.originalId, node.id);
    });

    // Fetch relationships
    const relationships = db.prepare(`
      SELECT 
        entity1_id,
        entity2_id,
        relationship_type,
        strength,
        funding_amount_usd,
        funding_type,
        start_date,
        end_date,
        technology_transfer,
        has_personnel_exchange
      FROM relationships
    `).all();

    // Convert relationships to links
    const links = relationships.map((rel: any) => {
      const sourceId = idMap.get(rel.entity1_id);
      const targetId = idMap.get(rel.entity2_id);
      
      if (!sourceId || !targetId) {
        return null;
      }

      return {
        source: sourceId,
        target: targetId,
        type: rel.relationship_type,
        strength: rel.strength,
        fundingAmount: rel.funding_amount_usd,
        fundingType: rel.funding_type,
        startDate: rel.start_date,
        endDate: rel.end_date,
        hasTechTransfer: Boolean(rel.technology_transfer),
        hasPersonnelExchange: Boolean(rel.has_personnel_exchange)
      };
    }).filter(link => link !== null);

    db.close();

    return NextResponse.json({
      nodes,
      links,
      metadata: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        institutions: institutions.length,
        companies: companies.length,
        clinicalTrials: clinicalTrials.length,
        fundingSources: fundingSources.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from database' },
      { status: 500 }
    );
  }
}
