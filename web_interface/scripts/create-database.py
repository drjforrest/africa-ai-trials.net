#!/usr/bin/env python3
"""
Creates SQLite database from CSV files with proper foreign key relationships
"""

import csv
import os
import sqlite3
from pathlib import Path

# Database and CSV file paths
# NOTE: This script is deprecated. Use create-database-n11.py instead.
# Old synthetic data has been moved to archive/old_synthetic_data
DB_PATH = Path(__file__).parent.parent / "data" / "network.db"
CSV_DIR = Path(__file__).parent.parent.parent / "archive" / "old_synthetic_data"


def create_database():
    """Create SQLite database with proper schema and foreign keys"""

    # Ensure data directory exists
    DB_PATH.parent.mkdir(exist_ok=True)

    # Remove existing database
    if DB_PATH.exists():
        DB_PATH.unlink()

    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")  # Enable foreign keys
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
            govt_affiliation BOOLEAN
        )
    """)

    # Create companies table
    cursor.execute("""
        CREATE TABLE companies (
            company_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            founding_year INTEGER,
            headquarters_country TEXT,
            headquarters_city TEXT,
            company_type TEXT,
            primary_focus TEXT,
            funding_stage TEXT,
            website TEXT,
            active_in_countries TEXT,
            primary_technology TEXT,
            parent_company TEXT,
            public_private TEXT
        )
    """)

    # Create funding sources table
    cursor.execute("""
        CREATE TABLE funding_sources (
            funding_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            headquarters_country TEXT,
            funding_focus TEXT,
            website TEXT,
            active_in_africa_since INTEGER,
            primary_funding_mechanism TEXT
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
            regulatory_approval TEXT,
            FOREIGN KEY (primary_institution_id) REFERENCES institutions (institution_id)
        )
    """)

    # Create relationships table
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

    # Create funding relationships table
    cursor.execute("""
        CREATE TABLE funding_relationships (
            funding_relationship_id TEXT PRIMARY KEY,
            funder_id TEXT,
            recipient_type TEXT,
            recipient_id TEXT,
            amount_usd REAL,
            start_date DATE,
            end_date DATE,
            funding_type TEXT,
            project_focus TEXT,
            renewable BOOLEAN,
            multi_year BOOLEAN,
            FOREIGN KEY (funder_id) REFERENCES funding_sources (funding_id)
        )
    """)

    # Create publications table
    cursor.execute("""
        CREATE TABLE publications (
            publication_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            publication_date DATE,
            journal TEXT,
            doi TEXT,
            citation_count INTEGER,
            affiliated_trial_id TEXT,
            lead_author_institution_id TEXT,
            co_author_institution_ids TEXT,
            company_affiliations TEXT,
            keywords TEXT,
            FOREIGN KEY (affiliated_trial_id) REFERENCES clinical_trials (trial_id),
            FOREIGN KEY (lead_author_institution_id) REFERENCES institutions (institution_id)
        )
    """)

    # Create technology transfers table (if file exists)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS technology_transfers (
            transfer_id TEXT PRIMARY KEY,
            source_entity_type TEXT,
            source_entity_id TEXT,
            target_entity_type TEXT,
            target_entity_id TEXT,
            technology_description TEXT,
            transfer_date DATE,
            commercial_value_usd REAL,
            licensing_terms TEXT,
            exclusive BOOLEAN
        )
    """)

    # Create regulatory events table (if file exists)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS regulatory_events (
            event_id TEXT PRIMARY KEY,
            entity_type TEXT,
            entity_id TEXT,
            event_type TEXT,
            event_date DATE,
            regulatory_body TEXT,
            country TEXT,
            outcome TEXT,
            details TEXT
        )
    """)

    conn.commit()
    return conn


def import_csv_data(conn):
    """Import data from CSV files into SQLite database"""

    cursor = conn.cursor()

    # Define CSV file mappings
    csv_mappings = {
        "institutions.csv": "institutions",
        "companies.csv": "companies",
        "funding_sources.csv": "funding_sources",
        "clinical_trials.csv": "clinical_trials",
        "relationships.csv": "relationships",
        "funding_relationships.csv": "funding_relationships",
        "publications.csv": "publications",
        "technology_transfers.csv": "technology_transfers",
        "regulatory_events.csv": "regulatory_events",
    }

    for csv_file, table_name in csv_mappings.items():
        csv_path = CSV_DIR / csv_file

        if not csv_path.exists():
            print(f"Warning: {csv_file} not found, skipping...")
            continue

        print(f"Importing {csv_file} -> {table_name}")

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

            if not rows:
                print(f"Warning: {csv_file} is empty")
                continue

            # Get column names from CSV
            columns = rows[0].keys()

            # Create INSERT statement
            placeholders = ", ".join(["?" for _ in columns])
            insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"

            # Convert data and insert
            data_to_insert = []
            for row in rows:
                # Convert boolean strings to integers for SQLite
                converted_row = []
                for col_name, value in row.items():
                    if value in ("Yes", "True", "true"):
                        converted_row.append(1)
                    elif value in ("No", "False", "false"):
                        converted_row.append(0)
                    elif value == "":
                        converted_row.append(None)
                    else:
                        converted_row.append(value)
                data_to_insert.append(tuple(converted_row))

            try:
                cursor.executemany(insert_sql, data_to_insert)
                print(f"  -> Inserted {len(data_to_insert)} rows")
            except sqlite3.Error as e:
                print(f"  -> Error inserting data: {e}")
                print(
                    f"  -> First row: {data_to_insert[0] if data_to_insert else 'No data'}"
                )

    conn.commit()


def create_indexes(conn):
    """Create indexes for better query performance"""
    cursor = conn.cursor()

    indexes = [
        "CREATE INDEX idx_relationships_entity1 ON relationships(entity1_type, entity1_id)",
        "CREATE INDEX idx_relationships_entity2 ON relationships(entity2_type, entity2_id)",
        "CREATE INDEX idx_relationships_dates ON relationships(start_date, end_date)",
        "CREATE INDEX idx_trials_dates ON clinical_trials(start_date, end_date)",
        "CREATE INDEX idx_funding_dates ON funding_relationships(start_date, end_date)",
        "CREATE INDEX idx_institutions_country ON institutions(country)",
        "CREATE INDEX idx_companies_country ON companies(headquarters_country)",
        "CREATE INDEX idx_trials_country ON clinical_trials(country)",
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
        "companies",
        "funding_sources",
        "clinical_trials",
        "relationships",
        "funding_relationships",
        "publications",
        "technology_transfers",
        "regulatory_events",
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

    # Trial dates
    cursor.execute(
        "SELECT MIN(start_date), MAX(start_date) FROM clinical_trials WHERE start_date IS NOT NULL"
    )
    trial_dates = cursor.fetchone()
    if trial_dates[0]:
        print(f"Clinical trials: {trial_dates[0]} to {trial_dates[1]}")

    # Relationship dates
    cursor.execute(
        "SELECT MIN(start_date), MAX(start_date) FROM relationships WHERE start_date IS NOT NULL"
    )
    rel_dates = cursor.fetchone()
    if rel_dates[0]:
        print(f"Relationships: {rel_dates[0]} to {rel_dates[1]}")

    # Institution founding years (for reference)
    cursor.execute(
        "SELECT MIN(founding_year), MAX(founding_year) FROM institutions WHERE founding_year IS NOT NULL"
    )
    inst_years = cursor.fetchone()
    if inst_years[0]:
        print(f"Institution founding years: {inst_years[0]} to {inst_years[1]}")


def main():
    """Main function to create database and import data"""
    print("Creating SQLite database from CSV files...")

    try:
        # Create database and tables
        conn = create_database()

        # Import CSV data
        import_csv_data(conn)

        # Create indexes
        print("Creating indexes...")
        create_indexes(conn)

        # Verify data
        verify_data(conn)

        print(f"\nDatabase created successfully at: {DB_PATH}")

    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        if "conn" in locals():
            conn.close()


if __name__ == "__main__":
    main()
