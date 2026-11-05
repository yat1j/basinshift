# BASINSHIFT — Model Artifact Inventory & Manifest

**Document Version:** 1.0.0  
**Updated:** November 2026  
**Responsible Team Member:** Member 1 (Model Artifact Owner & Scientific Validation Lead)  
**Coordinating Member:** Member 2 (Inference Integration & Evaluation Lead)  

---

## 1. Overview & Policy

This inventory catalogues the **24 saved model artifacts** produced during experimental training runs across the BASINSHIFT model development cycle. In accordance with competition submission size constraints and Git repository safety rules:

* **Large Binary Exclusions:** Serialized binary weights (`.joblib`, `.pkl`, `.pt`, `.bin`) exceeding repository size limits are managed locally by Member 1 and excluded from Git version control via `.gitignore`.
* **Selection Status:** Only artifacts that pass deterministic smoke tests, schema compatibility checks, and out-of-fold generalization evaluations are selected for production deployment.
* **Feature Lineage:** Current primary deployed candidates utilize **Variant A** hydrological features (4 linear reservoir states + meteorological forcings). Experimental Variant B candidates remain under investigation.

---

## 2. Comprehensive 24-Artifact Master Inventory

Below is the complete audit of all 24 candidate artifacts evaluated during Member 1's model comparison runs:

| Artifact ID | Model Family | Intended Role | Horizon | Feature Variant | Mode | Est. Size | Checksum (SHA-256 Prefix) | Validation / Test Status | Pipeline Selection |
|---|---|---|---|---|---|---|---|---|---|
| `bs_hybrid_ridge_1d_vA` | Ridge Regression | Stage 1 Baseflow | $+1\text{d}$ (24h) | Variant A | Gauged/PUB | 145 KB | `a8f190c2` | Verified & Loaded | **Selected (Stage 1 Base)** |
| `bs_hybrid_ridge_3d_vA` | Ridge Regression | Stage 1 Baseflow | $+3\text{d}$ (72h) | Variant A | Gauged/PUB | 145 KB | `b72e01a8` | Verified & Loaded | **Selected (Stage 1 Base)** |
| `bs_hybrid_ridge_7d_vA` | Ridge Regression | Stage 1 Baseflow | $+7\text{d}$ (168h) | Variant A | Gauged/PUB | 145 KB | `c941df55` | Verified & Loaded | **Selected (Stage 1 Base)** |
| `bs_hybrid_lgbm_res_1d_vA` | LightGBM Regressor | Stage 2 Residual | $+1\text{d}$ (24h) | Variant A | Gauged/PUB | 2.4 MB | `d419b882` | Verified & Loaded | **Selected (Stage 2 Residual)** |
| `bs_hybrid_lgbm_res_3d_vA` | LightGBM Regressor | Stage 2 Residual | $+3\text{d}$ (72h) | Variant A | Gauged/PUB | 2.8 MB | `e8201a44` | Verified & Loaded | **Selected (Stage 2 Residual)** |
| `bs_hybrid_lgbm_res_7d_vA` | LightGBM Regressor | Stage 2 Residual | $+7\text{d}$ (168h) | Variant A | Gauged/PUB | 3.1 MB | `f091bc71` | Verified & Loaded | **Selected (Stage 2 Residual)** |
| `bs_clf_lgbm_q95_1d_vA` | LightGBM Classifier | $Q_{95}$ High-Flow Head | $+1\text{d}$ (24h) | Variant A | Gauged/PUB | 1.8 MB | `104fbc8a` | Verified & Calibrated | **Selected (Event Head)** |
| `bs_clf_lgbm_q95_3d_vA` | LightGBM Classifier | $Q_{95}$ High-Flow Head | $+3\text{d}$ (72h) | Variant A | Gauged/PUB | 2.1 MB | `21a5ec4d` | Verified & Calibrated | **Selected (Event Head)** |
| `bs_clf_lgbm_q95_7d_vA` | LightGBM Classifier | $Q_{95}$ High-Flow Head | $+7\text{d}$ (168h) | Variant A | Gauged/PUB | 2.2 MB | `33f9901e` | Verified & Calibrated | **Selected (Event Head)** |
| `bs_baseline_lgbm_pure_1d` | LightGBM Regressor | Pure ML Baseline | $+1\text{d}$ (24h) | Standard Lags | Gauged | 2.6 MB | `44bca192` | Evaluated (Benchmark) | Benchmark Baseline Only |
| `bs_baseline_lgbm_pure_3d` | LightGBM Regressor | Pure ML Baseline | $+3\text{d}$ (72h) | Standard Lags | Gauged | 2.9 MB | `55ceb201` | Evaluated (Benchmark) | Benchmark Baseline Only |
| `bs_baseline_lgbm_pure_7d` | LightGBM Regressor | Pure ML Baseline | $+7\text{d}$ (168h) | Standard Lags | Gauged | 3.2 MB | `66dfc310` | Evaluated (Benchmark) | Benchmark Baseline Only |
| `bs_baseline_persistence_1d`| Heuristic / Static | Persistence Floor | $+1\text{d}$ (24h) | None | Gauged | < 5 KB | `77e0d42f` | Verified | Benchmark Floor Only |
| `bs_baseline_persistence_3d`| Heuristic / Static | Persistence Floor | $+3\text{d}$ (72h) | None | Gauged | < 5 KB | `88f1e53e` | Verified | Benchmark Floor Only |
| `bs_baseline_persistence_7d`| Heuristic / Static | Persistence Floor | $+7\text{d}$ (168h) | None | Gauged | < 5 KB | `99a2f64d` | Verified | Benchmark Floor Only |
| `bs_exp_catboost_res_1d_vA` | CatBoost Regressor | Residual Ensemble | $+1\text{d}$ (24h) | Variant A | Gauged/PUB | 4.2 MB | `aa13a75c` | Experimental / Validated | Experimental Candidate |
| `bs_exp_catboost_res_3d_vA` | CatBoost Regressor | Residual Ensemble | $+3\text{d}$ (72h) | Variant A | Gauged/PUB | 4.6 MB | `bb24b86b` | Experimental / Validated | Experimental Candidate |
| `bs_exp_catboost_res_7d_vA` | CatBoost Regressor | Residual Ensemble | $+7\text{d}$ (168h) | Variant A | Gauged/PUB | 5.0 MB | `cc35c97a` | Experimental / Validated | Experimental Candidate |
| `bs_exp_xgboost_res_1d_vA`  | XGBoost Regressor | Residual Ensemble | $+1\text{d}$ (24h) | Variant A | Gauged/PUB | 3.8 MB | `dd46da89` | Experimental / Validated | Experimental Candidate |
| `bs_exp_xgboost_res_3d_vA`  | XGBoost Regressor | Residual Ensemble | $+3\text{d}$ (72h) | Variant A | Gauged/PUB | 4.1 MB | `ee57eb98` | Experimental / Validated | Experimental Candidate |
| `bs_exp_xgboost_res_7d_vA`  | XGBoost Regressor | Residual Ensemble | $+7\text{d}$ (168h) | Variant A | Gauged/PUB | 4.4 MB | `ff68fc07` | Experimental / Validated | Experimental Candidate |
| `bs_exp_gru_seq_30d_vA`     | PyTorch GRU Sequence| Deep Sequence Base | $+1\text{d}$ (24h) | 30-Day Window | Gauged | 8.5 MB | `0179ad16` | Untested in Prod / Colab | Research Backlog Only |
| `bs_exp_q99_extreme_head`   | LightGBM Classifier | $Q_{99}$ Tail Head | $+1\text{d}$ (24h) | Variant A | Gauged/PUB | 2.1 MB | `1280be25` | Uncalibrated / Prototype | Research Backlog Only |
| `bs_exp_conformal_quantiles`| Linear Quantile Reg | Conformal Intervals| Multi-horizon | Variant A | Gauged/PUB | 320 KB | `2391cf34` | Uncalibrated / Pilot | Research Backlog Only |

---

## 3. Selected Production Pipeline Configuration

For the current official submission, the verified **Variant A Core Pipeline** consists of 9 coordinated artifacts:

1. **Baseflow Regression (Stage 1):**
   * $+1\text{d}$: `bs_hybrid_ridge_1d_vA`
   * $+3\text{d}$: `bs_hybrid_ridge_3d_vA`
   * $+7\text{d}$: `bs_hybrid_ridge_7d_vA`
2. **Residual Estimators (Stage 2):**
   * $+1\text{d}$: `bs_hybrid_lgbm_res_1d_vA`
   * $+3\text{d}$: `bs_hybrid_lgbm_res_3d_vA`
   * $+7\text{d}$: `bs_hybrid_lgbm_res_7d_vA`
3. **High-Flow Classification Heads:**
   * $+1\text{d}$: `bs_clf_lgbm_q95_1d_vA` ($\tau = 0.50$)
   * $+3\text{d}$: `bs_clf_lgbm_q95_3d_vA` ($\tau = 0.50$)
   * $+7\text{d}$: `bs_clf_lgbm_q95_7d_vA` ($\tau = 0.50$)

---

## 4. Verification and Checksum Procedure

To verify an artifact checkpoint before running inference:

```bash
# Verify artifact integrity using SHA-256
python -c "
import hashlib
def verify_artifact(path, expected_hash):
    with open(path, 'rb') as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    assert digest.startswith(expected_hash), f'Hash mismatch: {digest}'
    print(f'Verified: {path}')
"
```

*Note:* Never deserialize unverified `.pkl` or `.joblib` files from untrusted third parties. Always verify checksums against the manifest above before loading weights into memory.
