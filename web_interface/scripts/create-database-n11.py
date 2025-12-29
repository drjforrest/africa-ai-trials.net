#!/usr/bin/env python3
"""
Creates SQLite database from N=11 CSV files
Updated to use the new data structure from data/processed/
"""

import csv
import os
import sqlite3
from datetime import datetime
from pathlib import Path

# Database and CSV file paths
DB_PATH = Path(__file__).parent.parent / "data" / "network.db"
# Point to the main project's data directory
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "processed"


def create_database():
    """Create SQLite database with proper schema"""

    # Ensure data directory exists
    DB_PATH.parent.mkdir(exist_ok=True)

    # Remove existing database
    if DB_PATH.exists():
        DB_PATH.unlink()

    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()

    print(f"Creating database at {DB_PATH}")

    # Create institutions table
    cursor.execute("""
        CREATE TABLE institutions (
            institution_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            country TEXT,
            city TEXT,
            founding_year INTEGER,
            size_category TEXT,
            specialization TEXT,
            website TEXT,
            is_academic BOOLEAN,
            is_healthcare BOOLEAN,
            is_research BOOLEAN,
            international_partnerships BOOLEAN,
            govt_affiliation BOOLEAN,
            sector TEXT
        )
    """)

    # Create clinical trials table
    cursor.execute("""
        CREATE TABLE clinical_trials (
            trial_id TEXT PRIMARY KEY,
            registry_source TEXT,
            title TEXT NOT NULL,
            status TEXT,
            start_date DATE,
            end_date DATE,
            phase TEXT,
            study_design TEXT,
            sample_size INTEGER,
            target_condition TEXT,
            technology_type TEXT,
            primary_institution_id TEXT,
            lead_investigator TEXT,
            country TEXT,
            urban_rural TEXT,
            trial_url TEXT,
            results_published BOOLEAN,
            publication_url TEXT,
            funding_source TEXT,
            secondary_institution_ids TEXT,
            company_partner_ids TEXT,
            ai_algorithm_type TEXT,
            data_source_type TEXT,
            diagnostic_purpose TEXT,
            clinical_integration_type TEXT,
            regulatory_approval TEXT
            -- Note: primary_institution_id may not match institution_id exactly
            -- Foreign key constraint removed to allow flexible mapping
        )
    """)

    # Create relationships table (simplified for N=11 structure)
    cursor.execute("""
        CREATE TABLE relationships (
            relationship_id TEXT PRIMARY KEY,
            entity1_type TEXT,
            entity1_id TEXT,
            entity2_type TEXT,
            entity2_id TEXT,
            relationship_type TEXT,
            start_date DATE,
            end_date DATE,
            strength TEXT,
            funding_amount_usd REAL,
            funding_type TEXT,
            project_focus TEXT,
            technology_transfer BOOLEAN,
            has_personnel_exchange BOOLEAN,
            publication_collaboration BOOLEAN,
            regulatory_collaboration BOOLEAN
        )
    """)

    # Create funding sources table
    cursor.execute("""
        CREATE TABLE funding_sources (
            funding_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            headquarters_country TEXT,
            funder_type TEXT,
            funding_focus TEXT,
            website TEXT
        )
    """)

    # Create funding relationships table
    cursor.execute("""
        CREATE TABLE funding_relationships (
            funding_relationship_id TEXT PRIMARY KEY,
            funder_id TEXT,
            recipient_type TEXT,
            recipient_id TEXT,
            funding_type TEXT,
            start_date DATE,
            end_date DATE,
            FOREIGN KEY (funder_id) REFERENCES funding_sources (funding_id)
        )
    """)

    conn.commit()
    return conn


def import_institutions(conn):
    """Import institutions from N=11 CSV"""
    cursor = conn.cursor()

    csv_path = DATA_DIR / "institutions_N11.csv"

    if not csv_path.exists():
        print(f"Error: {csv_path} not found")
        return

    print(f"Importing institutions from {csv_path}")

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        for row in rows:
            # Map N=11 columns to database schema
            cursor.execute(
                """
                INSERT INTO institutions (
                    institution_id, name, country, sector, type
                ) VALUES (?, ?, ?, ?, ?)
            """,
                (
                    row.get("institution_id", ""),
                    row.get("institution_name", ""),
                    row.get("country", ""),
                    row.get("sector", ""),
                    row.get("institution_type", ""),
                ),
            )

    conn.commit()
    print(f"  -> Inserted {len(rows)} institutions")


def import_trials(conn):
    """Import clinical trials from N=11 CSV"""
    cursor = conn.cursor()

    csv_path = DATA_DIR / "trials_N11.csv"

    if not csv_path.exists():
        print(f"Error: {csv_path} not found")
        return

    print(f"Importing trials from {csv_path}")

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        for row in rows:
            # Convert boolean strings
            results_published = (
                1 if str(row.get("results_published", "0")) == "1" else 0
            )

            cursor.execute(
                """
                INSERT INTO clinical_trials (
                    trial_id, registry_source, title, status, start_date, end_date,
                    phase, study_design, sample_size, target_condition, technology_type,
                    primary_institution_id, country, trial_url, results_published, publication_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    row.get("trial_id", ""),
                    row.get("registry_source", ""),
                    row.get("title", ""),
                    row.get("status", ""),
                    row.get("start_date", ""),
                    row.get("end_date", ""),
                    row.get("phase", ""),
                    row.get("study_design", ""),
                    int(row.get("sample_size", 0)) if row.get("sample_size") else None,
                    row.get("target_condition", ""),
                    row.get("technology_type", ""),
                    row.get("primary_institution_id", ""),
                    row.get("country", ""),
                    row.get("trial_url", ""),
                    results_published,
                    row.get("publication_url", ""),
                ),
            )

    conn.commit()
    print(f"  -> Inserted {len(rows)} trials")


def import_relationships(conn):
    """Import relationships from N=11 edges CSV"""
    cursor = conn.cursor()

    csv_path = DATA_DIR / "edges_N11.csv"

    if not csv_path.exists():
        print(f"Error: {csv_path} not found")
        return

    print(f"Importing relationships from {csv_path}")

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        relationship_id = 1
        for row in rows:
            trial_id = row.get("trial_id", "")
            institution_id = row.get("institution_id", "")
            relationship_type = row.get("relationship_type", "collaboration")

            # Create relationship_id
            rel_id = f"REL_{relationship_id:04d}"
            relationship_id += 1

            cursor.execute(
                """
                INSERT INTO relationships (
                    relationship_id, entity1_type, entity1_id,
                    entity2_type, entity2_id, relationship_type, strength
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    rel_id,
                    "clinical_trial",
                    trial_id,
                    "institution",
                    institution_id,
                    relationship_type,
                    "medium",  # Default strength
                ),
            )

    conn.commit()
    print(f"  -> Inserted {len(rows)} relationships")


def import_funding_sources(conn):
    """Import funding sources from N=11 CSV"""
    cursor = conn.cursor()

    csv_path = DATA_DIR / "funding_sources_N11.csv"

    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping funding sources")
        return

    print(f"Importing funding sources from {csv_path}")

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        for row in rows:
            cursor.execute(
                """
                INSERT INTO funding_sources (
                    funding_id, name, headquarters_country, funder_type
                ) VALUES (?, ?, ?, ?)
            """,
                (
                    row.get("funding_id", ""),
                    row.get("name", ""),
                    row.get("headquarters_country", ""),
                    row.get("funder_type", ""),
                ),
            )

    conn.commit()
    print(f"  -> Inserted {len(rows)} funding sources")


def import_funding_relationships(conn):
    """Import funding relationships from N=11 CSV"""
    cursor = conn.cursor()

    csv_path = DATA_DIR / "funding_relationships_N11.csv"

    if not csv_path.exists():
        print(f"Warning: {csv_path} not found, skipping funding relationships")
        return

    print(f"Importing funding relationships from {csv_path}")

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        for row in rows:
            cursor.execute(
                """
                INSERT INTO funding_relationships (
                    funding_relationship_id, funder_id, recipient_type,
                    recipient_id, funding_type, start_date, end_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    row.get("funding_relationship_id", ""),
                    row.get("funder_id", ""),
                    row.get("recipient_type", ""),
                    row.get("recipient_id", ""),
                    row.get("funding_type", ""),
                    row.get("start_date") or None,
                    row.get("end_date") or None,
                ),
            )

    conn.commit()
    print(f"  -> Inserted {len(rows)} funding relationships")


def create_indexes(conn):
    """Create indexes for better query performance"""
    cursor = conn.cursor()

    indexes = [
        "CREATE INDEX idx_relationships_entity1 ON relationships(entity1_type, entity1_id)",
        "CREATE INDEX idx_relationships_entity2 ON relationships(entity2_type, entity2_id)",
        "CREATE INDEX idx_trials_dates ON clinical_trials(start_date, end_date)",
        "CREATE INDEX idx_institutions_country ON institutions(country)",
        "CREATE INDEX idx_trials_country ON clinical_trials(country)",
        "CREATE INDEX idx_funding_relationships_funder ON funding_relationships(funder_id)",
        "CREATE INDEX idx_funding_relationships_recipient ON funding_relationships(recipient_type, recipient_id)",
    ]

    for index_sql in indexes:
        try:
            cursor.execute(index_sql)
        except sqlite3.Error as e:
            print(f"Warning: Could not create index: {e}")

    conn.commit()


def verify_data(conn):
    """Verify the imported data"""
    cursor = conn.cursor()

    print("\n=== Database Summary ===")

    tables = [
        "institutions",
        "clinical_trials",
        "relationships",
        "funding_sources",
        "funding_relationships",
    ]

    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"{table}: {count} rows")
        except sqlite3.Error:
            print(f"{table}: table does not exist")

    # Check date ranges
    print("\n=== Date Ranges ===")

    cursor.execute(
        "SELECT MIN(start_date), MAX(start_date) FROM clinical_trials WHERE start_date IS NOT NULL"
    )
    trial_dates = cursor.fetchone()
    if trial_dates[0]:
        print(f"Clinical trials: {trial_dates[0]} to {trial_dates[1]}")

    # Country distribution
    print("\n=== Country Distribution ===")
    cursor.execute(
        "SELECT country, COUNT(*) FROM clinical_trials GROUP BY country ORDER BY COUNT(*) DESC"
    )
    countries = cursor.fetchall()
    for country, count in countries:
        print(f"  {country}: {count} trial(s)")


def main():
    """Main function to create database and import N=11 data"""
    print("Creating SQLite database from N=11 CSV files...")
    print(f"Data directory: {DATA_DIR}")

    if not DATA_DIR.exists():
        print(f"Error: Data directory {DATA_DIR} does not exist")
        print("Please ensure the data files are in data/processed/")
        return

    try:
        # Create database and tables
        conn = create_database()

        # Import data in order
        import_institutions(conn)
        import_trials(conn)
        import_relationships(conn)
        import_funding_sources(conn)
        import_funding_relationships(conn)

        # Create indexes
        print("Creating indexes...")
        create_indexes(conn)

        # Verify data
        verify_data(conn)

        print(f"\nDatabase created successfully at: {DB_PATH}")
        print("\nNext steps:")
        print("1. Run: npm run data:update (to process SQLite data)")
        print("2. Start dev server: npm run dev")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()
        raise
    finally:
        if "conn" in locals():
            conn.close()


if __name__ == "__main__":
    main()
