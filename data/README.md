# Data Directory

## Structure

- `raw/` - Original registry extractions (individual trial CSVs)
- `processed/` - Clean, analysis-ready datasets

## Processed Files

### trials_N11.csv

Complete trial details (N=11)

- **Columns:** trial_id, registry_source, title, status, start_date, end_date, phase, study_design, sample_size, target_condition, technology_type, primary_institution_id, country, trial_url, results_published, publication_url
- **Source:** ClinicalTrials.gov, PACTR, WHO ICTRP
- **Last verified:** November 30, 2024

### institutions_N11.csv

Institutional roster (N=36)

- **Columns:** institution_id, institution_name, country, sector, ror_id (where available)
- **Sectors:** Academia, Industry, Government, Funder, NGO
- **Geographic coverage:** 10 Sub-Saharan African countries + international partners

### edges_N11.csv

Network relationships (N=99)

- **Columns:** trial_id, institution_id, relationship_type
- **Relationship types:** sponsor, collaborator, site, technology_provider, funding, industry_partner, government_partner
- **Note:** Analysis includes both direct edges and co-participation edges (institutions connected through shared trial participation)

### funding_sources_N11.csv

Funding organizations (N=12)

- **Columns:** funding_id, name, headquarters_country, funder_type
- **Funder types:** Private Foundation, Government Agency, International Organization, Healthcare Institution
- **Extracted from:** institutions_N11.csv where sector='Funder'

### funding_relationships_N11.csv

Funding connections (N=12)

- **Columns:** funding_relationship_id, funder_id, recipient_type, recipient_id, funding_type, start_date, end_date
- **Links:** Funding sources to clinical trials
- **Extracted from:** edges_N11.csv where relationship_type='funding'

## Data Provenance

### Extraction Sources

- **ClinicalTrials.gov** - Primary registry for international trials
- **Pan African Clinical Trials Registry (PACTR)** - Regional registry
- **WHO International Clinical Trials Registry Platform** - Aggregated registry search

### Quality Assurance

- Dual extraction by independent reviewers
- Cross-registry validation for multi-registered trials
- Institutional name standardization using ROR identifiers
- Manual verification of all AI diagnostic classifications

### Version History

- **N=11 (Current)** - Verified dataset after exclusion of non-AI trials
- **N=12 (Previous)** - Initial dataset (NCT01990274 excluded as non-AI diagnostic)

See `../docs/DATA_EXTRACTION_PROTOCOL.md` for detailed extraction procedures.

## License

Creative Commons Attribution 4.0 International (CC BY 4.0)

## Usage

Data files are designed for direct use with analysis scripts in `../analysis/`. Scripts automatically load from `data/processed/`.

For manual analysis:

```python
import pandas as pd

trials = pd.read_csv('data/processed/trials_N11.csv')
institutions = pd.read_csv('data/processed/institutions_N11.csv')
edges = pd.read_csv('data/processed/edges_N11.csv')
```
