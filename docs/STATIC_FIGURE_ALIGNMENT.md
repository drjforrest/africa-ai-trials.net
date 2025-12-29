# Static Figure Alignment - Lancet Submission

This document ensures the Next.js dynamic visualization exactly matches the static figure submitted to Lancet.

## Reference Script

**File:** `Archive/old_src/visualize_network_N11.py`

This script generates the static network figure (`figure_1_network.png`) that was submitted to Lancet.

## Data Sources (Static Figure)

The static figure uses these exact CSV files:

1. `data/processed/trials_N11.csv` - 11 clinical trials
2. `data/processed/institutions_N11.csv` - All institutions (including funders with `sector='Funder'`)
3. `data/processed/edges_N11.csv` - All relationships (including funding relationships)

**Key Point:** Funders are included as institutions with `sector='Funder'`, NOT as separate entities.

## Network Construction (Static Figure)

1. **Trial Nodes:** Added from `trials_N11.csv`

   - Shape: Circles (`node_shape='o'`)
   - Color: Light gray (`#E8E8E8`)
   - Size: Based on degree centrality, scaled 60% of institution size

2. **Institution Nodes:** Added from `institutions_N11.csv`

   - Shape: Squares (`node_shape='s'`)
   - Colors by sector:
     - Academia: `#2E86AB` (Blue)
     - Funders: `#A23B72` (Purple)
     - Industry: `#F18F01` (Orange)
     - Government: `#C73E1D` (Red)
   - Size: Based on degree centrality (200-2000 range)

3. **Edges:** Added from `edges_N11.csv`

   - All relationships including funding
   - Color: Light gray, alpha=0.2, width=0.5

4. **Layout:** `nx.spring_layout(G, k=0.5, iterations=50, seed=42)`

5. **Labels:** Only institutions with degree > 5

## Next.js Implementation Alignment

### Data Processing (`scripts/process-sqlite-data-n11.js`)

✅ Uses `institutions` table (includes all institutions with sector='Funder')
✅ Uses `clinical_trials` table
✅ Uses `relationships` table (from edges_N11.csv, includes all relationships)
✅ NO separate funding processing (funding is in edges_N11.csv)

### Network Diagram Component (`src/components/NetworkDiagram.tsx`)

✅ Trials rendered as circles (gray `#E8E8E8`)
✅ Institutions rendered as squares
✅ Colors match exactly:

- Academia: `#2E86AB`
- Funders: `#A23B72`
- Industry: `#F18F01`
- Government: `#C73E1D`
  ✅ Node sizes based on degree centrality
  ✅ Edges: light gray, low opacity
  ✅ Labels only for institutions with degree > 5
  ✅ Legend matches static figure

### Layout

✅ Force-directed layout with similar parameters to spring_layout
✅ Deterministic initial positions based on node IDs

## Verification Checklist

- [x] Same data sources (trials_N11.csv, institutions_N11.csv, edges_N11.csv)
- [x] Funders treated as institutions with sector='Funder'
- [x] All relationships from edges_N11.csv included
- [x] Node shapes match (trials=circles, institutions=squares)
- [x] Colors match exactly
- [x] Node sizing based on degree centrality
- [x] Edge styling matches
- [x] Labels only for high-degree institutions
- [x] Legend matches

## Current Status

The Next.js interface should now exactly match the static figure submitted to Lancet.
