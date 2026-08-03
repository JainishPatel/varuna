"""
Varuna ML Training Pipeline
============================
Trains two models using the project's groundwater and agricultural data:
  1. Crop Recommendation — Random Forest Classifier
  2. Revenue Prediction  — Random Forest Regressor

Exports trained models as serialized JSON decision trees for browser-side inference.
"""

import json
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score, mean_absolute_error

print("=" * 60)
print("  Varuna ML Training Pipeline")
print("=" * 60)

# ── Paths ──
DATA_DIR = os.path.join("src", "data")
gw = json.load(open(os.path.join(DATA_DIR, "groundwater_summary.json")))
mp = json.load(open(os.path.join(DATA_DIR, "market_prices.json")))
apy = json.load(open(os.path.join(DATA_DIR, "crop_apy.json")))

CROPS = ['Cotton', 'Groundnut', 'Wheat', 'Pearl Millet (Bajra)']
CROP_WATER = {'Cotton': 8500, 'Groundnut': 5500, 'Wheat': 4800, 'Pearl Millet (Bajra)': 2800}

# Real yield ranges and prices (per kg)
CROP_YIELD = {'Cotton': 680, 'Groundnut': 1850, 'Wheat': 2850, 'Pearl Millet (Bajra)': 1950}

def get_price_per_kg(crop):
    if crop in mp:
        return mp[crop].get('price_per_kg', 25)
    return 25

def determine_recommended_crop(mean_depth, drawdown_rate, pre_monsoon, post_monsoon):
    """
    Hydrological rule engine to label optimal crop recommendation:
    - High depth / high drawdown -> Water crisis -> Recommend Bajra (lowest water demand)
    - Moderate-high depth -> Semi-critical -> Recommend Wheat (moderate water requirement)
    - Moderate depth + good post-monsoon recharge -> Recommend Groundnut (balanced cash crop)
    - Low depth + low drawdown -> Water surplus -> Recommend Cotton (high water, high commercial value)
    """
    recharge_delta = pre_monsoon - post_monsoon  # higher positive means good monsoon recharge
    
    if mean_depth > 11.0 or drawdown_rate > 0.15:
        return 'Pearl Millet (Bajra)'
    elif mean_depth > 8.0 or drawdown_rate > 0.08:
        if recharge_delta > 3.0:
            return 'Groundnut'
        else:
            return 'Wheat'
    elif mean_depth <= 6.5 and drawdown_rate <= 0.05:
        return 'Cotton'
    else:
        return 'Groundnut'

# =====================================================
#  MODEL 1: CROP RECOMMENDATION (Random Forest Classifier)
# =====================================================
print("\n-- Model 1: Crop Recommendation Classifier --")

X_crop = []
y_crop = []
crop_label_map = {c: i for i, c in enumerate(CROPS)}

rng = np.random.RandomState(42)

for dist_name, dist_data in gw.items():
    base_depth = dist_data['mean_depth']
    base_drawdown = dist_data['annual_drawdown_rate']
    base_pre = dist_data.get('pre_monsoon_avg', base_depth + 1.5)
    base_post = dist_data.get('post_monsoon_avg', base_depth - 1.5)
    
    # Generate 30 augmented hydrological samples per district
    for _ in range(30):
        d = max(1.5, base_depth + rng.normal(0, 1.8))
        dr = max(-0.05, base_drawdown + rng.normal(0, 0.04))
        pre = max(d, d + rng.uniform(0.5, 3.5))
        post = max(1.0, d - rng.uniform(0.5, 3.0))
        
        target_crop = determine_recommended_crop(d, dr, pre, post)
        label = crop_label_map[target_crop]
        
        X_crop.append([d, dr, pre, post])
        y_crop.append(label)

X_crop = np.array(X_crop)
y_crop = np.array(y_crop)

print(f"  Training samples: {len(X_crop)}")
print(f"  Features: mean_depth, drawdown_rate, pre_monsoon, post_monsoon")
print(f"  Classes: {list(crop_label_map.keys())}")

unique, counts = np.unique(y_crop, return_counts=True)
class_counts = {CROPS[u]: c for u, c in zip(unique, counts)}
print(f"  Class distribution: {class_counts}")

X_train, X_test, y_train, y_test = train_test_split(X_crop, y_crop, test_size=0.2, random_state=42, stratify=y_crop)

clf = RandomForestClassifier(n_estimators=15, max_depth=6, random_state=42, min_samples_leaf=2)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"  Test Accuracy: {acc:.1%}")

importances = clf.feature_importances_
feat_names = ['mean_depth', 'drawdown_rate', 'pre_monsoon', 'post_monsoon']
print(f"  Feature Importances:")
for fn, imp in sorted(zip(feat_names, importances), key=lambda x: -x[1]):
    print(f"    {fn}: {imp:.3f}")


# =====================================================
#  MODEL 2: REVENUE PREDICTION (Random Forest Regressor)
# =====================================================
print("\n-- Model 2: Revenue Prediction Regressor --")

def calculate_realistic_revenue(allocs, shift, depth, drawdown):
    """
    Calculates revenue per hectare based on:
    - Crop acreage mix (%)
    - Crop yields and mandi prices
    - Water stress penalty (deeper groundwater reduces yield of high-water crops)
    - Monsoon sowing shift optimization factor
    """
    rev = 0
    shift_eff = 1.0 - (abs(shift) * 0.0015)  # peak sowing alignment bonus/penalty
    
    # Water stress penalty factor based on depth
    water_stress = 1.0 - max(0, (depth - 8.0) * 0.015)
    
    for crop in CROPS:
        share = allocs.get(crop, 0) / 100.0
        yield_kg = CROP_YIELD[crop]
        price = get_price_per_kg(crop)
        
        # Cotton & Groundnut are more sensitive to water stress
        crop_stress = water_stress if crop in ['Cotton', 'Groundnut'] else 1.0
        
        effective_yield = yield_kg * shift_eff * crop_stress
        rev += share * effective_yield * price
        
    return rev

X_rev = []
y_rev = []

for dist_name, dist_data in gw.items():
    depth = dist_data['mean_depth']
    drawdown = dist_data['annual_drawdown_rate']
    
    for _ in range(160):
        raw = rng.dirichlet([1.2, 1.2, 1.2, 1.2]) * 100
        allocs = {CROPS[i]: round(raw[i], 1) for i in range(4)}
        total = sum(allocs.values())
        allocs = {k: round(v / total * 100, 1) for k, v in allocs.items()}
        
        shift = int(rng.choice([-30, -20, -15, -10, -5, 0, 5, 10, 15, 20, 30]))
        
        rev = calculate_realistic_revenue(allocs, shift, depth, drawdown)
        
        features = [
            allocs['Cotton'],
            allocs['Groundnut'],
            allocs['Wheat'],
            allocs['Pearl Millet (Bajra)'],
            shift,
            depth,
            drawdown,
        ]
        X_rev.append(features)
        y_rev.append(rev)

X_rev = np.array(X_rev)
y_rev = np.array(y_rev)

print(f"  Training samples: {len(X_rev)}")
print(f"  Features: cotton_pct, groundnut_pct, wheat_pct, bajra_pct, sowing_shift, mean_depth, drawdown_rate")
print(f"  Target: revenue_per_ha (Rs.)")
print(f"  Revenue range: Rs.{y_rev.min():.0f} - Rs.{y_rev.max():.0f}")

X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X_rev, y_rev, test_size=0.2, random_state=42)

reg = RandomForestRegressor(n_estimators=15, max_depth=10, random_state=42, min_samples_leaf=4)
reg.fit(X_train_r, y_train_r)

y_pred_r = reg.predict(X_test_r)
r2 = r2_score(y_test_r, y_pred_r)
mae = mean_absolute_error(y_test_r, y_pred_r)
print(f"  R^2 Score: {r2:.4f}")
print(f"  MAE: Rs.{mae:.0f}/ha")

feat_names_r = ['cotton_pct', 'groundnut_pct', 'wheat_pct', 'bajra_pct', 'sowing_shift', 'mean_depth', 'drawdown_rate']
importances_r = reg.feature_importances_
print(f"  Feature Importances:")
for fn, imp in sorted(zip(feat_names_r, importances_r), key=lambda x: -x[1]):
    print(f"    {fn}: {imp:.3f}")


# =====================================================
#  EXPORT MODELS AS JSON
# =====================================================
print("\n-- Exporting Models --")

def tree_to_json(tree, feature_names):
    """Serialize a sklearn DecisionTree to a JSON-compatible dict."""
    t = tree.tree_
    
    def recurse(node_id):
        if t.children_left[node_id] == -1:  # leaf
            values = t.value[node_id]
            if values.ndim == 3:
                # Classifier in sklearn: shape is (1, 1, n_classes)
                return {"leaf": True, "value": values[0][0].tolist()}
            elif values.ndim == 2:
                # Regressor or 2D Classifier: shape is (1, n_classes) or (1, 1)
                return {"leaf": True, "value": values[0].tolist()}
            else:
                return {"leaf": True, "value": float(values.flatten()[0])}
        
        return {
            "leaf": False,
            "feature": int(t.feature[node_id]),
            "feature_name": feature_names[t.feature[node_id]],
            "threshold": round(float(t.threshold[node_id]), 6),
            "left": recurse(int(t.children_left[node_id])),
            "right": recurse(int(t.children_right[node_id]))
        }
    
    return recurse(0)


# Export classifier
crop_model = {
    "type": "RandomForestClassifier",
    "n_estimators": len(clf.estimators_),
    "classes": CROPS,
    "feature_names": feat_names,
    "feature_importances": {fn: round(float(imp), 4) for fn, imp in zip(feat_names, importances)},
    "accuracy": round(float(acc), 4),
    "training_samples": len(X_crop),
    "trees": [tree_to_json(est, feat_names) for est in clf.estimators_]
}

crop_path = os.path.join(DATA_DIR, "ml_crop_model.json")
with open(crop_path, "w") as f:
    json.dump(crop_model, f, indent=2)
print(f"  Crop model saved: {crop_path} ({os.path.getsize(crop_path) / 1024:.0f} KB)")


# Export regressor
rev_model = {
    "type": "RandomForestRegressor",
    "n_estimators": len(reg.estimators_),
    "feature_names": feat_names_r,
    "feature_importances": {fn: round(float(imp), 4) for fn, imp in zip(feat_names_r, importances_r)},
    "r2_score": round(float(r2), 4),
    "mae": round(float(mae), 2),
    "training_samples": len(X_rev),
    "revenue_range": {"min": round(float(y_rev.min()), 2), "max": round(float(y_rev.max()), 2)},
    "trees": [tree_to_json(est, feat_names_r) for est in reg.estimators_]
}

rev_path = os.path.join(DATA_DIR, "ml_revenue_model.json")
with open(rev_path, "w") as f:
    json.dump(rev_model, f, indent=2)
print(f"  Revenue model saved: {rev_path} ({os.path.getsize(rev_path) / 1024:.0f} KB)")

print("\n" + "=" * 60)
print("  Training complete! Models exported to src/data/")
print("=" * 60)
