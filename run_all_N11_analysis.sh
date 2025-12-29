#!/bin/bash
#
# Run All N=11 Analysis Scripts
# Generates all outputs for the revised network analysis
#
# Run from project root:
# cd /Users/drjforrest/dev/projects/data-science/ai-trials-africa
# chmod +x run_all_N11_analysis.sh
# ./run_all_N11_analysis.sh

echo "========================================================================"
echo "AI DIAGNOSTIC TRIALS IN SUB-SAHARAN AFRICA - N=11 ANALYSIS"
echo "========================================================================"
echo ""
echo "This script will run all analysis and visualization scripts in sequence:"
echo "  1. Network centrality analysis (run_N11_analysis.py)"
echo "  2. Network visualization (visualize_network_N11.py)"
echo "  3. Geographic & temporal visualizations (visualize_geographic_temporal_N11.py)"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "========== STEP 1: Network Centrality Analysis =========="
python3 src/run_N11_analysis.py
if [ $? -ne 0 ]; then
    echo "ERROR: Network analysis failed!"
    exit 1
fi

echo ""
echo "========== STEP 2: Network Visualization =========="
python3 src/visualize_network_N11.py
if [ $? -ne 0 ]; then
    echo "ERROR: Network visualization failed!"
    exit 1
fi

echo ""
echo "========== STEP 3: Geographic & Temporal Visualizations =========="
python3 src/visualize_geographic_temporal_N11.py
if [ $? -ne 0 ]; then
    echo "ERROR: Geographic/temporal visualization failed!"
    exit 1
fi

echo ""
echo "========================================================================"
echo "ALL ANALYSES COMPLETE!"
echo "========================================================================"
echo ""
echo "Outputs saved to: ./Revised Analysis/output/"
echo ""
echo "Generated files:"
echo "  - all_nodes_centrality_N11.csv"
echo "  - institutions_centrality_N11.csv"
echo "  - centrality_correlations_N11.csv"
echo "  - correlation_heatmap_N11.png"
echo "  - centrality_scatter_plots_N11.png"
echo "  - network_visualization_N11.png"
echo "  - geographic_distribution_N11.png"
echo "  - cumulative_trials_N11.png"
echo ""
echo "Next steps:"
echo "  1. Review output files for manuscript tables and figures"
echo "  2. Compare N=11 results with previous N=12 results (if needed)"
echo "  3. Update manuscript text with new network statistics"
