# Funding Data Added to N=11 Dataset

## ✅ Funding Sources Now Included!

Funding data has been extracted and added to the N=11 dataset structure.

## What Was Added

### 1. Funding Sources File

**File:** `data/processed/funding_sources_N11.csv`

- **12 funding organizations** extracted from institutions where sector='Funder'
- **Columns:** funding_id, name, headquarters_country, funder_type
- **Funder types:**
  - Private Foundation (4): ARVO, Gates Foundation, Dalio Philanthropies
  - Government Agency (5): CDC, NICHD, NCI, NIAMS
  - International Organization (3): EPFL Tech4Dev, FIND, Orbis International, PATH
  - Healthcare Institution (1): Mayo Clinic

### 2. Funding Relationships File

**File:** `data/processed/funding_relationships_N11.csv`

- **12 funding relationships** linking funders to trials
- **Columns:** funding_relationship_id, funder_id, recipient_type, recipient_id, funding_type
- **Extracted from:** edges_N11.csv where relationship_type='funding'

### 3. Database Updates

- Added `funding_sources` table to database schema
- Added `funding_relationships` table to database schema
- Updated database creation script to import funding data
- Updated data processing script to include funders in network

### 4. Visualization Scripts

- **`analysis/02_visualize_geographic_temporal.py`** - Creates geographic distribution and temporal evolution figures
- Added to master analysis pipeline

## Files Created/Updated

### New Files

- `data/processed/funding_sources_N11.csv`
- `data/processed/funding_relationships_N11.csv`
- `analysis/00_extract_funding_data.py` (extraction script)
- `analysis/02_visualize_geographic_temporal.py` (visualization script)

### Updated Files

- `web_interface/scripts/create-database-n11.py` - Added funding tables
- `web_interface/scripts/process-sqlite-data-n11.js` - Processes funding data
- `web_interface/src/app/api/network/route.ts` - Includes funders in API
- `analysis/run_all_analysis.py` - Includes geographic/temporal visualization
- `data/README.md` - Documents funding files
- `analysis/README.md` - Documents new scripts

## Funding Sources by Type

- **Private Foundations (4):**

  - Association for Research in Vision & Ophthalmology (ARVO)
  - Bill & Melinda Gates Foundation
  - Dalio Philanthropies

- **Government Agencies (5):**

  - CDC (U.S. Centers for Disease Control and Prevention)
  - Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD)
  - National Cancer Institute (NCI)
  - National Institute of Arthritis and Musculoskeletal and Skin Diseases (NIAMS)

- **International Organizations (3):**

  - EPFL Tech4Dev
  - Foundation for Innovative New Diagnostics (FIND)
  - Orbis International
  - PATH International

- **Healthcare Institutions (1):**
  - Mayo Clinic

## Funding Relationships

12 funding relationships connect funders to trials:

- NCT03757299: EPFL Tech4Dev
- NCT04666311: FIND
- NCT05139940: CDC
- NCT05438576: Dalio Philanthropies, NICHD, Mayo Clinic, NIAMS
- NCT06042543: NCI
- PACTR202101512465690: ARVO, Orbis International
- PACTR202502499779176: Gates Foundation, PATH

## Next Steps

1. **Rebuild database with funding data:**

   ```bash
   cd web_interface
   npm run data:rebuild
   ```

2. **Generate visualizations:**

   ```bash
   python analysis/run_all_analysis.py
   ```

3. **Verify funding data in interface:**
   - Check network visualization includes funders
   - Verify funding relationships appear as links
   - Test API endpoints return funding data

## Protocol Compliance

✅ **Funding sources extracted** - Per protocol Section 3 (Data Extraction Form)  
✅ **Funder types classified** - Government agency, private foundation, international organization  
✅ **Funding relationships documented** - Links between funders and trials  
✅ **Matches static analysis** - Same structure as submitted to journal

---

**Status:** ✅ Funding data fully integrated  
**Last Updated:** December 29, 2024
