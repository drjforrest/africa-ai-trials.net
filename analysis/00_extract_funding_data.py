"""
Extract Funding Sources and Relationships from N=11 Dataset
Creates funding_sources_N11.csv and funding_relationships_N11.csv
"""

import os

import pandas as pd

DATA_DIR = "data/processed"

print("=" * 70)
print("EXTRACTING FUNDING DATA FROM N=11 DATASET")
print("=" * 70)

# Load institutions
print("\n1. Loading institutions...")
institutions = pd.read_csv(f"{DATA_DIR}/institutions_N11.csv")
print(f"   ✓ Loaded {len(institutions)} institutions")

# Extract funding sources (institutions with sector='Funder')
print("\n2. Extracting funding sources...")
funders = institutions[institutions["sector"] == "Funder"].copy()
funders = funders[["institution_id", "institution_name", "country", "sector"]]
funders.columns = ["funding_id", "name", "headquarters_country", "funder_type"]


# Classify funder types
def classify_funder_type(name):
    name_lower = name.lower()
    if "foundation" in name_lower or "philanthrop" in name_lower:
        return "Private Foundation"
    elif (
        "institute" in name_lower
        or "institut" in name_lower
        or "nih" in name_lower
        or "nci" in name_lower
        or "nichd" in name_lower
        or "niams" in name_lower
    ):
        return "Government Agency"
    elif "international" in name_lower or "path" in name_lower or "orbis" in name_lower:
        return "International Organization"
    elif "clinic" in name_lower or "hospital" in name_lower:
        return "Healthcare Institution"
    else:
        return "Other"


funders["funder_type"] = funders["name"].apply(classify_funder_type)

# Save funding sources
output_path = f"{DATA_DIR}/funding_sources_N11.csv"
funders.to_csv(output_path, index=False)
print(f"   ✓ Extracted {len(funders)} funding sources")
print(f"   ✓ Saved to {output_path}")

# Load edges to extract funding relationships
print("\n3. Extracting funding relationships...")
edges = pd.read_csv(f"{DATA_DIR}/edges_N11.csv")

# Filter for funding relationships
funding_edges = edges[edges["relationship_type"] == "funding"].copy()

# Create funding relationships table
funding_rels = []
for idx, row in funding_edges.iterrows():
    funding_rels.append(
        {
            "funding_relationship_id": f"FREL_{idx + 1:03d}",
            "funder_id": row["institution_id"],
            "recipient_type": "clinical_trial",
            "recipient_id": row["trial_id"],
            "funding_type": "Research Grant",  # Default, can be updated
            "start_date": None,  # Not in current data
            "end_date": None,
        }
    )

funding_rels_df = pd.DataFrame(funding_rels)

# Save funding relationships
output_path = f"{DATA_DIR}/funding_relationships_N11.csv"
funding_rels_df.to_csv(output_path, index=False)
print(f"   ✓ Extracted {len(funding_rels_df)} funding relationships")
print(f"   ✓ Saved to {output_path}")

# Summary
print("\n4. SUMMARY:")
print(f"   • Funding sources: {len(funders)}")
print(f"   • Funding relationships: {len(funding_rels_df)}")
print(f"   • Funder types:")
for funder_type, count in funders["funder_type"].value_counts().items():
    print(f"     - {funder_type}: {count}")

print("\n" + "=" * 70)
print("FUNDING DATA EXTRACTION COMPLETE!")
print("=" * 70)
