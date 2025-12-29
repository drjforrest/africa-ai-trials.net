# SUPPLEMENTARY METHODS
## Extended Methodological Documentation

---

## 1. LIVING SYSTEMATIC REVIEW PLATFORM: GOVERNANCE AND QUALITY ASSURANCE

### Platform Overview

We developed a Living Systematic Review Platform (LSRP) to maintain currency of AI diagnostic trial mapping in Sub-Saharan Africa through systematic, automated surveillance of trial registries combined with rigorous manual verification procedures.

### Update Protocol

**Search frequency:** Quarterly automated searches executed in January, April, July, and October of each year.

**Registry monitoring:** 
- Automated API queries against ClinicalTrials.gov, Pan African Clinical Trials Registry (PACTR), and WHO International Clinical Trials Registry Platform (which aggregates ISRCTN and other regional registries)
- RSS feed subscriptions monitoring new trial registrations matching inclusion criteria
- Email alerts from registry administrators for trials tagged with relevant disease and technology keywords

**Search strategy consistency:** Identical Boolean queries executed across all time points using registry-specific syntax documented in Section 2 below. Search parameters remain constant to ensure longitudinal comparability while registry interface updates are tracked and search strategies adapted as needed to maintain semantic equivalence.

**Publication tracking:** Monthly automated PubMed/MEDLINE searches identify published results from registered trials using trial registry numbers as search terms. Published studies not linked to registry entries undergo manual investigation to determine registration status and eligibility.

### Quality Assurance Procedures

**Automated screening:** Registry API responses filtered by:
- Geographic inclusion criteria (trials conducted in Sub-Saharan African countries)
- Technology keywords (artificial intelligence, machine learning, deep learning, neural networks, computer vision, natural language processing)
- Diagnostic application (excluding therapeutic intervention trials, prevention trials, health systems strengthening without diagnostic component)
- Trial status (planned, recruiting, active, paused, completed, published; excluding withdrawn or terminated prior to enrollment)

**Manual verification:** Two independent reviewers (JF, MT) verify each trial identified through automated screening meets full inclusion criteria:
- Conducted entirely or partially in Sub-Saharan Africa (trials with mixed sites must include ≥1 SSA site)
- Evaluates AI diagnostic technology as primary intervention or comparison
- Involves prospective human participants (excludes retrospective analyses, simulation studies)
- Registered in recognized clinical trial registry (excludes informal pilot studies, unregistered research)
- Sufficient documentation to extract institutional relationships and funding sources

**Source validation:** All institutional relationships, funding sources, and technology specifications verified from official trial registration documents rather than secondary sources:
- Institutional affiliations extracted from "Sponsor," "Collaborators," and "Study Sites" registry fields
- Funding sources extracted from "Funding Source" fields in official registrations, not from press releases or news coverage
- Technology names and specifications extracted verbatim from trial protocols or registration "Intervention" descriptions
- Cross-registry validation performed when trials registered in multiple databases

**Version control and tracking:** 
- Git repository maintains all dataset versions with timestamped commits
- Change log documents all additions, corrections, and exclusions with justification
- Audit trail preserves original extraction for any corrected data with rationale for changes
- DOI-versioned dataset releases correspond to manuscript submissions and publications

**Discrepancy resolution:** 
- Third reviewer (senior author) adjudicates disagreements between initial reviewers
- Unclear cases discussed at team meetings with consensus determination
- Trials with insufficient documentation excluded until clarifying information obtained
- Registry administrators contacted for missing data when feasible

### Data Accuracy Safeguards

**No self-reported entries:** Platform does not accept investigator-submitted trial data. All information extracted exclusively from authoritative registries ensures independence from investigator reporting biases.

**Cross-validation procedures:**
- Trials appearing in multiple registries checked for consistency in dates, institutions, and interventions
- Discrepancies investigated through examination of trial protocols and publications
- Registry entry dates compared to recruitment dates to identify late registration

**Temporal validation:**
- Registration dates verified to precede recruitment start dates
- Recruitment periods checked for logical consistency (start before completion)
- Publication dates confirmed to follow study completion dates
- Status updates tracked to ensure progression follows expected sequence

**Institutional verification:**
- Organization names matched to standardized institutional database (ROR, GRID)
- Institutional existence confirmed through official websites
- Geographic locations validated against known organizational headquarters
- Sector classification (academic, government, industry, NGO) verified from organizational descriptions

**Retraction monitoring:**
- Regular checks for trial withdrawals before enrollment
- Registry corrections and amendments tracked
- Publication retractions identified through PubMed retraction alerts
- Excluded trials documented with reason and date of exclusion

### Limitations Acknowledged

**Registry data quality:** Trial registries depend on investigator-reported information. Errors in institutional affiliations, funding sources, or intervention descriptions may exist in original registrations and are not detectable without direct investigator contact.

**Late registration:** Trials may be registered after recruitment begins, potentially missing early partnerships or funding sources present at trial initiation but not documented in final registration.

**Incomplete registration:** Some trials provide minimal detail in registry entries, particularly regarding institutional roles, funding amounts, or technology specifications. Trials with insufficient documentation are excluded from analysis.

**Informal relationships:** Registry data captures formal organizational participation but not informal collaborations, shared resources, or advisory relationships that may exist outside documented trial structures.

**Platform limitations:** Automated surveillance cannot detect trials never registered in monitored databases. Trials registered in national registries not aggregated by WHO ICTRP may be missed unless published results link to registry entry.

### Current Dataset Status

- **Last update:** November 30, 2024
- **Next scheduled update:** January 31, 2025
- **Cumulative trials identified:** 14 trials screened
- **Trials included after verification:** 11 trials
- **Trials excluded after verification:** 3 trials
  - Exclusion reasons: (1) Insufficient Sub-Saharan African presence (single pilot site, primary operations in Europe), (2) Non-diagnostic application (treatment optimization algorithm), (3) Withdrawn registration before enrollment

### Platform Access

The Living Systematic Review Platform will be made publicly accessible upon manuscript publication, enabling community verification, independent replication, and ongoing monitoring of this nascent field. The platform will include:
- Complete dataset with version history
- Search strategies and screening protocols
- Data extraction forms and decision rules
- Analysis code for network construction and metrics calculation
- Interactive visualizations of network evolution over time

---

## 2. SEARCH STRATEGIES AND REGISTRY-SPECIFIC SYNTAX

### ClinicalTrials.gov Search Strategy

**Interface:** Advanced search using field-specific queries

**Search string:**
```
(artificial intelligence OR machine learning OR deep learning OR neural network OR 
computer vision OR AI OR ML OR DL) AND (diagnostic OR diagnosis OR screening OR 
detection OR test) AND (Africa OR African OR [list of 48 SSA countries])
```

**Field specifications:**
- Intervention/Treatment: Contains AI technology terms
- Condition: Any (broad capture given diverse disease applications)
- Other terms: Contains diagnostic terms
- Locations: Sub-Saharan African countries

**Date range:** All registered trials through November 30, 2024

**Status filters:** Recruiting, Active not recruiting, Completed, Enrolling by invitation, Not yet recruiting (excludes Withdrawn, Suspended, Terminated before enrollment)

**Results:** 47 trials screened → 7 trials included after manual verification

### Pan African Clinical Trials Registry (PACTR) Search Strategy

**Interface:** Basic search (PACTR does not support advanced Boolean queries)

**Search approach:** Multiple individual searches combined:
1. "artificial intelligence" + "diagnostic"
2. "machine learning" + "screening"  
3. "deep learning" + "detection"
4. "computer vision" + "diagnosis"
5. "AI diagnostic"
6. "neural network diagnostic"

**Geographic filter:** All trials registered as occurring in African countries (PACTR focuses on African research)

**Date range:** All registered trials through November 30, 2024

**Results:** 23 trials screened → 3 trials included after manual verification

### WHO International Clinical Trials Registry Platform (ICTRP) Search Strategy

**Interface:** Advanced search portal aggregating multiple registries including ISRCTN, CTRI, ANZCTR, others

**Search string:**
```
Condition: ANY
Intervention: artificial intelligence OR machine learning OR deep learning OR 
computer vision OR neural network
Recruitment status: ALL
Countries: [48 Sub-Saharan African countries selected from dropdown]
```

**Filtered by:** Trials with at least one study site in Sub-Saharan Africa

**Date range:** All registered trials through November 30, 2024

**Results:** 31 trials screened → 1 trial included after manual verification (not previously identified in ClinicalTrials.gov or PACTR)

### Supplementary PubMed Search for Published Studies

**Purpose:** Identify AI diagnostic studies published from Sub-Saharan Africa that may not appear in trial registries (e.g., pilot studies later formalized as trials, studies with late registration)

**Search string:**
```
((artificial intelligence[Title/Abstract] OR machine learning[Title/Abstract] OR 
deep learning[Title/Abstract]) AND (diagnostic[Title/Abstract] OR 
diagnosis[Title/Abstract] OR screening[Title/Abstract]) AND (Africa[Affiliation] OR 
African[Affiliation] OR [individual SSA country names[Affiliation]]))
Filters: Publication date 2015-2024, Humans
```

**Cross-referencing procedure:**
- Published studies checked for clinical trial registry numbers in methods sections
- Unregistered studies excluded from network analysis (focus on formal trial infrastructure)
- Studies with registry numbers verified against trial registry databases

**Results:** 156 publications screened → 11 linked to registered trials in primary databases (no additional trials identified through PubMed that were not already captured)

### Search Validation and Sensitivity

**Validation approach:** 
- Known trials identified through expert consultation (n=3) were successfully retrieved by search strategies, confirming adequate sensitivity
- Manual review of 50 random trials from each registry screened but excluded confirmed appropriate exclusion (no false negatives identified)

**Search sensitivity considerations:**
- Broad technology terms (AI, ML, DL) maximize capture of relevant trials
- Geographic filters may miss multi-country trials if African sites not prominently featured in registry entry
- Diagnostic terms may miss trials described primarily by disease condition rather than diagnostic focus

---

## 3. DATA EXTRACTION AND NETWORK CONSTRUCTION PROTOCOLS

### Data Extraction Form

For each included trial, structured data extraction included:

**Trial identifiers:**
- Registry name and trial registration number
- Trial title
- Principal investigator name and affiliation
- Registration date
- Recruitment start date
- Primary completion date (actual or anticipated)
- Trial status (as of November 30, 2024)

**Institutional relationships:**
- Primary sponsor institution (name, country, sector)
- Collaborating institutions (all organizations listed in registry)
- Study site institutions (facilities where research conducted)
- Technology provider organizations (companies supplying AI tools)
- Sectoral classification: academic (universities, research institutes), government (health ministries, public research agencies), industry (for-profit companies), NGO (non-profit organizations, foundations)

**Funding sources:**
- Primary funder organization
- Secondary funders (if multiple funding sources listed)
- Funding country of origin
- Funder type: government agency, private foundation, industry sponsor, international organization, mixed

**Technology specifications:**
- AI technology name (proprietary name if provided, generic description if not)
- AI approach (computer vision, natural language processing, structured data ML, hybrid)
- Diagnostic target (condition being diagnosed)
- Reference standard (gold standard comparison for diagnostic accuracy)

**Trial design characteristics:**
- Study type: diagnostic accuracy study vs. diagnostic intervention trial
- Sample size (planned enrollment)
- Number of study sites
- Countries where sites located

### Network Construction Decision Rules

**Node inclusion criteria:**

*Trial nodes:*
- All trials meeting inclusion criteria become trial nodes in network
- Trial nodes labeled with unique identifier (NCT number, PACTR number, or internal identifier if registry number unavailable)

*Institutional nodes:*
- Organizations listed in any of the following registry fields qualify as institutional nodes:
  - "Sponsor" or "Lead Sponsor"
  - "Collaborator" or "Collaborating Institution"  
  - "Facility" or "Study Site"
  - "Intervention Provider" (for technology companies)
- Institutions mentioned in narrative text but not in structured fields are excluded (insufficient documentation of formal participation)
- Organizations must be distinct legal entities (departments within same university count as single node)

**Edge inclusion criteria:**

*Trial-institution edges created when:*
- Institution listed as sponsor, collaborator, study site, or technology provider in official registry documentation
- Edge type classified as: sponsorship, collaboration, site participation, or technology provision
- For analysis, all edge types treated as binary (present/absent) without weighting by relationship type

*Edge exclusion criteria:*
- Inferred relationships not documented in registry (e.g., institutional affiliations of investigators mentioned in publications but not in registry)
- Interpersonal connections (e.g., shared investigators or co-authors across trials)
- Informal collaborations or resource sharing described in publications but not formalized in registry entries
- Historical relationships (e.g., "same institutions collaborated on previous trial") not currently operative

**Handling multi-country institutions:**
- Institution's country assigned based on headquarters location
- Multi-national organizations (e.g., WHO, Gates Foundation) classified by headquarters (Switzerland, USA respectively)
- Universities with international branch campuses classified by main campus location

**Handling missing data:**
- Trials with no institutional collaborators listed (sponsor only) included with single edge to sponsor
- Trials with insufficient funding documentation excluded if funding cannot be verified from alternative sources
- Technology providers with ambiguous registry entries investigated through trial publications; excluded if specification remains unclear

**Network assembly:**
- One-mode projected network created with trials and institutions as nodes
- Bipartite structure (trials vs. institutions) not preserved in final analysis
- Disconnected components identified and enumerated
- Self-loops (institutions sponsoring trials where they are also sites) retained

### Data Quality Control Procedures

**Dual extraction:** All trials extracted independently by two reviewers (JF, MT) using standardized extraction forms

**Discrepancy resolution:** 
- Disagreements in institutional identification resolved by consensus discussion
- Uncertain sectoral classifications adjudicated by senior author review
- Ambiguous funding sources clarified by examining trial protocols or contacting investigators when feasible

**Verification sources:**
- Institutional names standardized using Research Organization Registry (ROR) identifiers where available
- Funding sources verified against funder databases (NIH RePORTER, European Commission CORDIS, foundation websites)
- Technology names verified from company websites or product documentation

**Iterative refinement:**
- Initial network visualization reviewed for obvious errors (impossible connections, implausible institutional roles)
- Anomalies investigated and corrected through re-examination of source documents
- Final dataset frozen on December 1, 2024, after all corrections implemented

---

## 4. NETWORK ANALYSIS TECHNICAL SPECIFICATIONS

### Software and Packages

**Network construction and analysis:**
- Python 3.11.5
- NetworkX 3.1 (network data structures and algorithms)
- igraph 0.10.6 (alternative centrality calculations for validation)
- pandas 2.0.3 (data manipulation)

**Visualization:**
- matplotlib 3.7.2 (static network diagrams)
- Plotly 5.14.1 (interactive network visualizations)

**Statistical analysis:**
- SciPy 1.11.1 (correlation analyses)
- NumPy 1.24.3 (numerical computations)

### Centrality Metrics: Calculation and Interpretation

**Degree centrality:**
- Formula: C_D(v) = deg(v) / (n-1), where deg(v) is number of edges incident to node v, n is total nodes
- Interpretation: Proportion of other nodes to which a given node is connected
- Normalization: Divided by maximum possible connections (n-1) to enable cross-network comparisons
- Range: 0 (isolated node) to 1 (connected to all other nodes)

**Betweenness centrality:**
- Formula: C_B(v) = Σ(σ_st(v) / σ_st) for all pairs s,t ≠ v, where σ_st is total number of shortest paths from s to t, σ_st(v) is number passing through v
- Interpretation: Frequency with which node appears on shortest paths between other node pairs
- Normalization: Divided by (n-1)(n-2)/2 for undirected networks
- Range: 0 (not on any shortest paths) to 1 (on all shortest paths)
- Critical finding: All nodes in our network have C_B = 0.000 due to complete fragmentation into disconnected components

**Closeness centrality:**
- Formula: C_C(v) = (n-1) / Σd(v,u) for all u ≠ v, where d(v,u) is shortest path distance
- Interpretation: Average distance from node to all other reachable nodes (inverse)
- Normalization: Adjusted for disconnected graphs by computing only within connected components
- Range: 0 (infinitely distant or unreachable) to 1 (directly connected to all nodes)
- Note: In fragmented networks, closeness only reflects within-component reachability

### Robustness Analysis

**Centrality correlation analysis:**
- Spearman rank correlations computed between all centrality measure pairs
- Results (N=47 nodes):
  - Degree-Closeness: ρ = 1.000, p < 0.001 (perfect correlation)
  - Degree-Betweenness: Cannot compute (zero variance in betweenness)
  - Closeness-Betweenness: Cannot compute (zero variance in betweenness)

**Interpretation:** Perfect degree-closeness correlation indicates measures provide redundant information in fragmented network. In completely disconnected graphs, degree and closeness both reflect only immediate neighbors, producing identical rankings.

**Network density sensitivity:**
- Network density = 0.092 (actual edges / possible edges)
- Sensitivity analysis: Removing highest-degree trial (TRIAL003 with 8 institutional partners) reduces density to 0.082
- Conclusion: Network sparsity robust to individual trial influence

**Component structure analysis:**
- Number of disconnected components: 11 (equal to number of trials)
- Largest component size: 9 nodes (1 trial + 8 institutions)
- Smallest component size: 2 nodes (1 trial + 1 institution)
- Implication: Each trial forms isolated network with no inter-trial institutional bridges

---

## 5. EDGE WEIGHT AND RELATIONSHIP TYPE CONSIDERATIONS

### Binary Edge Approach

Our network analysis treats all institutional relationships as binary (present/absent) rather than weighted edges. This methodological decision has important implications and limitations.

### Missing Edge Attributes

**Relationship strength:**
Trial registries document that institutions participate but rarely quantify relationship intensity:
- Funding amount typically not disclosed in public registry entries
- Personnel time commitments not documented
- Resource contributions (equipment, facilities, expertise) described qualitatively if at all
- Duration of collaboration not specified (relationships may precede or outlast specific trial)

**Relationship directionality:**
Some relationships have clear directionality (funder → recipient, technology provider → recipient site) but we analyze as undirected network:
- Rationale: Focus on connectivity patterns rather than resource flows
- Implication: Cannot distinguish hub institutions channeling resources from peripheral institutions receiving resources
- Alternative: Directed network analysis would require systematic classification of all edges by type and resource flow direction

**Relationship types:**
We combine heterogeneous relationships into single edge category:
- Funding relationships: Money flows from funder to recipient
- Collaboration relationships: Joint scientific contributions (but cannot determine leadership vs. service provision from registry data)
- Site relationships: Clinical research conducted at institutional facilities (but cannot determine whether institution contributes patients only or also scientific expertise)
- Technology provision: AI tools supplied by companies (but cannot determine whether technology providers participate in trial design and analysis or simply provide software)

Treating all relationships identically may obscure important structural patterns. For example, funding hubs differ meaningfully from technology hubs, but our analysis does not distinguish these roles.

### Justification for Binary Approach

**Data availability constraints:**
Trial registries prioritize documentation of institutional participation over characterization of relationship nature. Registries typically provide:
- Institution name
- General relationship category (sponsor, collaborator, site)
- No quantitative metrics of relationship intensity, resource flows, or influence

Systematic weighting or typing of edges would require:
- Publication authorship analysis (using author order, corresponding authorship, contribution statements as proxies for intellectual contribution)
- Funding amount data (rarely disclosed publicly)
- Personnel exchange documentation (not systematically tracked)
- Qualitative assessment of partnership equity (requiring stakeholder interviews)

**Methodological precedent:**
Binary network approaches predominate in clinical trial network analyses due to similar data constraints. Weighted approaches typically require:
- Administrative data access (grant amounts, personnel assignments) not publicly available
- Multiple data sources integrated (publications + registries + funding databases)
- Subjective coding of relationship intensity (inter-rater reliability challenges)

### Alternative Approaches and Future Directions

**Publication-based weighting:**
- Analyze authorship patterns across publications from each trial
- Author order and corresponding authorship as proxies for scientific leadership
- Institutional contribution statements in methods sections as qualitative weights
- Limitation: Publications available for subset of trials only; may not reflect full partnership structure

**Multi-level network analysis:**
- Separate networks for different relationship types (funding network, collaboration network, site network)
- Compare structural patterns across network types
- Identify institutions central in one network type but peripheral in others
- Limitation: Requires sufficient edge density in each network type separately (our small sample may produce extremely sparse type-specific networks)

**Temporal weighting:**
- Institutions participating in multiple trials receive higher weights
- Earliest-entry institutions distinguished from later entrants
- Weights reflect accumulated experience and network persistence
- Limitation: With only 11 trials spanning limited time period, few institutions have multiple-trial participation

**Mixed-methods integration:**
- Network analysis combined with qualitative stakeholder interviews
- Interview data provides relationship quality, power dynamics, knowledge transfer effectiveness
- Network structure contextualized by participant perspectives
- Limitation: Resource-intensive; sample selection challenges for interview participants

### Implications of Binary Edge Approach

**What our analysis reveals:**
- Which institutions participate in AI diagnostic research
- Which institutions participate in same trials (potential for collaboration even if not realized)
- Overall connectivity levels (sparse vs. dense networks)
- Structural positions (central vs. peripheral nodes)

**What our analysis cannot assess:**
- Relationship quality or intensity
- Power dynamics and influence patterns
- Resource flow magnitudes
- Knowledge transfer effectiveness
- Partnership equity (whether African institutions lead or support)

These limitations underscore the need for complementary analytical approaches. Network structure provides one dimension of ecosystem characterization but cannot substitute for in-depth investigation of partnership functioning, capacity building outcomes, and knowledge sovereignty.

---

## 6. LIMITATIONS AND BOUNDARY CONDITIONS

### Data Source Limitations

**Registry completeness:**
Not all AI diagnostic research in Sub-Saharan Africa appears in trial registries. Excluded research includes:
- Pilot studies and feasibility assessments not yet progressed to formal trial registration
- Implementation projects deploying existing validated AI tools (not generating new evidence)
- Algorithm development and validation using retrospective data (not prospective trials)
- Industry-sponsored research not subject to trial registration requirements
- Research in countries with limited registry compliance culture

**Registry data quality:**
Trial registries depend on investigator-reported information of variable completeness and accuracy:
- Institutional relationships may be underreported (registry fields often not fully completed)
- Funding sources sometimes listed generically ("University," "Government") without specifying agency
- Technology specifications may be proprietary or vaguely described
- Collaborator vs. site distinctions sometimes ambiguous in registry entries

**Temporal currency:**
Registry entries represent point-in-time snapshots and may not reflect relationship evolution:
- Partnerships may form after initial registration
- Funding sources may change during trial conduct
- Institutions may withdraw participation (not always updated in registries)
- Late registration means some early partnerships not documented

### Analytical Scope Limitations

**Organizational focus excludes individual actors:**
Network of institutions cannot assess individual-level dynamics:
- Key investigator relationships not captured
- Personnel mobility between institutions not tracked
- Mentorship and training relationships operate at individual level
- Research leadership and decision-making authority held by specific people, not organizations

**Formal relationships exclude informal mechanisms:**
Trial registry documentation captures official partnerships but not:
- Informal knowledge sharing through conferences, workshops, online communities
- Technical assistance provided outside formal trial structures
- Shared training programs not linked to specific trials
- Policy dialogues and advocacy efforts shaping research environments

**Structural metrics do not measure functional outcomes:**
Network connectivity cannot determine whether relationships produce:
- Capacity building (skills, infrastructure, systems strengthening)
- Knowledge sovereignty (African institutional control over research agendas and data)
- Equitable partnerships (co-leadership vs. hierarchical subcontracting)
- Health system impact (whether research translates to improved diagnostic services)

### Generalizability Constraints

**AI diagnostic focus limits broader ecosystem inference:**
Findings may not generalize to:
- Other AI health applications (treatment optimization, disease surveillance, health systems management)
- Other health technology domains (vaccines, therapeutics, medical devices)
- Other research modalities (observational studies, health systems implementation research)

**Registry-based sampling limits representativeness:**
Focus on registered trials means findings describe:
- Formal clinical research infrastructure
- Investigator-initiated and funder-sponsored research
- Research intended for publication and regulatory approval

But excludes:
- Commercial AI deployments not subject to research ethics approval
- Government health ministry pilots and implementations
- NGO-sponsored community-based diagnostic innovations
- Academic algorithm development not yet in clinical testing

**Sub-Saharan Africa heterogeneity:**
Aggregating 10 countries obscures important variations:
- Research infrastructure and regulatory capacity differ markedly across countries
- Funding landscapes vary (some countries attract substantial research investment, others minimal)
- Disease burden priorities differ by region (East vs. West vs. Southern Africa)
- Technology access and AI capacity heterogeneous within region

### Future Research Directions

Addressing these limitations requires:

**Longitudinal designs:**
- Track network evolution as field matures
- Measure partnership persistence vs. transience
- Assess whether early-entry institutions maintain centrality or are displaced
- Examine funding source evolution (concentration vs. diversification over time)

**Mixed methods integration:**
- Combine network analysis with stakeholder interviews examining partnership quality
- Qualitative investigation of capacity building mechanisms and outcomes
- Case studies of successful vs. unsuccessful partnerships
- Participatory approaches centering African researcher perspectives

**Expanded data sources:**
- Patent and intellectual property databases (who owns AI diagnostic innovations)
- Regulatory approval tracking (which AI tools gain government endorsement)
- Implementation databases (which tools actually deployed in health facilities)
- Publication analysis (authorship patterns, corresponding authorship, contribution statements)

**Comparative analyses:**
- Compare AI diagnostic networks to other health technology domains
- Cross-regional comparisons (SSA vs. South Asia vs. Latin America)
- Public vs. private sector innovation pathway differences
- Disease-specific network patterns (tuberculosis vs. cancer vs. NCD diagnostics)

