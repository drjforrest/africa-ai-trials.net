# Data Extraction and Network Construction Protocol

Complete documentation of data extraction procedures, network construction rules, and quality control measures.

---

## Data Extraction Form

### Trial-Level Information

For each included trial, structured extraction of:

**Identifiers:**
- Registry name (ClinicalTrials.gov, PACTR, WHO ICTRP)
- Trial registration number (e.g., NCT12345678, PACTR202012345678901)
- Trial title (full official title from registry)
- Trial acronym (if provided)
- Principal investigator name and primary affiliation

**Temporal Information:**
- Registration date (YYYY-MM-DD)
- Recruitment start date (actual or anticipated)
- Primary completion date (actual or anticipated)
- Trial status as of November 30, 2024

**Study Design:**
- Study type: Diagnostic accuracy study OR Diagnostic intervention trial
- Sample size (planned enrollment)
- Number of study sites
- Countries where sites located
- Single vs. multi-center designation

**Clinical Focus:**
- Target condition (disease being diagnosed)
- Patient population characteristics
- Diagnostic reference standard (gold standard comparison)

**Technology Specifications:**
- AI technology name (proprietary if provided, descriptive if not)
- AI approach: Computer vision, NLP, structured data ML, or hybrid
- Input modality: Image, text, structured data, signal, or multimodal
- Algorithm type: Supervised learning, deep learning, ensemble, etc.

### Institutional Relationships

**Sponsor Institution:**
- Full legal organizational name
- Country of headquarters
- Sector: Academic, Government, Industry, or NGO
- ROR identifier (if available from Research Organization Registry)

**Collaborating Institutions:**
- Full name of each collaborating organization
- Country and sector classification
- Role designation if specified (scientific collaborator vs. administrative support)

**Study Site Institutions:**
- Name of each facility conducting research
- City and country location
- Institution type: Hospital, clinic, university, research institute, community health center

**Technology Provider Organizations:**
- Name of companies supplying AI tools
- Country of origin
- Proprietary vs. open-source technology designation

### Funding Information

**Primary Funder:**
- Full organization name
- Funder type: Government agency, private foundation, industry sponsor, international organization, or mixed
- Country of origin
- Grant/award number if provided

**Secondary Funders:**
- Names of all additional funding sources
- Contribution type if specified (financial vs. in-kind support)

**Funding Transparency:**
- Source verification: Official registry entry, grant database, or funder website
- Amount disclosure: Whether funding amount reported (rarely provided in registries)

---

## Network Construction Rules

### Node Inclusion Criteria

**Trial Nodes:**
- All trials meeting inclusion criteria become nodes
- Node ID: Registry number (NCT, PACTR, ISRCTN)
- Node type: Trial
- Node attributes: Disease, technology, country, year

**Institution Nodes:**
- Organizations qualify as nodes if listed in any of these registry fields:
  - "Lead Sponsor" or "Primary Sponsor"
  - "Collaborator" or "Collaborating Institution"
  - "Study Site" or "Facility Location"
  - "Intervention Provider" (for technology companies)

**Node Exclusion:**
- Organizations mentioned only in narrative text (not structured fields)
- Individuals rather than institutions
- Departments within same university (consolidated to single institutional node)
- Advisory board members not formally participating

### Edge Inclusion Criteria

**Trial-Institution Edges Created When:**
- Institution documented in official registry entry as sponsor, collaborator, site, or technology provider
- Edge type classified as: Sponsorship, Collaboration, Site, or Technology
- All edges treated as binary (present/absent) without weighting

**Edge Exclusion:**
- Inferred relationships not explicitly documented
- Historical collaborations mentioned but not operative for current trial
- Personal connections (shared investigators) without institutional link
- Informal resource sharing described in publications but not in registry

### Multi-Country Institutions

**Headquarters Assignment:**
- Institution country assigned based on headquarters location
- Branch campuses classified by main campus location
- Multi-national organizations:
  - WHO → Switzerland (headquarters)
  - Gates Foundation → USA (headquarters)
  - African CDC → Ethiopia (headquarters)

### Missing Data Handling

**Insufficient Institutional Data:**
- Trials listing only "University" without specific institution excluded
- Generic entries like "Ministry of Health" investigated through trial protocol/publications
- If institutions cannot be verified from any source, trial excluded from analysis

**Ambiguous Roles:**
- If registry unclear whether organization is collaborator vs. site, classified as collaborator (more conservative, acknowledges scientific contribution)
- Technology provider vs. collaborator ambiguity resolved by examining intervention description

**Funding Source Missing:**
- Trials with no funding source listed investigated through:
  1. PI institutional affiliation (possible internal funding)
  2. Published papers from trial (funding acknowledgments)
  3. Grant database searches (NIH RePORTER, European Commission CORDIS)
- If funding truly cannot be determined, trial included but excluded from funding analyses

---

## Quality Control Procedures

### Dual Independent Extraction

**Process:**
1. Two reviewers (JF, MT) independently extract all data
2. Structured extraction form used (Google Sheets template)
3. Each reviewer records data without seeing other's extraction
4. Extractions compared after both complete

**Inter-Rater Reliability:**
- Agreement calculated for categorical variables (institution sector, trial type, disease)
- Discrepancies in continuous variables (dates, sample sizes) flagged for review
- Target: >90% agreement on all variables

### Discrepancy Resolution

**Types of Discrepancies:**
- **Typos/Transcription errors:** Easily resolved by re-checking source
- **Ambiguous registry entries:** Resolved through consensus discussion
- **Sectoral classification disagreements:** Resolved using organizational website
- **Relationship type disagreements:** Senior author adjudication

**Documented Decisions:**
- All ambiguous cases logged in separate document
- Resolution rationale recorded for transparency
- Precedents established for similar future cases

### Source Verification

**Institutional Names:**
- Cross-referenced with Research Organization Registry (ROR)
- Official websites checked to confirm:
  - Legal organizational name
  - Headquarters location
  - Sector classification (academic/government/industry/NGO)
  - Existence and active status

**Funding Sources:**
- Matched to standardized funder databases:
  - NIH RePORTER (US government grants)
  - European Commission CORDIS (EU funding)
  - Gates Foundation grants database
  - Wellcome Trust funding database
- Funder country and type verified from official websites

**Technology Specifications:**
- Product names verified from:
  - Company websites
  - Product documentation
  - FDA/CE mark approvals (if applicable)
  - Published validation studies

### Iterative Refinement

**Network Visualization Review:**
1. Initial network diagram generated with preliminary data
2. Team review identifies obvious anomalies:
   - Implausible connections (e.g., hospital listed as AI technology provider)
   - Missing expected connections (known collaborations not captured)
   - Geographic inconsistencies (wrong country assignments)
3. Anomalies traced back to data extraction
4. Source documents re-examined
5. Corrections made with documented justification

**Final Dataset Freeze:**
- All corrections implemented by November 30, 2024
- Dataset frozen on December 1, 2024
- Post-freeze changes require version update and change log entry

---

## Network Construction Implementation

### Software and Tools

**Data Management:**
- Google Sheets for initial extraction
- CSV export for analysis
- Git version control for all data files

**Network Construction:**
- Python 3.11 with NetworkX 3.1
- Edge list format: source, target, edge_type
- Node attributes stored separately: node_id, name, country, sector, type

### Network Assembly Steps

1. **Load Data:**
   - Read trials CSV
   - Read institutions CSV
   - Read edges CSV

2. **Create Nodes:**
   - Add trial nodes with attributes
   - Add institution nodes with attributes
   - Verify no duplicate nodes (check by registry number for trials, by ROR ID for institutions)

3. **Create Edges:**
   - Add edges from edge list
   - Verify both nodes exist before adding edge
   - Record edge type as attribute
   - Check for self-loops (flag for review if found)

4. **Network Validation:**
   - Check for disconnected components (expected for trial-centric structure)
   - Verify node count matches expected (11 trials + 36 institutions = 47 nodes)
   - Verify edge count matches expected (99 edges)
   - Calculate basic statistics (density, degree distribution)

5. **Export:**
   - Save network as GraphML (preserves attributes)
   - Save adjacency matrix as CSV
   - Save node table with centrality metrics
   - Generate network visualization

### Network Properties Documentation

**Documented for Each Network:**
- Number of nodes (by type: trials, institutions)
- Number of edges (by type: sponsorship, collaboration, site, technology)
- Network density
- Number of connected components
- Diameter (undefined for disconnected networks)
- Average degree
- Degree distribution

---

## Sectoral Classification

### Academic Institutions
Universities, research institutes, medical schools, academic medical centers

**Examples:**
- University of Cape Town
- Makerere University
- Kenya Medical Research Institute (KEMRI)

**Classification Rules:**
- Must have teaching or basic research as primary mission
- Academic medical centers classified as academic (not government) even if publicly funded
- Research institutes affiliated with universities classified as academic

### Government Institutions
Ministries of health, national public health institutes, government hospitals

**Examples:**
- Rwanda Biomedical Centre
- Ethiopian Public Health Institute
- National Institute for Communicable Diseases (South Africa)

**Classification Rules:**
- Direct government ownership and operation
- Not just government-funded (many universities receive government funding but aren't government institutions)
- Distinction from academic institutions: primary mission is service delivery or public health operations, not research/teaching

### Industry/Private Sector
For-profit companies, private hospitals, technology companies

**Examples:**
- Delft Imaging (technology provider)
- Qure.ai (AI company)
- Private diagnostic clinics

**Classification Rules:**
- For-profit ownership structure
- Includes both healthcare delivery and technology companies
- Venture-backed startups classified as industry

### Non-Governmental Organizations (NGOs)
Non-profit organizations, foundations, international organizations

**Examples:**
- Clinton Health Access Initiative (CHAI)
- PATH
- Médecins Sans Frontières

**Classification Rules:**
- Non-profit legal status
- Not government-owned or university-affiliated
- Includes both implementing partners and funding organizations when they directly participate in trials

---

## Geographic Classification

### Country Assignment

**Headquarters Principle:**
- Institution assigned to country of legal headquarters
- Branch offices classified by headquarters location
- Multi-country organizations assigned to headquarters country

**Verification Sources:**
1. Organization's official website ("About" or "Contact" page)
2. Corporate registry databases
3. ROR (Research Organization Registry) country field
4. Trial registry sponsor address field

**Special Cases:**
- **Colonial-era universities:** Assigned to current country, not founding country
- **Regional organizations:** African CDC → Ethiopia (HQ), WHO AFRO → Republic of Congo (HQ)
- **Multi-national companies:** Parent company country (e.g., Philips → Netherlands, not branch office country)

### Sub-Saharan Africa Definition

**Included Countries (48):**
Angola, Benin, Botswana, Burkina Faso, Burundi, Cameroon, Cape Verde, Central African Republic, Chad, Comoros, Democratic Republic of Congo, Republic of Congo, Côte d'Ivoire, Djibouti, Equatorial Guinea, Eritrea, Eswatini, Ethiopia, Gabon, Gambia, Ghana, Guinea, Guinea-Bissau, Kenya, Lesotho, Liberia, Madagascar, Malawi, Mali, Mauritania, Mauritius, Mozambique, Namibia, Niger, Nigeria, Rwanda, São Tomé and Príncipe, Senegal, Seychelles, Sierra Leone, Somalia, South Africa, South Sudan, Sudan, Tanzania, Togo, Uganda, Zambia, Zimbabwe

**Excluded Countries:**
- North Africa: Algeria, Egypt, Libya, Morocco, Tunisia, Western Sahara
- Islands not traditionally part of SSA: Mayotte, Réunion (French territories)

**Rationale:**
- Standard UN classification of Sub-Saharan Africa
- Sahara Desert as geographic boundary
- Includes island nations (Cape Verde, Mauritius, Seychelles, etc.)

---

## Data Format Specifications

### File Formats

**CSV Requirements:**
- UTF-8 encoding
- Comma-separated (not tab or semicolon)
- Headers in first row
- No empty rows
- Consistent NA notation (blank cells for missing data)

**Date Format:**
- ISO 8601: YYYY-MM-DD
- Unknown dates coded as NA, not 00/00/0000

**Text Fields:**
- Double quotes for strings containing commas
- No special characters that require escaping
- Institution names: Official legal names, not acronyms in primary field

### Required Fields

**trials_N11.csv:**
- trial_id (registry number)
- title
- registration_date
- recruitment_start_date
- completion_date
- status
- disease
- technology
- sample_size
- countries (semicolon-separated if multiple)

**institutions_N11.csv:**
- institution_id (ROR ID when available, otherwise generated ID)
- name
- country
- sector (Academic, Government, Industry, NGO)
- ror_id (optional, NA if not available)

**edges_N11.csv:**
- source (trial_id or institution_id)
- target (institution_id)
- edge_type (Sponsorship, Collaboration, Site, Technology)

---

## Change Management

### Version Control

**Git Workflow:**
1. Each extraction round committed separately
2. Commit messages document what changed and why
3. Data corrections tagged with "CORRECTION: [description]"
4. Major dataset changes (N=8→N=11) tagged with version numbers

**Branching Strategy:**
- main: Stable, published dataset versions
- dev: Working branch for updates and corrections
- feature branches: Major changes (e.g., adding new trials)

### Change Documentation

**CHANGELOG.md format:**
```
## [Version] - Date
### Added
- New trials, institutions, or data fields
### Changed
- Corrections to existing data
### Removed
- Excluded trials with rationale
```

**Transparency Principle:**
All data changes documented publicly in version control, not hidden or overwritten.

---

**Document Version:** 1.0
**Last Updated:** December 29, 2024
**Dataset Current Through:** November 30, 2024
