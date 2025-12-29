// src/app/api/network/stats/route.ts
import Database from 'better-sqlite3';
import { NextResponse } from 'next/server';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data/network.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Basic entity counts
    const trialCount = db.prepare('SELECT COUNT(*) as count FROM clinical_trials').get() as { count: number };
    const institutionCount = db.prepare('SELECT COUNT(*) as count FROM institutions').get() as { count: number };
    const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
    
    // Try to get funding sources count (might not exist)
    let fundingSourceCount = { count: 0 };
    try {
      fundingSourceCount = db.prepare('SELECT COUNT(*) as count FROM funding_sources').get() as { count: number };
    } catch (e) {
      console.log('funding_sources table not found, skipping');
    }

    const totalEntities = trialCount.count + institutionCount.count + companyCount.count + fundingSourceCount.count;

    // Count relationships (connections)
    const connectionCount = db.prepare('SELECT COUNT(*) as count FROM relationships').get() as { count: number };

    // Get connection types
    let connectionTypes: Array<{ type: string; count: number }> = [];
    try {
      connectionTypes = db.prepare(`
        SELECT relationship_type as type, COUNT(*) as count 
        FROM relationships 
        GROUP BY relationship_type 
        ORDER BY count DESC
      `).all() as Array<{ type: string; count: number }>;
    } catch (e) {
      console.warn('Error fetching connection types:', e);
    }

    // Calculate average connections
    const avgConnections = totalEntities > 0 ? Math.round((connectionCount.count * 2 / totalEntities) * 10) / 10 : 0;

    // Find most connected entity (simplified)
    let mostConnectedEntity = null;
    try {
      // Get the trial with the most connections as a simple example
      const mostConnectedTrial = db.prepare(`
        SELECT t.trial_id, t.title, COUNT(r.relationship_id) as connection_count
        FROM clinical_trials t
        LEFT JOIN relationships r ON (r.entity1_id = t.trial_id OR r.entity2_id = t.trial_id)
        GROUP BY t.trial_id, t.title
        ORDER BY connection_count DESC
        LIMIT 1
      `).get() as { trial_id: string; title: string; connection_count: number } | undefined;

      if (mostConnectedTrial && mostConnectedTrial.connection_count > 0) {
        mostConnectedEntity = {
          name: mostConnectedTrial.title,
          connections: mostConnectedTrial.connection_count
        };
      }
    } catch (e) {
      console.warn('Error finding most connected entity:', e);
    }

    // Get countries (simplified)
    let countries: string[] = [];
    try {
      // Just get countries from trials and institutions
      const trialCountries = db.prepare(`
        SELECT DISTINCT country FROM clinical_trials 
        WHERE country IS NOT NULL AND country != ''
      `).all() as Array<{ country: string }>;
      
      const instCountries = db.prepare(`
        SELECT DISTINCT country FROM institutions 
        WHERE country IS NOT NULL AND country != ''
      `).all() as Array<{ country: string }>;

      const allCountries = new Set([
        ...trialCountries.map(c => c.country),
        ...instCountries.map(c => c.country)
      ]);
      
      countries = Array.from(allCountries).sort();
    } catch (e) {
      console.warn('Error fetching countries:', e);
      countries = [];
    }

    // Count Sub-Saharan African countries
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

    const subSaharanCount = countries.filter(country => 
      subSaharanCountries.includes(country)
    ).length;

    // Get trial status counts
    let activeTrials = 0;
    let completedTrials = 0;
    try {
      const statusCounts = db.prepare(`
        SELECT 
          SUM(CASE WHEN status IN ('Recruiting', 'Active', 'Ongoing') THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
        FROM clinical_trials
      `).get() as { active: number; completed: number };
      
      activeTrials = statusCounts.active || 0;
      completedTrials = statusCounts.completed || 0;
    } catch (e) {
      console.warn('Error fetching trial status counts:', e);
    }

    const stats = {
      totalEntities,
      totalConnections: connectionCount.count,
      subSaharanCountries: subSaharanCount,
      avgConnections,
      mostConnectedEntity,
      entityBreakdown: {
        trials: trialCount.count,
        institutions: institutionCount.count,
        companies: companyCount.count,
        fundingSources: fundingSourceCount.count
      },
      connectionTypes,
      activeTrials,
      completedTrials,
      countries
    };

    db.close();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching network stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch network statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}