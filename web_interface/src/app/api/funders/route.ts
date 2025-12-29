import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'network.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    const fundingSources = db.prepare(`
      SELECT 
        funding_id,
        name,
        type,
        headquarters_country,
        funding_focus,
        website,
        active_in_africa_since,
        primary_funding_mechanism
      FROM funding_sources
      ORDER BY name
    `).all();

    db.close();

    return NextResponse.json({
      data: fundingSources,
      count: fundingSources.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding sources data' },
      { status: 500 }
    );
  }
}
