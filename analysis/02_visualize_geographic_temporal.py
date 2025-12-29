"""
Geographic and Temporal Visualizations for N=11 Dataset
Generates publication-ready figures for manuscript

Run from project root:
python analysis/02_visualize_geographic_temporal.py
"""

import os
from datetime import datetime

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns

# Set paths
DATA_DIR = "data/processed"
OUTPUT_DIR = "results/figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("=" * 70)
print("GEOGRAPHIC & TEMPORAL VISUALIZATIONS: N=11 DATASET")
print("=" * 70)

# Load data
print("\n1. LOADING DATA...")
trials = pd.read_csv(f"{DATA_DIR}/trials_N11.csv")
print(f"   ✓ Loaded {len(trials)} trials")

# ============================================================================
# FIGURE 2: GEOGRAPHIC DISTRIBUTION
# ============================================================================

print("\n2. CREATING GEOGRAPHIC DISTRIBUTION FIGURE...")

# Count trials by country
country_counts = trials["country"].value_counts().sort_values(ascending=True)

# Create figure
fig, ax = plt.subplots(figsize=(10, 8))

# Horizontal bar chart
colors = plt.cm.viridis(range(len(country_counts)))
bars = ax.barh(
    range(len(country_counts)), country_counts.values, color=colors, alpha=0.8
)

# Add value labels on bars
for i, (count, bar) in enumerate(zip(country_counts.values, bars)):
    ax.text(
        count + 0.1,
        i,
        str(count),
        va="center",
        ha="left",
        fontweight="bold",
        fontsize=10,
    )

# Styling
ax.set_yticks(range(len(country_counts)))
ax.set_yticklabels(country_counts.index, fontsize=11)
ax.set_xlabel("Number of Registered Trials", fontsize=12, fontweight="bold")
ax.set_title(
    "Geographic Distribution of AI Diagnostic Trials in Sub-Saharan Africa (N=11)",
    fontsize=13,
    fontweight="bold",
    pad=20,
)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.grid(axis="x", alpha=0.3, linestyle="--")

plt.tight_layout()

# Save
output_path = f"{OUTPUT_DIR}/figure_2_geographic.png"
plt.savefig(output_path, dpi=300, bbox_inches="tight", facecolor="white")
print(f"   ✓ {output_path}")

output_pdf = f"{OUTPUT_DIR}/figure_2_geographic.pdf"
plt.savefig(output_pdf, dpi=300, bbox_inches="tight", facecolor="white")
print(f"   ✓ {output_pdf}")

plt.close()

# Print summary
print(f"\n   Geographic Summary:")
print(f"   • Total countries: {len(country_counts)}")
print(f"   • Countries with multiple trials: {sum(country_counts > 1)}")
for country, count in country_counts.items():
    print(f"     - {country}: {count} trial{'s' if count > 1 else ''}")

# ============================================================================
# FIGURE 3: TEMPORAL EVOLUTION (CUMULATIVE)
# ============================================================================

print("\n3. CREATING TEMPORAL EVOLUTION FIGURE...")

# Parse start dates and create year column
trials["start_date_parsed"] = pd.to_datetime(trials["start_date"], errors="coerce")
trials["start_year"] = trials["start_date_parsed"].dt.year

# Remove trials with missing dates
trials_with_dates = trials.dropna(subset=["start_year"])

if len(trials_with_dates) < len(trials):
    print(
        f"   ⚠ Warning: {len(trials) - len(trials_with_dates)} trials missing start dates"
    )

# Count trials by year
yearly_counts = trials_with_dates.groupby("start_year").size().sort_index()

# Calculate cumulative
cumulative_counts = yearly_counts.cumsum()

# Create complete year range (including zeros)
if len(yearly_counts) > 0:
    min_year = int(yearly_counts.index.min())
    max_year = int(yearly_counts.index.max())
    all_years = range(min_year, max_year + 1)

    # Reindex to include all years
    yearly_counts = yearly_counts.reindex(all_years, fill_value=0)
    cumulative_counts = yearly_counts.cumsum()

    # Create figure
    fig, ax = plt.subplots(figsize=(12, 7))

    # Plot cumulative line
    ax.plot(
        cumulative_counts.index,
        cumulative_counts.values,
        marker="o",
        linewidth=2.5,
        markersize=8,
        color="#2E86AB",
        label="Cumulative Trials",
        zorder=3,
    )

    # Add data labels on points
    for year, count in cumulative_counts.items():
        ax.annotate(
            str(int(count)),
            xy=(year, count),
            xytext=(0, 8),
            textcoords="offset points",
            ha="center",
            fontsize=9,
            fontweight="bold",
        )

    # Styling
    ax.set_xlabel("Year", fontsize=12, fontweight="bold")
    ax.set_ylabel(
        "Cumulative Number of Registered Trials", fontsize=12, fontweight="bold"
    )
    ax.set_title(
        "Temporal Evolution of AI Diagnostic Clinical Trials\nin Sub-Saharan Africa (N=11)",
        fontsize=13,
        fontweight="bold",
        pad=20,
    )

    # Set integer ticks on both axes
    ax.set_xticks(all_years)
    ax.set_xticklabels([str(y) for y in all_years], rotation=45)

    # Y-axis integer ticks
    max_trials = int(cumulative_counts.max())
    ax.set_yticks(range(0, max_trials + 2, 1 if max_trials <= 15 else 2))

    # Grid
    ax.grid(True, alpha=0.3, linestyle="--", zorder=0)
    ax.set_axisbelow(True)

    # Add note if trials are missing dates
    if len(trials_with_dates) < len(trials):
        note_text = f"Note: {len(trials) - len(trials_with_dates)} trial(s) excluded due to missing start dates"
        plt.figtext(
            0.5,
            0.02,
            note_text,
            wrap=True,
            horizontalalignment="center",
            fontsize=9,
            style="italic",
        )

    plt.tight_layout()

    # Save
    output_path = f"{OUTPUT_DIR}/figure_3_temporal.png"
    plt.savefig(output_path, dpi=300, bbox_inches="tight", facecolor="white")
    print(f"   ✓ {output_path}")

    output_pdf = f"{OUTPUT_DIR}/figure_3_temporal.pdf"
    plt.savefig(output_pdf, dpi=300, bbox_inches="tight", facecolor="white")
    print(f"   ✓ {output_pdf}")

    plt.close()

    # Print summary
    print(f"\n   Temporal Summary:")
    print(f"   • Year range: {min_year}-{max_year}")
    print(f"   • Trials per year:")
    for year, count in yearly_counts.items():
        print(
            f"     - {int(year)}: {count} new trial{'s' if count > 1 else ''} (cumulative: {int(cumulative_counts[year])})"
        )
else:
    print("   ⚠ Warning: No trials with valid start dates - skipping temporal figure")

# ============================================================================
# SUMMARY STATISTICS
# ============================================================================

print("\n4. DATASET SUMMARY:")
print(f"   • Total trials: {len(trials)}")
print(f"   • Countries represented: {len(country_counts)}")
print(f"   • Trials with start dates: {len(trials_with_dates)}")
if len(trials_with_dates) > 0:
    print(f"   • Earliest trial: {int(trials_with_dates['start_year'].min())}")
    print(f"   • Most recent trial: {int(trials_with_dates['start_year'].max())}")
    print(
        f"   • Years spanned: {int(trials_with_dates['start_year'].max() - trials_with_dates['start_year'].min() + 1)}"
    )

print("\n" + "=" * 70)
print("VISUALIZATIONS COMPLETE!")
print("=" * 70)
print(f"\nFiles created in: {OUTPUT_DIR}/")
print("\nFigures:")
print("  - figure_2_geographic.png/pdf")
print("  - figure_3_temporal.png/pdf")
print("\nReady for manuscript!")
