/**
 * Varuna ML Inference Module
 * ==========================
 * Runs trained Random Forest models in the browser by traversing
 * exported JSON decision tree structures. No backend needed.
 */

import cropModelData from '../data/ml_crop_model.json';
import revenueModelData from '../data/ml_revenue_model.json';

// ── Tree Traversal ──

function traverseTree(node, features) {
  if (node.leaf) {
    return node.value;
  }
  const featureVal = features[node.feature];
  if (featureVal <= node.threshold) {
    return traverseTree(node.left, features);
  } else {
    return traverseTree(node.right, features);
  }
}

// ── Crop Recommendation (Classifier) ──

export function predictCrop(districtData) {
  if (!cropModelData || !cropModelData.trees) {
    return null;
  }

  const features = [
    districtData.mean_depth || 8,
    districtData.annual_drawdown_rate || 0.1,
    districtData.pre_monsoon_avg || districtData.mean_depth || 8,
    districtData.post_monsoon_avg || districtData.mean_depth || 8,
  ];

  const classes = cropModelData.classes;
  const nClasses = classes.length;

  // Aggregate votes across all trees
  const totalVotes = new Array(nClasses).fill(0);

  for (const tree of cropModelData.trees) {
    const leafValue = traverseTree(tree, features);
    // leafValue is an array of counts per class
    if (Array.isArray(leafValue)) {
      for (let i = 0; i < nClasses; i++) {
        totalVotes[i] += (leafValue[i] || 0);
      }
    }
  }

  // Normalize to probabilities
  const totalSum = totalVotes.reduce((a, b) => a + b, 0);
  const confidence = {};
  classes.forEach((c, i) => {
    confidence[c] = totalSum > 0 ? Math.round((totalVotes[i] / totalSum) * 1000) / 1000 : 0;
  });

  // Find recommended crop
  let maxProb = 0;
  let recommended = classes[0];
  for (const [crop, prob] of Object.entries(confidence)) {
    if (prob > maxProb) {
      maxProb = prob;
      recommended = crop;
    }
  }

  return {
    recommended,
    confidence,
    modelAccuracy: cropModelData.accuracy,
    featureImportances: cropModelData.feature_importances,
  };
}

// ── Revenue Prediction (Regressor) ──

export function predictRevenue(cropAllocations, sowingShift, districtData) {
  if (!revenueModelData || !revenueModelData.trees) {
    return null;
  }

  const features = [
    cropAllocations['Cotton'] || 0,
    cropAllocations['Groundnut'] || 0,
    cropAllocations['Wheat'] || 0,
    cropAllocations['Pearl Millet (Bajra)'] || 0,
    sowingShift || 0,
    districtData.mean_depth || 8,
    districtData.annual_drawdown_rate || 0.1,
  ];

  // Collect predictions from all trees
  const predictions = [];
  for (const tree of revenueModelData.trees) {
    const val = traverseTree(tree, features);
    predictions.push(typeof val === 'number' ? val : val[0]);
  }

  // Mean prediction
  const predicted = predictions.reduce((a, b) => a + b, 0) / predictions.length;

  // Confidence range from tree variance
  const sorted = [...predictions].sort((a, b) => a - b);
  const low = sorted[Math.floor(sorted.length * 0.1)];
  const high = sorted[Math.floor(sorted.length * 0.9)];

  return {
    predicted: Math.round(predicted),
    range: [Math.round(low), Math.round(high)],
    r2Score: revenueModelData.r2_score,
    mae: revenueModelData.mae,
    featureImportances: revenueModelData.feature_importances,
  };
}

// ── Model Metadata ──

export function getModelMetadata() {
  return {
    crop: {
      type: cropModelData.type,
      nTrees: cropModelData.n_estimators,
      accuracy: cropModelData.accuracy,
      trainingSamples: cropModelData.training_samples,
      featureImportances: cropModelData.feature_importances,
    },
    revenue: {
      type: revenueModelData.type,
      nTrees: revenueModelData.n_estimators,
      r2Score: revenueModelData.r2_score,
      mae: revenueModelData.mae,
      trainingSamples: revenueModelData.training_samples,
      revenueRange: revenueModelData.revenue_range,
      featureImportances: revenueModelData.feature_importances,
    },
  };
}
