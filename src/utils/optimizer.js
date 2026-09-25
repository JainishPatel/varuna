import { calculateSimulation } from './simulationEngine.js';

// Iterates through possible crop splits and micro-irrigation levels
// to find Pareto-optimal frontier scenarios.
export function runOptimization(
  selectedDistrict,
  baselineAllocations,
  marketPrices,
  cropApy,
  groundwaterData,
  microIrrigationAdoption = 0
) {
  const step = 10; // 10% increments for responsive speed
  const scenarios = [];

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

          const shift = 0;

          const results = calculateSimulation(
            allocations,
            shift,
            selectedDistrict,
            baselineAllocations,
            marketPrices,
            cropApy,
            groundwaterData,
            microIrrigationAdoption
          );

          scenarios.push({
            allocations,
            microIrrigationAdoption,
            waterSavedPercent: results.waterSavedPercent,
            revenueChangePercent: results.revenueChangePercent,
            waterSavedMCM: results.waterSavedMCM,
            revenueChangeCrores: results.revenueChangeCrores,
            energySavedMWh: results.energySavedMWh,
            avoidedCarbonTons: results.avoidedCarbonTons,
            costPerM3Saved: results.costPerM3Saved
          });
        }
      }
    }
  }

  const viableScenarios = scenarios.filter(s => s.revenueChangePercent > -20.0);

  // 1. Max Water Conservation (Highest water saved without revenue dropping below -8%)
  const maxWaterList = viableScenarios.filter(s => s.revenueChangePercent >= -8.0)
    .sort((a, b) => b.waterSavedPercent - a.waterSavedPercent);
  const maxWater = maxWaterList.length > 0 ? maxWaterList[0] : scenarios.sort((a, b) => b.waterSavedPercent - a.waterSavedPercent)[0];

  // 2. Max Revenue (Highest revenue)
  const maxRevenueList = viableScenarios.sort((a, b) => b.revenueChangePercent - a.revenueChangePercent);
  const maxRevenue = maxRevenueList.length > 0 ? maxRevenueList[0] : scenarios.sort((a, b) => b.revenueChangePercent - a.revenueChangePercent)[0];

  // 3. Balanced (Highest combined fitness)
  const balancedList = viableScenarios.map(s => {
    const fitness = (s.waterSavedPercent * 1.2) + (s.revenueChangePercent * 1.4);
    return { ...s, fitness };
  }).sort((a, b) => b.fitness - a.fitness);
  const balanced = balancedList.length > 0 ? balancedList[0] : scenarios[0];

  return {
    maxWater,
    maxRevenue,
    balanced
  };
}

// Goal-Seek Reverse Optimizer: Finds the least disruptive crop allocation
// and recommended drip penetration to achieve a target water savings percentage.
export function solveTargetScenario(
  targetWaterPercent = 15,
  selectedDistrict = 'ALL',
  baselineAllocations,
  marketPrices,
  cropApy,
  groundwaterData
) {
  const step = 10;
  const dripLevels = [0, 25, 50, 75];
  let bestScenario = null;
  let bestDisruption = Infinity; // distance from baseline + revenue drop

  dripLevels.forEach(drip => {
    for (let c = 0; c <= 80; c += step) {
      for (let g = 0; g <= 100 - c; g += step) {
        for (let w = 0; w <= 100 - c - g; w += step) {
          const b = 100 - c - g - w;
          if (b >= 0 && b <= 100) {
            const allocations = {
              'Cotton': c,
              'Groundnut': g,
              'Wheat': w,
              'Pearl Millet (Bajra)': b
            };

            const sim = calculateSimulation(
              allocations,
              10, // Default 10-day sowing shift
              selectedDistrict,
              baselineAllocations,
              marketPrices,
              cropApy,
              groundwaterData,
              drip
            );

            // Meets or comes within 1% of the target
            if (sim.waterSavedPercent >= targetWaterPercent - 0.5) {
              // Disruption metric: how far did we shift from baseline crops + revenue loss penalty
              let shiftDist = 0;
              Object.keys(allocations).forEach(crop => {
                shiftDist += Math.abs(allocations[crop] - (baselineAllocations[crop] || 25));
              });
              const revenuePenalty = sim.revenueChangePercent < 0 ? Math.abs(sim.revenueChangePercent) * 2.5 : 0;
              const disruption = shiftDist + revenuePenalty + (drip * 0.2);

              if (disruption < bestDisruption) {
                bestDisruption = disruption;
                bestScenario = {
                  allocations,
                  microIrrigationAdoption: drip,
                  sowingShift: 10,
                  waterSavedPercent: sim.waterSavedPercent,
                  revenueChangePercent: sim.revenueChangePercent,
                  waterSavedMCM: sim.waterSavedMCM,
                  revenueChangeCrores: sim.revenueChangeCrores,
                  energySavedMWh: sim.energySavedMWh,
                  avoidedCarbonTons: sim.avoidedCarbonTons,
                  costPerM3Saved: sim.costPerM3Saved,
                  subsidyPerHectare: sim.subsidyPerHectare
                };
              }
            }
          }
        }
      }
    }
  });

  return bestScenario;
}
