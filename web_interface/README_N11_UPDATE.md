# Updating Next.js Interface for N=11 Dataset

This document explains how to update the Next.js interface to use the new N=11 verified dataset.

## Overview

The interface has been updated to work with the N=11 dataset structure:

- **11 verified AI diagnostic trials**
- **36 institutions**
- **99 relationships** (trial-institution edges)

## Quick Start

### 1. Rebuild Database with N=11 Data

```bash
cd web_interface
npm run data:rebuild
```

This will:

1. Create a new SQLite database from `data/processed/` CSV files
2. Process the database and generate `src/data/network-data.json`

### 2. Start Development Server

```bash
npm run dev
```

The interface will now display the N=11 dataset.

## What Changed

### New Scripts

- **`scripts/create-database-n11.py`** - Creates database from N=11 CSV files
  - Reads from `../../data/processed/` (relative to web_interface directory)
  - Imports `trials_N11.csv`, `institutions_N11.csv`, `edges_N11.csv`
- **`scripts/process-sqlite-data-n11.js`** - Processes database to JSON
  - Handles simplified N=11 structure (no companies, no funding sources)
  - Generates network-data.json for frontend

### Updated Package.json Scripts

- `npm run data:rebuild` - Now uses N=11 scripts
- `npm run data:rebuild:old` - Available if you need the old structure

### Data Structure

The N=11 dataset has a simpler structure:

**Trials** (`trials_N11.csv`):

- trial_id, title, status, start_date, country, technology_type, etc.

**Institutions** (`institutions_N11.csv`):

- institution_id, institution_name, country, sector

**Relationships** (`edges_N11.csv`):

- trial_id, institution_id, relationship_type

## API Routes

The existing API routes in `src/app/api/` will work with the N=11 database:

- `/api/network` - Network data (nodes and links)
- `/api/clinical-trials` - Trial data
- `/api/institutions` - Institution data
- `/api/data` - Complete dataset

## Frontend Components

All frontend components will automatically work with the new data:

- `NetworkDiagram` - Visualizes trial-institution network
- `DataTables` - Displays trials and institutions
- `StatsPanel` - Shows network statistics
- `TimeSlider` - Filters by trial start year

## Troubleshooting

### Database Not Found

If you get "database not found" errors:

```bash
npm run data:rebuild
```

### Data Not Updating

Clear the database and rebuild:

```bash
rm data/network.db
npm run data:rebuild
```

### Wrong Data Showing

Make sure you're using the N-11 scripts:

- Check `package.json` scripts point to `create-database-n11.py`
- Verify `data/processed/` contains the N-11 CSV files

## Data Location

The scripts expect data files at:

```
../../data/processed/
  ├── trials_N11.csv
  ├── institutions_N11.csv
  └── edges_N11.csv
```

Relative to the `web_interface/` directory.

## Next Steps

1. **Test the interface** - Verify all components display correctly
2. **Update metadata** - Update any hardcoded trial counts (12 → 11)
3. **Review visualizations** - Ensure network diagrams look correct
4. **Check filters** - Test country, year, and type filters

## Notes

- The N=11 dataset doesn't include companies or funding sources
- Some API routes may return empty arrays for companies/funders
- The network visualization focuses on trial-institution relationships
- All 11 trials are verified AI diagnostic trials in Sub-Saharan Africa
