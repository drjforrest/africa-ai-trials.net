#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Analysis of Synthetic Network of AI Diagnostic Innovation in Sub-Saharan Africa
Polished version for Lancet Digital Health publication-ready figures

This script creates professional visualizations suitable for academic publication
with proper color schemes, typography, and formatting standards.
"""

from pathlib import Path

import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
import pandas as pd
import seaborn as sns

# Set publication-ready style
plt.rcParams.update({
    'font.size': 10,
    'font.family': 'Arial',
    'axes.linewidth': 0.8,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'axes.grid': True,
    'grid.alpha': 0.3,
    'grid.linewidth': 0.5,
    'legend.frameon': False,
    'legend.fontsize': 9,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'savefig.facecolor': 'white'
})

# Professional color palette
COLORS = {
    'trial': '#E31A1C',        # Red
    'institution': '#1F78B4',  # Blue  
    'company': '#33A02C',      # Green
    'funder': '#6A3D9A',       # Purple
    'edge_primary': '#FF7F00', # Orange for primary relationships
    'edge_funding': '#6A3D9A', # Purple for funding
    'edge_tech': '#FF7F00',    # Orange for tech transfer
    'edge_default': '#999999'  # Gray for other relationships
}

# Define data directory
# NOTE: This script is deprecated. Use analysis scripts in the root analysis/ directory instead.
# Old synthetic data has been moved to archive/old_synthetic_data
DATA_DIR = Path("../archive/old_synthetic_data/")

def load_data():
    """Load all CSV files into pandas DataFrames"""
    data = {}
    data['trials'] = pd.read_csv(DATA_DIR / 'clinical_trials.csv')
    data['institutions'] = pd.read_csv(DATA_DIR / 'institutions.csv')
    data['companies'] = pd.read_csv(DATA_DIR / 'companies.csv')
    data['relationships'] = pd.read_csv(DATA_DIR / 'relationships.csv')
    data['funding_sources'] = pd.read_csv(DATA_DIR / 'funding_sources.csv')
    data['funding_relationships'] = pd.read_csv(DATA_DIR / 'funding_relationships.csv')
    data['publications'] = pd.read_csv(DATA_DIR / 'publications.csv')
    data['tech_transfers'] = pd.read_csv(DATA_DIR / 'technology_transfers.csv')
    data['regulatory'] = pd.read_csv(DATA_DIR / 'regulatory_events.csv')
    return data

def build_network(data):
    """Construct a NetworkX graph from the relationship data"""
    G = nx.Graph()
    
    # Add trial nodes
    for _, trial in data['trials'].iterrows():
        G.add_node(trial['trial_id'], 
                   type='trial', 
                   name=trial['title'],
                   status=trial['status'],
                   country=trial['country'],
                   condition=trial['target_condition'])
    
    # Add institution nodes
    for _, inst in data['institutions'].iterrows():
        G.add_node(inst['institution_id'], 
                   type='institution', 
                   name=inst['name'],
                   country=inst['country'],
                   is_academic=inst['is_academic'],
                   is_healthcare=inst['is_healthcare'],
                   is_research=inst['is_research'])
    
    # Add company nodes
    for _, comp in data['companies'].iterrows():
        G.add_node(comp['company_id'], 
                   type='company', 
                   name=comp['name'],
                   country=comp['headquarters_country'],
                   focus=comp['primary_focus'])
    
    # Add funding source nodes
    for _, fund in data['funding_sources'].iterrows():
        G.add_node(fund['funding_id'], 
                   type='funder', 
                   name=fund['name'],
                   country=fund['headquarters_country'])
        
    # Add edges from relationships table
    for _, rel in data['relationships'].iterrows():
        G.add_edge(rel['entity1_id'], rel['entity2_id'], 
                   type=rel['relationship_type'],
                   strength=rel['strength'],
                   has_tech_transfer=rel['technology_transfer'])
    
    # Add edges from funding relationships
    for _, fund_rel in data['funding_relationships'].iterrows():
        G.add_edge(fund_rel['funder_id'], fund_rel['recipient_id'], 
                   type='funding',
                   amount=fund_rel['amount_usd'],
                   focus=fund_rel['project_focus'])
    
    # Add edges for technology transfers
    for _, tech in data['tech_transfers'].iterrows():
        G.add_edge(tech['source_entity_id'], tech['recipient_entity_id'], 
                   type='technology_transfer',
                   tech_type=tech['technology_type'])
    
    return G

def visualize_main_network(G, filename='figure1_main_network.png'):
    """Create the main network visualization - Figure 1"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 10))
    
    # Node colors and sizes
    node_colors = [COLORS[G.nodes[node]['type']] for node in G.nodes()]
    node_sizes = [400 * nx.degree_centrality(G)[node] + 80 for node in G.nodes()]
    
    # Edge colors
    edge_colors = []
    for u, v, data in G.edges(data=True):
        if data.get('type') == 'funding':
            edge_colors.append(COLORS['edge_funding'])
        elif data.get('type') == 'technology_transfer':
            edge_colors.append(COLORS['edge_tech'])
        elif 'primary' in str(data.get('type', '')):
            edge_colors.append(COLORS['edge_primary'])
        else:
            edge_colors.append(COLORS['edge_default'])
    
    # Layout with improved positioning
    pos = nx.spring_layout(G, k=0.8, iterations=100, seed=42)
    
    # Draw network
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, 
                          node_size=node_sizes, alpha=0.8, ax=ax)
    nx.draw_networkx_edges(G, pos, edge_color=edge_colors, 
                          width=0.8, alpha=0.6, ax=ax)
    
    # Add labels for top nodes only
    top_nodes = sorted(nx.degree_centrality(G).items(), 
                      key=lambda x: x[1], reverse=True)[:8]
    labels = {node[0]: node[0] for node in top_nodes}
    nx.draw_networkx_labels(G, pos, labels=labels, font_size=8, 
                           font_weight='bold', ax=ax)
    
    # Professional legend
    legend_elements = [
        mpatches.Patch(color=COLORS['trial'], label='Trial'),
        mpatches.Patch(color=COLORS['institution'], label='Institution'),
        mpatches.Patch(color=COLORS['company'], label='Company'),
        mpatches.Patch(color=COLORS['funder'], label='Funder')
    ]
    ax.legend(handles=legend_elements, loc='upper right', 
             bbox_to_anchor=(1.0, 1.0), frameon=False)
    
    ax.set_title('AI Diagnostic Innovation Network in Sub-Saharan Africa', 
                fontsize=14, fontweight='bold', pad=20)
    ax.axis('off')
    
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def visualize_country_network(G, data, country, filename):
    """Create country-specific network visualization"""
    # Filter nodes for the country
    country_nodes = [node for node in G.nodes() 
                    if country.lower() in str(G.nodes[node].get('country', '')).lower()]
    
    if not country_nodes:
        print(f"No nodes found for {country}")
        return
    
    country_graph = G.subgraph(country_nodes)
    
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    
    # Node styling
    node_colors = [COLORS[country_graph.nodes[node]['type']] 
                   for node in country_graph.nodes()]
    
    # Adjust node sizes for smaller network
    centrality = nx.degree_centrality(country_graph)
    node_sizes = [500 * centrality[node] + 150 for node in country_graph.nodes()]
    
    # Layout
    pos = nx.spring_layout(country_graph, k=1.5, iterations=100, seed=42)
    
    # Draw network
    nx.draw_networkx_nodes(country_graph, pos, node_color=node_colors, 
                          node_size=node_sizes, alpha=0.8, ax=ax)
    nx.draw_networkx_edges(country_graph, pos, width=1.2, alpha=0.6, 
                          edge_color='#666666', ax=ax)
    
    # Add all labels for country network
    labels = {}
    for node in country_graph.nodes():
        name = country_graph.nodes[node].get('name', node)
        if len(name) > 20:
            labels[node] = name[:17] + '...'
        else:
            labels[node] = name
    
    nx.draw_networkx_labels(country_graph, pos, labels=labels, 
                           font_size=9, font_weight='bold', ax=ax)
    
    ax.set_title(f'AI Diagnostic Innovation Network in {country}', 
                fontsize=14, fontweight='bold', pad=20)
    ax.axis('off')
    
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def create_temporal_evolution_plot(data, filename='figure4_temporal_evolution.png'):
    """Create temporal evolution visualization - Figure 4"""
    trials = data['trials'].copy()
    trials['start_date'] = pd.to_datetime(trials['start_date'], errors='coerce')
    trials['year'] = trials['start_date'].dt.year
    
    # Count trials by year and country
    yearly_counts = trials.groupby(['year', 'country']).size().unstack(fill_value=0)
    
    # Professional color palette for countries
    country_colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
    
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    
    # Plot lines with markers
    for i, country in enumerate(yearly_counts.columns):
        ax.plot(yearly_counts.index, yearly_counts[country], 
               marker='o', linewidth=3, markersize=8, 
               color=country_colors[i % len(country_colors)],
               label=country, markeredgecolor='white', markeredgewidth=1)
    
    ax.set_xlabel('Year', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of New Trials', fontsize=12, fontweight='bold')
    ax.set_title('Evolution of AI Diagnostic Trials by Country', 
                fontsize=14, fontweight='bold', pad=20)
    
    # Styling
    ax.grid(True, linestyle='--', alpha=0.7)
    ax.legend(title='Country', title_fontsize=11, fontsize=10, 
             loc='upper left', frameon=False)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Set integer ticks for y-axis
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
    
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def create_technology_specialization_heatmap(data, filename='figure3_tech_specialization.png'):
    """Create technology specialization heatmap - Figure 3"""
    trials = data['trials'].copy()
    
    # Create pivot table
    tech_by_country = trials.pivot_table(
        index='country', 
        columns='ai_algorithm_type', 
        aggfunc='size', 
        fill_value=0
    )
    
    # Convert to binary presence/absence
    tech_by_country = (tech_by_country > 0).astype(int)
    
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    
    # Create heatmap with professional styling
    sns.heatmap(tech_by_country, 
                annot=True, 
                cmap='RdYlBu_r',
                cbar_kws={'label': 'Technology Present'},
                linewidths=0.5,
                linecolor='white',
                square=True,
                ax=ax)
    
    # Clean up labels
    ax.set_xlabel('AI Algorithm Type', fontsize=12, fontweight='bold')
    ax.set_ylabel('Country', fontsize=12, fontweight='bold')
    ax.set_title('Technological Specialization by Country', 
                fontsize=14, fontweight='bold', pad=20)
    
    # Rotate x-axis labels for better readability
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def create_funding_analysis(data, filename='funding_by_source.png'):
    """Create funding analysis visualization"""
    # Merge funding data
    funding_data = data['funding_relationships'].merge(
        data['funding_sources'], 
        left_on='funder_id', 
        right_on='funding_id'
    )
    
    # Aggregate by funder
    funding_by_source = funding_data.groupby('name')['amount_usd'].sum().sort_values(ascending=False)
    
    # Limit to top 15 funders for readability
    top_funders = funding_by_source.head(15)
    
    fig, ax = plt.subplots(1, 1, figsize=(14, 8))
    
    # Create gradient color palette
    colors = plt.cm.viridis(np.linspace(0, 1, len(top_funders)))
    
    bars = ax.bar(range(len(top_funders)), top_funders.values, 
                 color=colors, edgecolor='white', linewidth=0.5)
    
    # Format y-axis as millions
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))
    
    ax.set_xlabel('Funding Source', fontsize=12, fontweight='bold')
    ax.set_ylabel('Total Funding (USD)', fontsize=12, fontweight='bold')
    ax.set_title('Total Funding by Source', fontsize=14, fontweight='bold', pad=20)
    
    # Set x-axis labels
    ax.set_xticks(range(len(top_funders)))
    ax.set_xticklabels([name[:20] + '...' if len(name) > 20 else name 
                       for name in top_funders.index], 
                      rotation=45, ha='right')
    
    # Remove top and right spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def create_disease_focus_analysis(data, filename='disease_focus_areas.png'):
    """Create disease focus analysis"""
    conditions = data['trials']['target_condition'].value_counts()
    
    fig, ax = plt.subplots(1, 1, figsize=(12, 8))
    
    # Create gradient colors
    colors = plt.cm.Set3(np.linspace(0, 1, len(conditions)))
    
    bars = ax.bar(range(len(conditions)), conditions.values, 
                 color=colors, edgecolor='white', linewidth=0.5)
    
    ax.set_xlabel('Condition', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Trials', fontsize=12, fontweight='bold')
    ax.set_title('Disease Focus Areas in AI Diagnostic Trials', 
                fontsize=14, fontweight='bold', pad=20)
    
    # Clean condition names and set as labels
    clean_conditions = []
    for condition in conditions.index:
        if len(condition) > 25:
            clean_conditions.append(condition[:22] + '...')
        else:
            clean_conditions.append(condition)
    
    ax.set_xticks(range(len(conditions)))
    ax.set_xticklabels(clean_conditions, rotation=45, ha='right')
    
    # Remove top and right spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Set integer ticks for y-axis
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
    
    plt.tight_layout()
    plt.savefig(filename, dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()

def analyze_network_metrics(G):
    """Calculate and print key network metrics"""
    print("\n" + "="*50)
    print("NETWORK ANALYSIS SUMMARY")
    print("="*50)
    
    print(f"Network Composition:")
    print(f"  Total nodes: {G.number_of_nodes()}")
    print(f"  Total edges: {G.number_of_edges()}")
    print(f"  Network density: {nx.density(G):.3f}")
    
    # Node type breakdown
    node_types = {}
    for node in G.nodes():
        node_type = G.nodes[node]['type']
        node_types[node_type] = node_types.get(node_type, 0) + 1
    
    print(f"\nNode Distribution:")
    for node_type, count in sorted(node_types.items()):
        print(f"  {node_type.title()}: {count}")
    
    # Top central nodes
    degree_cent = nx.degree_centrality(G)
    top_nodes = sorted(degree_cent.items(), key=lambda x: x[1], reverse=True)[:10]
    
    print(f"\nMost Central Institutions (Degree Centrality):")
    for i, (node, centrality) in enumerate(top_nodes, 1):
        name = G.nodes[node]['name'][:40]
        node_type = G.nodes[node]['type']
        print(f"  {i:2d}. {name} ({node_type}) - {centrality:.3f}")

def main():
    """Main analysis pipeline"""
    print("AI Diagnostic Innovation Network Analysis")
    print("Loading data...")
    data = load_data()
    
    print("Building network...")
    G = build_network(data)
    
    print("Analyzing network metrics...")
    analyze_network_metrics(G)
    
    print("Creating publication-ready visualizations...")
    
    # Generate all figures
    print("  - Main network visualization (Figure 1)...")
    visualize_main_network(G, 'figure1_main_network.png')
    
    print("  - Kenya network (Figure 2)...")
    visualize_country_network(G, data, 'Kenya', 'figure2_kenya_network.png')
    
    print("  - Technology specialization heatmap (Figure 3)...")
    create_technology_specialization_heatmap(data, 'figure3_tech_specialization.png')
    
    print("  - Temporal evolution (Figure 4)...")
    create_temporal_evolution_plot(data, 'figure4_temporal_evolution.png')
    
    print("  - Additional analysis figures...")
    create_funding_analysis(data, 'funding_by_source.png')
    create_disease_focus_analysis(data, 'disease_focus_areas.png')
    
    print("\nAnalysis complete!")
    print("Generated publication-ready figures:")
    print("  - figure1_main_network.png")
    print("  - figure2_kenya_network.png") 
    print("  - figure3_tech_specialization.png")
    print("  - figure4_temporal_evolution.png")
    print("  - funding_by_source.png")
    print("  - disease_focus_areas.png")

if __name__ == "__main__":
    main()    main()    main()