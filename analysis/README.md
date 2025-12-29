# Analysis Scripts

Numbered scripts show workflow order.

## Scripts

### 01_calculate_centrality.py

Network centrality analysis

- Calculates degree, betweenness, and closeness centrality
- Generates institution rankings
- Computes correlation analyses
- Creates supplementary visualizations

### run_all_analysis.py

Master pipeline (recommended starting point)

- Runs all analysis scripts in sequence
- Provides progress reporting
- Handles errors gracefully

## Usage

### Complete Pipeline

```bash
python analysis/run_all_analysis.py
```

### Individual Scripts

```bash
python analysis/01_calculate_centrality.py
```

## Requirements

See `../requirements.txt`

Install dependencies:

```bash
pip install -r ../requirements.txt
```

## Outputs

All results are saved to `../results/`:

- CSV tables in `results/`
- Figures in `results/figures/`
- Supplementary materials in `results/figures/supplementary/` and `results/tables/supplementary/`

## Workflow

1. **00_extract_funding_data.py** - Extract funding data (run once, if not already done)
2. **01_calculate_centrality.py** - Network analysis and centrality metrics
3. **02_visualize_geographic_temporal.py** - Geographic and temporal figures
4. Results review and interpretation

## Notes

- Scripts assume data files are in `../data/processed/`
- All outputs are saved to `../results/`
- Scripts create output directories automatically if they don't exist
