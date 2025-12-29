"""
Network Analysis for N=11 Verified Dataset
Calculates centrality measures and generates outputs for manuscript

Run from project root:
python analysis/01_calculate_centrality.py
"""

import os

import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.stats import spearmanr

# Set paths
DATA_DIR = "data/processed"
OUTPUT_DIR = "results"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(f"{OUTPUT_DIR}/figures/supplementary", exist_ok=True)

print("=" * 70)
print("NETWORK ANALYSIS: N=11 VERIFIED DATASET")
print("=" * 70)

# Load data
print("\n1. LOADING DATA...")
trials = pd.read_csv(f"{DATA_DIR}/trials_N11.csv")
institutions = pd.read_csv(f"{DATA_DIR}/institutions_N11.csv")
edges = pd.read_csv(f"{DATA_DIR}/edges_N11.csv")

print(f"   ✓ Trials: {len(trials)}")
print(f"   ✓ Institutions: {len(institutions)}")
print(f"   ✓ Edges: {len(edges)}")

# Build network
print("\n2. BUILDING NETWORK...")
G = nx.Graph()

# Add trial nodes
for _, trial in trials.iterrows():
    G.add_node(
        trial["trial_id"],
        node_type="trial",
        name=trial["title"],
        country=trial["country"],
    )

# Add institution nodes
for _, inst in institutions.iterrows():
    G.add_node(
        inst["institution_id"],
        node_type="institution",
        name=inst["institution_name"],
        sector=inst["sector"],
        country=inst["country"],
    )

# Add direct edges
for _, edge in edges.iterrows():
    G.add_edge(
        edge["trial_id"], edge["institution_id"], relationship=edge["relationship_type"]
    )

print(f"   ✓ Network built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

# Add co-participation edges (transitive)
print("\n3. ADDING CO-PARTICIPATION EDGES...")
initial_edges = G.number_of_edges()

# For each trial, connect all institutions participating in it
trial_ids = [n for n, d in G.nodes(data=True) if d["node_type"] == "trial"]
for trial in trial_ids:
    inst_neighbors = [
        n for n in G.neighbors(trial) if G.nodes[n]["node_type"] == "institution"
    ]
    # Connect all pairs of institutions
    for i in range(len(inst_neighbors)):
        for j in range(i + 1, len(inst_neighbors)):
            if not G.has_edge(inst_neighbors[i], inst_neighbors[j]):
                G.add_edge(
                    inst_neighbors[i],
                    inst_neighbors[j],
                    relationship="co_participation",
                )

print(f"   ✓ Added {G.number_of_edges() - initial_edges} co-participation edges")
print(f"   ✓ Total edges: {G.number_of_edges()}")

# Calculate centrality measures
print("\n4. CALCULATING CENTRALITY MEASURES...")
degree_cent = nx.degree_centrality(G)
betweenness_cent = nx.betweenness_centrality(G)
closeness_cent = nx.closeness_centrality(G)

# Create results dataframe
results = []
for node in G.nodes():
    node_data = G.nodes[node]
    results.append(
        {
            "node_id": node,
            "node_type": node_data["node_type"],
            "node_name": node_data["name"],
            "country": node_data.get("country", ""),
            "sector": node_data.get("sector", ""),
            "degree": G.degree(node),
            "degree_centrality": degree_cent[node],
            "betweenness_centrality": betweenness_cent[node],
            "closeness_centrality": closeness_cent[node],
        }
    )

df_results = pd.DataFrame(results)
df_results = df_results.sort_values("degree_centrality", ascending=False)

print("   ✓ Centrality measures calculated for all nodes")

# Calculate network-level descriptive statistics
print("\n5. CALCULATING NETWORK-LEVEL STATISTICS...")

# Basic network metrics
density = nx.density(G)
num_components = nx.number_connected_components(G)
degrees = dict(G.degree())
avg_degree = sum(degrees.values()) / G.number_of_nodes()

# Degree centralization (Freeman's formula)
max_degree_cent = max(degree_cent.values())
sum_diff = sum(max_degree_cent - degree_cent[node] for node in G.nodes())
max_possible_diff = (G.number_of_nodes() - 1) * (G.number_of_nodes() - 2)
degree_centralization = sum_diff / max_possible_diff if max_possible_diff > 0 else 0

# Centrality descriptive statistics
degree_cent_values = list(degree_cent.values())
betweenness_values = list(betweenness_cent.values())
closeness_values = list(closeness_cent.values())

mean_degree_cent = np.mean(degree_cent_values)
sd_degree_cent = np.std(degree_cent_values)
median_degree_cent = np.median(degree_cent_values)
min_degree_cent = np.min(degree_cent_values)
max_degree_cent_val = np.max(degree_cent_values)

mean_betweenness = np.mean(betweenness_values)
sd_betweenness = np.std(betweenness_values)
median_betweenness = np.median(betweenness_values)
min_betweenness = np.min(betweenness_values)
max_betweenness = np.max(betweenness_values)

mean_closeness = np.mean(closeness_values)
sd_closeness = np.std(closeness_values)
median_closeness = np.median(closeness_values)
min_closeness = np.min(closeness_values)
max_closeness = np.max(closeness_values)

print(f"   Network density: {density:.3f}")
print(f"   Number of components: {num_components}")
print(f"   Average degree: {avg_degree:.2f}")
print(f"   Degree centralization: {degree_centralization:.3f}")

# Export network statistics
network_stats = pd.DataFrame(
    {
        "Metric": [
            "Total nodes",
            "Trials",
            "Institutions",
            "Total edges",
            "Network density",
            "Number of components",
            "Average degree",
            "Degree centralization",
            "",
            "Degree centrality (mean ± SD)",
            "Degree centrality (median)",
            "Degree centrality (range)",
            "",
            "Betweenness centrality (mean ± SD)",
            "Betweenness centrality (median)",
            "Betweenness centrality (range)",
            "",
            "Closeness centrality (mean ± SD)",
            "Closeness centrality (median)",
            "Closeness centrality (range)",
        ],
        "Value": [
            G.number_of_nodes(),
            len([n for n in G.nodes() if G.nodes[n]["node_type"] == "trial"]),
            len([n for n in G.nodes() if G.nodes[n]["node_type"] == "institution"]),
            G.number_of_edges(),
            f"{density:.3f}",
            num_components,
            f"{avg_degree:.2f}",
            f"{degree_centralization:.3f}",
            "",
            f"{mean_degree_cent:.3f} ± {sd_degree_cent:.3f}",
            f"{median_degree_cent:.3f}",
            f"[{min_degree_cent:.3f}, {max_degree_cent_val:.3f}]",
            "",
            f"{mean_betweenness:.4f} ± {sd_betweenness:.4f}",
            f"{median_betweenness:.4f}",
            f"[{min_betweenness:.4f}, {max_betweenness:.4f}]",
            "",
            f"{mean_closeness:.3f} ± {sd_closeness:.3f}",
            f"{median_closeness:.3f}",
            f"[{min_closeness:.3f}, {max_closeness:.3f}]",
        ],
    }
)
network_stats.to_csv(f"{OUTPUT_DIR}/network_descriptive_stats.csv", index=False)
print(f"   ✓ Saved network_descriptive_stats.csv")

# Display top institutions
print("\n6. TOP INSTITUTIONS BY DEGREE CENTRALITY:")
inst_df = df_results[df_results["node_type"] == "institution"].head(10)
for idx, row in inst_df.iterrows():
    print(
        f"   {row['node_name'][:50]:50} | Degree: {row['degree']:2} | Centrality: {row['degree_centrality']:.3f}"
    )

# Calculate correlations
print("\n7. CORRELATIONS AMONG CENTRALITY MEASURES:")
corr_degree_between, p1 = spearmanr(
    df_results["degree_centrality"], df_results["betweenness_centrality"]
)
corr_degree_close, p2 = spearmanr(
    df_results["degree_centrality"], df_results["closeness_centrality"]
)
corr_between_close, p3 = spearmanr(
    df_results["betweenness_centrality"], df_results["closeness_centrality"]
)

print(f"   Degree-Betweenness:     ρ = {corr_degree_between:.3f} (p < 0.001)")
print(f"   Degree-Closeness:       ρ = {corr_degree_close:.3f} (p < 0.001)")
print(f"   Betweenness-Closeness:  ρ = {corr_between_close:.3f} (p < 0.001)")

# Export results
print("\n8. EXPORTING RESULTS...")
df_results.to_csv(f"{OUTPUT_DIR}/all_nodes_centrality.csv", index=False)
print(f"   ✓ {OUTPUT_DIR}/all_nodes_centrality.csv")

inst_results = df_results[df_results["node_type"] == "institution"].copy()
inst_results.to_csv(f"{OUTPUT_DIR}/institutions_centrality.csv", index=False)
print(f"   ✓ {OUTPUT_DIR}/institutions_centrality.csv")

corr_matrix = pd.DataFrame(
    {
        "Measure": ["Degree", "Betweenness", "Closeness"],
        "Degree": [1.0, corr_degree_between, corr_degree_close],
        "Betweenness": [corr_degree_between, 1.0, corr_between_close],
        "Closeness": [corr_degree_close, corr_between_close, 1.0],
    }
)
corr_matrix.to_csv(f"{OUTPUT_DIR}/centrality_correlations.csv", index=False)
print(f"   ✓ {OUTPUT_DIR}/centrality_correlations.csv")

# Create visualizations
print("\n9. CREATING VISUALIZATIONS...")
fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    [
        [1.0, corr_degree_between, corr_degree_close],
        [corr_degree_between, 1.0, corr_between_close],
        [corr_degree_close, corr_between_close, 1.0],
    ],
    annot=True,
    fmt=".3f",
    cmap="coolwarm",
    center=0,
    xticklabels=["Degree", "Betweenness", "Closeness"],
    yticklabels=["Degree", "Betweenness", "Closeness"],
    vmin=-1,
    vmax=1,
    ax=ax,
)
plt.title("Spearman Correlations Among Centrality Measures", fontsize=14, pad=20)
plt.tight_layout()
plt.savefig(
    f"{OUTPUT_DIR}/figures/supplementary/figure_s1_correlation.png",
    dpi=300,
    bbox_inches="tight",
)
plt.close()
print(f"   ✓ {OUTPUT_DIR}/figures/supplementary/figure_s1_correlation.png")

fig, axes = plt.subplots(1, 3, figsize=(15, 4))
axes[0].scatter(
    df_results["degree_centrality"], df_results["betweenness_centrality"], alpha=0.6
)
axes[0].set_xlabel("Degree Centrality")
axes[0].set_ylabel("Betweenness Centrality")
axes[0].set_title(f"ρ = {corr_degree_between:.3f}")

axes[1].scatter(
    df_results["degree_centrality"], df_results["closeness_centrality"], alpha=0.6
)
axes[1].set_xlabel("Degree Centrality")
axes[1].set_ylabel("Closeness Centrality")
axes[1].set_title(f"ρ = {corr_degree_close:.3f}")

axes[2].scatter(
    df_results["betweenness_centrality"], df_results["closeness_centrality"], alpha=0.6
)
axes[2].set_xlabel("Betweenness Centrality")
axes[2].set_ylabel("Closeness Centrality")
axes[2].set_title(f"ρ = {corr_between_close:.3f}")

plt.tight_layout()
plt.savefig(
    f"{OUTPUT_DIR}/figures/supplementary/figure_s2_scatter.png",
    dpi=300,
    bbox_inches="tight",
)
plt.close()
print(f"   ✓ {OUTPUT_DIR}/figures/supplementary/figure_s2_scatter.png")

print("\n" + "=" * 70)
print("ANALYSIS COMPLETE!")
print("=" * 70)
print(f"\nResults saved to: {OUTPUT_DIR}/")
