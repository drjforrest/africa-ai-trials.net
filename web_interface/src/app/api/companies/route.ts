import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'network.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    const companies = db.prepare(`
      SELECT 
        company_id,
        name,
        founding_year,
        headquarters_country,
        headquarters_city,
        company_type,
        primary_focus,
        funding_stage,
        website,
        active_in_countries,
        primary_technology,
        parent_company,
        public_private
      FROM companies
      ORDER BY name
    `).all();

    db.close();

    return NextResponse.json({
      data: companies,
      count: companies.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies data' },
      { status: 500 }
    );
  }
}
