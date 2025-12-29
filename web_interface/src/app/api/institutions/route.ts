import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'network.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    const institutions = db.prepare(`
      SELECT 
        institution_id,
        name,
        type,
        country,
        city,
        founding_year,
        size_category,
        specialization,
        website,
        is_academic,
        is_healthcare,
        is_research,
        international_partnerships,
        govt_affiliation
      FROM institutions
      ORDER BY name
    `).all();

    db.close();

    return NextResponse.json({
      data: institutions,
      count: institutions.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions data' },
      { status: 500 }
    );
  }
}
