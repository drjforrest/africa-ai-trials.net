import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'network.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    const clinicalTrials = db.prepare(`
      SELECT 
        trial_id,
        title,
        status,
        start_date,
        end_date,
        phase,
        study_design,
        sample_size,
        target_condition,
        technology_type,
        primary_institution_id,
        lead_investigator,
        country,
        urban_rural,
        trial_url,
        results_published,
        publication_url,
        funding_source,
        secondary_institution_ids,
        company_partner_ids,
        ai_algorithm_type,
        data_source_type,
        diagnostic_purpose,
        clinical_integration_type,
        regulatory_approval
      FROM clinical_trials
      ORDER BY start_date DESC
    `).all();

    db.close();

    return NextResponse.json({
      data: clinicalTrials,
      count: clinicalTrials.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinical trials data' },
      { status: 500 }
    );
  }
}
