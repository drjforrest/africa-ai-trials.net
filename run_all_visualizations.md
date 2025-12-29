# Generating All Figures for N=12 Manuscript

## Three Python scripts to run:

### 1. Network Diagram (Figure 1)
**Script:** `visualize_network_N12.py`  
**Generates:** Main network visualization showing trials and institutions

```bash
cd /Users/drjforrest/dev/projects/data-science/ai-trials-africa
python visualize_network_N12.py
```

**Output files:**
- `./Revised Analysis/output/network_diagram_N12.png`
- `./Revised Analysis/output/network_diagram_N12.pdf`

---

### 2. Geographic Distribution + Temporal Evolution (Figures 2 & 3)
**Script:** `visualize_geographic_temporal_N12.py`  
**Generates:** Country bar chart and cumulative trials over time

```bash
cd /Users/drjforrest/dev/projects/data-science/ai-trials-africa
python visualize_geographic_temporal_N12.py
```

**Output files:**
- `./Revised Analysis/output/geographic_distribution_N12.png`
- `./Revised Analysis/output/geographic_distribution_N12.pdf`
- `./Revised Analysis/output/temporal_evolution_N12.png`
- `./Revised Analysis/output/temporal_evolution_N12.pdf`

---

### 3. Correlation Analysis (Supplementary)
**Script:** `run_N12_analysis.py` (already exists in your src/ folder)  
**Generates:** Network statistics + correlation visualizations

```bash
cd /Users/drjforrest/dev/projects/data-science/ai-trials-africa
python src/run_N12_analysis.py
```

**Output files:**
- `./Revised Analysis/output/all_nodes_centrality_N12.csv`
- `./Revised Analysis/output/institutions_centrality_N12.csv`
- `./Revised Analysis/output/centrality_correlations_N12.csv`
- `./Revised Analysis/output/correlation_heatmap_N12.png`
- `./Revised Analysis/output/centrality_scatter_plots_N12.png`

---

## Recommended Figure Strategy:

### Main Manuscript:
- **Figure 1:** Network diagram (network_diagram_N12)
- **Figure 2:** Geographic distribution (geographic_distribution_N12)
- **Figure 3:** Temporal evolution (temporal_evolution_N12)

### Supplementary Materials:
- Correlation heatmap (correlation_heatmap_N12)
- Scatter plots (centrality_scatter_plots_N12)
- Centrality tables (institutions_centrality_N12.csv)

---

## Quick Run All:

```bash
cd /Users/drjforrest/dev/projects/data-science/ai-trials-africa

# Network diagram
python visualize_network_N12.py

# Geographic + temporal
python visualize_geographic_temporal_N12.py

# Statistics (if needed)
python src/run_N12_analysis.py
```

All figures will be in: `./Revised Analysis/output/`
