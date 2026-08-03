import { calculateSimulation } from './simulationEngine.js';

// Iterates through all possible crop splits in 5% increments
// and finds the top 3 Pareto-optimal scenarios.
export function runOptimization(
  selectedDistrict,
  baselineAllocations,
  marketPrices,
  cropApy,
  groundwaterData
) {
  const step = 5; // 5% increments
  const scenarios = [];

  // Generate all combinations of C, G, W, B that sum to 100
  for (let c = 0; c <= 100; c += step) {
    for (let g = 0; g <= 100 - c; g += step) {
      for (let w = 0; w <= 100 - c - g; w += step) {
        let b = 100 - c - g - w;
        if (b >= 0 && b <= 100) {
          const allocations = {
            'Cotton': c,
            'Groundnut': g,
            'Wheat': w,
            'Pearl Millet (Bajra)': b
          };

          // Fix the shift at 0 for optimization simplicity, or sweep it too
          // Here we just fix it to 0
          const shift = 0;

          // Run simulation for this allocation
          const results = calculateSimulation(
            allocations,
            shift,
            selectedDistrict,
            baselineAllocations,
            marketPrices,
            cropApy,
            groundwaterData
          );

          scenarios.push({
            allocations,
            waterSavedPercent: results.waterSavedPercent,
            revenueChangePercent: results.revenueChangePercent,
            waterSavedMCM: results.waterSavedMCM,
            revenueChangeCrores: results.revenueChangeCrores
          });
        }
      }
    }
  }

  // Filter out completely unviable scenarios (e.g. massive revenue loss)
  // Let's only consider scenarios where revenue doesn't drop by more than 15%
  const viableScenarios = scenarios.filter(s => s.revenueChangePercent > -15.0);

  // 1. Max Water Conservation (Highest water saved without revenue dropping below -5%)
  const maxWaterList = viableScenarios.filter(s => s.revenueChangePercent >= -5.0)
    .sort((a, b) => b.waterSavedPercent - a.waterSavedPercent);
  const maxWater = maxWaterList.length > 0 ? maxWaterList[0] : scenarios.sort((a, b) => b.waterSavedPercent - a.waterSavedPercent)[0];

  // 2. Max Revenue (Highest revenue)
  const maxRevenueList = viableScenarios.sort((a, b) => b.revenueChangePercent - a.revenueChangePercent);
  const maxRevenue = maxRevenueList.length > 0 ? maxRevenueList[0] : scenarios.sort((a, b) => b.revenueChangePercent - a.revenueChangePercent)[0];

  // 3. Balanced (Highest combined fitness: scaled sum of water and revenue)
  // Normalize variables slightly
  const balancedList = viableScenarios.map(s => {
    // Basic fitness: 1% water saved = 1 point, 1% revenue = 1.5 points
    const fitness = (s.waterSavedPercent * 1.0) + (s.revenueChangePercent * 1.5);
    return { ...s, fitness };
  }).sort((a, b) => b.fitness - a.fitness);
  const balanced = balancedList.length > 0 ? balancedList[0] : scenarios[0];

  return {
    maxWater,
    maxRevenue,
    balanced
  };
}
