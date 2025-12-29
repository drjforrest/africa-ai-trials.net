#!/usr/bin/env node
/**
 * Generate Figures Script - Updates manuscript figures from database
 * Runs Python analysis and copies figures to public directory for web app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// NOTE: This script is deprecated. Old synthetic data has been moved to archive/old_synthetic_data
const ANALYSIS_DIR = path.join(__dirname, '../../archive/old_synthetic_data');
const PUBLIC_FIGURES_DIR = path.join(__dirname, '../public/figures');

class FigureGenerator {
  constructor() {
    // Ensure public figures directory exists
    if (!fs.existsSync(PUBLIC_FIGURES_DIR)) {
      fs.mkdirSync(PUBLIC_FIGURES_DIR, { recursive: true });
    }
  }

  async generateFigures() {
    console.log(`[${new Date().toISOString()}] Starting figure generation...`);

    try {
      // First, update CSV files from database
      console.log(`[${new Date().toISOString()}] Updating CSV files from database...`);
      await this.updateCSVFiles();

      // Run Python analysis to generate figures
      console.log(`[${new Date().toISOString()}] Running Python analysis...`);
      await this.runPythonAnalysis();

      // Copy figures to public directory
      console.log(`[${new Date().toISOString()}] Copying figures to public directory...`);
      await this.copyFiguresToPublic();

      console.log(`[${new Date().toISOString()}] ✅ Figure generation completed successfully`);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Figure generation failed:`, error.message);
      throw error;
    }
  }

  async updateCSVFiles() {
    const dbPath = path.join(__dirname, '../data/network.db');
    
    const tables = [
      'clinical_trials',
      'institutions', 
      'companies',
      'funding_sources',
      'relationships',
      'funding_relationships',
      'publications',
      'technology_transfers',
      'regulatory_events'
    ];

    // Change to analysis directory
    process.chdir(ANALYSIS_DIR);

    for (const table of tables) {
      const csvFile = `${table}.csv`;
      try {
        // Export each table to CSV
        const command = `sqlite3 "${dbPath}" -header -csv "SELECT * FROM ${table}" > "${csvFile}"`;
        execSync(command, { stdio: 'pipe' });
        
        // Handle empty tables by adding headers
        if (fs.statSync(csvFile).size === 0) {
          if (table === 'technology_transfers') {
            fs.writeFileSync(csvFile, 'transfer_id,source_entity_type,source_entity_id,target_entity_type,target_entity_id,technology_description,transfer_date,commercial_value_usd,licensing_terms,exclusive\n');
          } else if (table === 'regulatory_events') {
            fs.writeFileSync(csvFile, 'event_id,entity_type,entity_id,event_type,event_date,regulatory_body,country,outcome,details\n');
          }
        }
        
        console.log(`[${new Date().toISOString()}] ✅ Updated ${csvFile}`);
      } catch (error) {
        console.warn(`[${new Date().toISOString()}] ⚠️ Warning updating ${csvFile}:`, error.message);
      }
    }
  }

  async runPythonAnalysis() {
    try {
      // Run the Python analysis script
      execSync('python updated_analysis.py', { 
        cwd: ANALYSIS_DIR,
        stdio: 'inherit' // Show Python output
      });
    } catch (error) {
      throw new Error(`Python analysis failed: ${error.message}`);
    }
  }

  async copyFiguresToPublic() {
    const figureFiles = [
      'figure1_main_network.png',
      'figure2_kenya_network.png',
      'figure3_tech_specialization.png', 
      'figure4_temporal_evolution.png',
      'funding_by_source.png',
      'disease_focus_areas.png'
    ];

    for (const filename of figureFiles) {
      const sourcePath = path.join(ANALYSIS_DIR, filename);
      const destPath = path.join(PUBLIC_FIGURES_DIR, filename);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`[${new Date().toISOString()}] ✅ Copied ${filename}`);
      } else {
        console.warn(`[${new Date().toISOString()}] ⚠️ Figure not found: ${filename}`);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const generator = new FigureGenerator();
  
  generator.generateFigures().catch(error => {
    console.error('Figure generation failed:', error);
    process.exit(1);
  });
}

module.exports = FigureGenerator;