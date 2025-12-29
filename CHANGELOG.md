# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Network Diagram Visualization**: Updated to match publication figure styling
  - Fixed label positioning (now above nodes instead of below)
  - Added label truncation to 30 characters
  - Refactored node size calculation for consistency
  - Ensured trials use 0.6x size multiplier as per publication
  - Included company nodes as squares (Industry sector)

### Fixed

- **Deploy Script**: Fixed variable escaping in SSH heredoc blocks
  - Escaped `$LOCAL_PORT` variables in remote commands
  - Fixed variable references in final summary output

### Added

- Clean repository structure following scientific project conventions
- Comprehensive documentation (README, data README, analysis README)
- Master analysis pipeline script
- Requirements.txt with all dependencies
- MIT License for code, CC BY 4.0 for data
- .gitignore for Python scientific project

## [1.0.0] - 2024-12-28

### Changed

- Repository refactored for GitHub publication
- Directory structure reorganized:
  - `data/raw/` and `data/processed/` for data files
  - `analysis/` for analysis scripts
  - `results/` for outputs
  - `docs/` for documentation
- Analysis scripts updated with new directory paths
- Results files renamed with publication-ready names

### Removed

- Duplicate and archived files moved to `archive/`
- Old directory structures (kept for reference in archive)

## [0.2.0] - 2024-11-30

### Changed

- Dataset updated from N=12 to N=11 after verification
- Excluded NCT01990274 (non-AI diagnostic trial)
- Updated network statistics and visualizations

### Fixed

- Corrected institutional relationships
- Updated centrality calculations

## [0.1.0] - 2024-10-15

### Added

- Initial dataset (N=12 trials)
- Network analysis scripts
- Basic visualizations
- Data extraction protocols

---

**Note:** This changelog tracks major repository changes. For detailed data version history, see `docs/DATA_EXTRACTION_PROTOCOL.md`.
