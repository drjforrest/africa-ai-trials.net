# AI Diagnostic Innovation Network in Sub-Saharan Africa

Network analysis of clinical trials evaluating artificial intelligence diagnostic technologies in Sub-Saharan Africa.

## Overview

This repository contains data, analysis code, and results for a network analysis of AI diagnostic clinical trials in Sub-Saharan Africa. The analysis examines the institutional relationships, network structure, and ecosystem characteristics of this emerging field.

**Dataset:** N=11 verified AI diagnostic clinical trials (2020-2024)  
**Network:** 47 nodes (11 trials + 36 institutions), 99 edges  
**Countries:** 10 Sub-Saharan African countries

## Repository Structure

```
.
├── data/
│   ├── raw/              # Original registry extractions (individual trial CSVs)
│   └── processed/        # Clean, analysis-ready datasets
│       ├── trials_N11.csv
│       ├── institutions_N11.csv
│       └── edges_N11.csv
├── analysis/
│   ├── 01_calculate_centrality.py    # Network centrality analysis
│   └── run_all_analysis.py          # Master pipeline
├── results/
│   ├── figures/                     # Publication figures
│   │   ├── figure_1_network.png
│   │   ├── figure_2_geographic.png
│   │   ├── figure_3_temporal.png
│   │   └── supplementary/          # Supplementary figures
│   └── tables/                      # Publication tables
│       ├── table_1_trials.csv
│       ├── table_2_metrics.csv
│       └── supplementary/            # Supplementary tables
├── docs/                            # Documentation
│   ├── SEARCH_STRATEGIES.md
│   ├── DATA_EXTRACTION_PROTOCOL.md
│   ├── ANALYSIS_GUIDE.md
│   └── SUPPLEMENTARY_METHODS.md
├── requirements.txt
├── LICENSE
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Run Analysis

```bash
# Run complete analysis pipeline
python analysis/run_all_analysis.py

# Or run individual scripts
python analysis/01_calculate_centrality.py
```

### 3. View Results

Results are saved to the `results/` directory:

- **Figures:** `results/figures/`
- **Tables:** `results/tables/`
- **Supplementary materials:** `results/figures/supplementary/` and `results/tables/supplementary/`

## Data

### Processed Datasets

- **trials_N11.csv** - Complete trial details (N=11)
  - Columns: trial_id, title, status, start_date, country, technology_type, etc.
- **institutions_N11.csv** - Institutional roster (N=36)
  - Columns: institution_id, institution_name, country, sector, etc.
- **edges_N11.csv** - Network relationships (N=99)
  - Columns: trial_id, institution_id, relationship_type

### Data Provenance

Data extracted from:

- ClinicalTrials.gov
- Pan African Clinical Trials Registry (PACTR)
- WHO International Clinical Trials Registry Platform

**Last updated:** November 30, 2024  
**Next scheduled update:** January 31, 2025

See `docs/DATA_EXTRACTION_PROTOCOL.md` for detailed extraction procedures.

## Analysis Scripts

### 01_calculate_centrality.py

Calculates network centrality measures (degree, betweenness, closeness) and generates:

- Centrality rankings for all nodes
- Institution-specific centrality metrics
- Correlation analyses among centrality measures
- Network-level descriptive statistics
- Supplementary visualizations (correlation heatmaps, scatter plots)

**Outputs:**

- `results/all_nodes_centrality.csv`
- `results/institutions_centrality.csv`
- `results/centrality_correlations.csv`
- `results/network_descriptive_stats.csv`
- `results/figures/supplementary/figure_s1_correlation.png`
- `results/figures/supplementary/figure_s2_scatter.png`

## Results Summary

### Network Characteristics

- **Total nodes:** 47 (11 trials, 36 institutions)
- **Total edges:** 99 (36 direct + 63 co-participation)
- **Network density:** 0.092
- **Connected components:** 11 (one per trial)
- **Average degree:** 4.21

### Key Findings

- Network is highly fragmented with no inter-trial institutional bridges
- Each trial forms an isolated component
- Degree and closeness centrality are perfectly correlated (ρ = 1.000)
- Betweenness centrality is zero for all nodes (no shortest paths between components)

### Top Institutions by Degree Centrality

See `results/institutions_centrality.csv` for complete rankings.

## Documentation

- **SEARCH_STRATEGIES.md** - Registry search strategies and syntax
- **DATA_EXTRACTION_PROTOCOL.md** - Data extraction procedures and quality control
- **ANALYSIS_GUIDE.md** - Step-by-step analysis workflow
- **SUPPLEMENTARY_METHODS.md** - Extended methodological documentation

## Citation

If you use this dataset or analysis code, please cite:

```bibtex
@article{ai_trials_africa_2024,
  title={AI Diagnostic Innovation Network in Sub-Saharan Africa: A Network Analysis},
  author={[Authors]},
  journal={[Journal]},
  year={2024}
}
```

## License

- **Code:** MIT License (see `LICENSE`)
- **Data:** Creative Commons Attribution 4.0 International (CC BY 4.0)

## Contributing

This is a research repository. For questions or corrections, please open an issue.

## Contact

For questions about the data or analysis, please contact the research team.

---

**Repository Status:** Publication-ready  
**Last Updated:** December 2024
