# BASINSHIFT · Challenge Requirements & Design Decisions
**Author:** Technical Data Auditor (Member 1: Model & Training)  
**Date:** November 4, 2026  
**Status:** Frozen Challenge Decisions & Requirements Baseline  
**Authoritative Documents:**
- `BASINSHIFT_Full_Challenge_Documentation.pdf` (Version 1.0 Draft, 3 Nov 2026 — *Challenge Specification*)
- `BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html` (Version 2.0, 4 Nov 2026 — *Authoritative Execution & Team Plan*)

---

## Part 1: Resolution of the Six Open Questions

### Question 1: Dataset Architecture & Hierarchy

| Aspect | Finding & Requirement Resolution | Status Label | Relevant Reference |
| :--- | :--- | :--- | :--- |
| **PDF Primary Candidate Dataset** | The official PDF explicitly identifies **Caravan** as the primary candidate starting point. Caravan standardizes streamflow observations, meteorological forcing (ERA5-Land), and static catchment attributes across thousands of catchments (~6,830 in early releases; up to 22,485 in expanded releases). | **VERIFIED** | PDF Section 6.1 (p. 8), Section 18 (p. 22) |
| **Master Plan Role for Official Package** | The master plan designates the official organizer-provided train/test package as **Tier 1 (The Anchor Dataset)**. It defines the exact ground truth for schema, station IDs, evaluation dates, target units, and test-time column availability. | **VERIFIED** | HTML Master Plan Section 2.1 (p. 64) |
| **Master Plan Role for Caravan** | Caravan is designated as **Tier 2 (Complementary Observed Basins)**. It serves to learn broad hydrologic representations, pretrain models, and establish cross-basin generalization, provided licenses and target units align. | **VERIFIED** | HTML Master Plan Section 2.1 (p. 64) |
| **Can Caravan Be Used When Official Package Is Absent?** | **YES**, Caravan can and should be used as our working prototype dataset while the official package is pending. However, we must explicitly label all pipelines and models as **PROVISIONAL PROTOTYPES** and never represent Caravan as the hidden evaluation package. | **PROVISIONAL DESIGN DECISION** | HTML Notice (p. 12), Section 2.1; PDF Section 1.1 |

---

### Question 2: Geographic & Temporal Scope

| Aspect | Finding & Requirement Resolution | Status Label | Relevant Reference |
| :--- | :--- | :--- | :--- |
| **US-Only Catchments Required?** | **NO**. The PDF does not restrict the benchmark to the United States. It is explicitly titled *"BASINSHIFT: The Global Flood Intelligence Challenge"* and tests generalization across international basin boundaries (including CAMELS-US, CAMELS-AUS, CAMELS-BR, CAMELS-CL, CAMELS-GB, HYSETS, and LamaH-CE). | **VERIFIED** | PDF Title, Section 1 (p. 3), Section 2.1 (p. 4), Section 6.1 |
| **Specific Catchment IDs or Date Ranges Prescribed?** | **NO**. Specific catchment IDs, train/val/test date splits, and temporal spans are **NOT PRESCRIBED** in the draft specification; they require official release by the organizing committee. | **NOT SPECIFIED** | PDF Section 6.1 (p. 8), Section 7.1 (p. 10), Section 17.1 |
| **Data Selection Strategy** | We will adopt a **stratified diversity sampling strategy** rather than arbitrary subsets: select basins covering diverse climate zones (arid, temperate, snow-dominated), varying drainage areas ($10^1$ to $10^5\text{ km}^2$), and distinct geographic regions. Complete continuous historical records will be preserved for each selected basin. | **PROVISIONAL DESIGN DECISION** | HTML Master Plan Section 2.1, Section 3.1; PDF Section 7.3 |

---

### Question 3: Forecast Horizons

| Aspect | Finding & Requirement Resolution | Status Label | Relevant Reference |
| :--- | :--- | :--- | :--- |
| **Are Horizons (1, 3, 7 Days) Officially Frozen?** | **NO**. The PDF explicitly states: *"A provisional set of 1, 3 and 7 days may be explored only if the data support those horizons; it is not a frozen requirement."* | **VERIFIED** | PDF Section 8.1 (p. 11) |
| **Conditions for Exploring Horizons** | We are authorized to use $h \in \{1, 3, 7\}$ days as our internal working baseline, provided our model architecture and feature pipeline treat horizon $h$ as a **configurable parameter** rather than hardcoding array lengths or column names. | **PROVISIONAL DESIGN DECISION** | HTML Master Plan Section 1.5; PDF Section 8.1 |

---

### Question 4: High-Flow & Extreme-Flow Thresholds

| Aspect | Finding & Requirement Resolution | Status Label | Relevant Reference |
| :--- | :--- | :--- | :--- |
| **What the PDF Actually Defines** | The PDF defines the requirement to output two probabilities for each horizon: (1) `high_flow_probability` (exceeding threshold $T(c)$), and (2) `extreme_flow_probability`. However, it explicitly states that exact threshold values require finalization by the organizers. | **VERIFIED** | PDF Section 8.1 (p. 11), Section 8.3 (p. 11) |
| **Are Exact Percentiles or Formulas Specified?** | **NO**. The draft PDF does **NOT** specify exact quantile levels (e.g. 95th vs 99th), return periods (e.g. 2-year vs 5-year flood), or absolute volumetric thresholds. | **NOT SPECIFIED** | PDF Section 8.1, Section 16.2 (p. 20) |
| **Provisional Internal Threshold Rule** | For internal baseline modeling, we will compute catchment-specific empirical percentiles strictly from the **training partition reference period**: **95th percentile** of historical streamflow for `high_flow` and **98th percentile** for `extreme_flow`. These will be clearly documented as PROVISIONAL and never claimed to be official organizer thresholds. | **PROVISIONAL DESIGN DECISION** | HTML Master Plan Section 1.5 (p. 59), Section 3.4; PDF Section 7.2 |

---

### Question 5: Forecasting Inputs & Leakage Constraints

| Aspect | Finding & Requirement Resolution | Status Label | Relevant Reference |
| :--- | :--- | :--- | :--- |
| **Permitted Historical Information at Origin $t$** | Any observed variable up to and including forecast origin timestamp $t$: historical discharge $q(c, \le t)$ (when available), historical meteorological forcing $X_{\text{met}}(c, \le t)$ (precipitation, temperature, radiation, potential evaporation), static attributes $A(c)$, and data quality flags. | **VERIFIED** | PDF Section 8.1–8.2 (p. 11); HTML Section 1.4 |
| **Are Future Observed Weather Values Prohibited?** | **YES, STRICTLY PROHIBITED**. Using future observed weather ($t' > t$) is severe target leakage and disqualifies the submission. | **VERIFIED** | PDF Section 8.2, Section 11.1 (p. 15); HTML Section 3.4 |
| **Does the Specification Provide a Future Weather Forecast Feed?** | **NO**. The PDF notes that meteorological inputs must *"clearly distinguish observed history from forecast inputs"*, but neither the PDF nor the current workspace provides a numerical weather prediction (NWP) forecast feed. All baseline models must operate purely on past observations ($t' \le t$). | **NOT SPECIFIED** | PDF Section 8.2 (p. 11); HTML Section 1.4 |

---

### Question 6: Output & Submission Contract

| Aspect | Finding & Requirement Resolution | Status Label | Relevant Reference |
| :--- | :--- | :--- | :--- |
| **Fields in Illustrative JSON Output** | `catchment_id` (string), `forecast_origin` (ISO timestamp), `forecast_horizons_days` (list of ints), `predicted_discharge` (list of non-negative floats), `high_flow_probability` (list of floats in $[0, 1]$), `extreme_flow_probability` (list of floats in $[0, 1]$), `prediction_intervals`: `lower` and `upper` (lists of floats with $\text{lower} \le \text{upper}$). | **VERIFIED** | PDF Section 8.3 (p. 11); HTML Section 6.2 |
| **Is a Formal Machine-Readable Submission Schema Provided?** | **NO**. The PDF explicitly states: *"The following is a conceptual example only. The organizers must publish a formal JSON Schema or equivalent machine-readable contract..."* | **NOT SPECIFIED** | PDF Section 8.3 (p. 11); HTML Notice (p. 12) |
| **Internal Safe Implementation** | Member 1 will implement a validated tabular/JSON prototype matching the illustrative keys. The output validator will strictly enforce: (1) no NaN/inf, (2) non-negative discharge $\hat{q} \ge 0$, (3) probabilities bounded in $[0, 1]$, (4) interval ordering $\hat{q}_{\text{lower}} \le \hat{q} \le \hat{q}_{\text{upper}}$, and (5) exact alignment with evaluation test IDs. | **PROVISIONAL DESIGN DECISION** | HTML Master Plan Section 5.1, Section 8; PDF Section 8.4 |

---

## Part 2: Project Workspace & Data Verification

A forensic audit of the workspace (`D:\hackathon\basinshift`) and sibling project folders was conducted on November 4, 2026:

```
D:\hackathon\
├── hackoween/
│   ├── BASINSHIFT_Full_Challenge_Documentation.pdf   (Official PDF Specification)
│   └── BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Authoritative Master Plan)
└── basinshift/
    ├── MEMBER1_DATA_AUDIT.md                         (Completed initial audit)
    ├── data/
    │   ├── raw/                                      (Empty — unconfirmed crdownload removed)
    │   └── sample/
    │       └── sample_5_catchments_era5land.nc       (286 KB — verified remote test pull)
```

### Hierarchy Audit Findings:
1. **Tier 1 (Official Train/Test Package):** **ABSENT**. No organizer-provided benchmark files exist in the workspace.
2. **Tier 2 (Caravan Dataset):** **ABSENT LOCALLY**. The full 11.7 GB archive is not downloaded locally.
3. **Existing Source Code:** **NONE**. Pipeline development has been correctly held in inspection mode.
4. **Conclusion:** Real-data model training against an official competition benchmark is currently **blocked**. All modeling work proceeds under **Tier 2 Provisional Prototype** rules using verified remote Caravan samples.

---

## Part 3: Summary of Decision Labels

- **VERIFIED:** 8 critical requirements directly grounded in the official specification and master plan.
- **PROVISIONAL DESIGN DECISIONS:** 5 engineering choices adopted for Member 1 baseline development.
- **NOT SPECIFIED:** 4 operational items awaiting formal organizer release.

