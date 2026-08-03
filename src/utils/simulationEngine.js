export function roundVal(val) {
  return Math.round(val * 100) / 100;
}

export function calculateSimulation(
  cropAllocations,
  sowingShift,
  selectedDistrict,
  baselineAllocations,
  marketPrices,
  cropApy,
  groundwaterData
) {
  let baselineWaterDemandPerHa = 0;
  let simulatedWaterDemandPerHa = 0;

  let baselineRevenuePerHa = 0;
  let simulatedRevenuePerHa = 0;

  const cropColors = {
    'Cotton': '#3b82f6', // blue-500
    'Groundnut': '#6366f1', // indigo-500
    'Wheat': '#8b5cf6', // violet-500
    'Pearl Millet (Bajra)': '#06b6d4' // cyan-500
  };

  const breakdown = [];

  Object.entries(cropAllocations).forEach(([crop, sharePercent]) => {
    const priceMeta = marketPrices[crop] || { water_req_m3_ha: 5000, price_per_kg: 25, mandi_price_per_quintal: 2500 };
    const baseShare = baselineAllocations[crop] || 25;

    const waterPerHa = priceMeta.water_req_m3_ha;
    const shiftEfficiency = 1.0 - (Math.abs(sowingShift) * 0.002);
    
    baselineWaterDemandPerHa += (baseShare / 100.0) * waterPerHa;
    simulatedWaterDemandPerHa += (sharePercent / 100.0) * (waterPerHa * shiftEfficiency);

    const avgYields = { 'Cotton': 680, 'Groundnut': 2150, 'Wheat': 2850, 'Pearl Millet (Bajra)': 1950 };
    const yieldKgHa = avgYields[crop] || 2000;
    const pricePerKg = priceMeta.price_per_kg || 25;

    const grossRevHa = (yieldKgHa * pricePerKg);
    baselineRevenuePerHa += (baseShare / 100.0) * grossRevHa;
    simulatedRevenuePerHa += (sharePercent / 100.0) * grossRevHa;

    breakdown.push({
      name: crop,
      share: sharePercent,
      waterReq: Math.round(waterPerHa * shiftEfficiency),
      mandiPrice: priceMeta.mandi_price_per_quintal || 2500,
      grossRevenue: grossRevHa,
      color: cropColors[crop] || '#0284c7'
    });
  });

  let totalAgriHectares = 0;
  if (selectedDistrict === 'ALL') {
    Object.values(cropApy).forEach(distCrops => {
      Object.values(distCrops).forEach(cMeta => {
        totalAgriHectares += cMeta.area_hectares;
      });
    });
    totalAgriHectares = Math.min(totalAgriHectares, 4200000);
  } else {
    const distCrops = cropApy[selectedDistrict] || {};
    Object.values(distCrops).forEach(cMeta => {
      totalAgriHectares += cMeta.area_hectares;
    });
    if (totalAgriHectares <= 0) totalAgriHectares = 135000;
  }

  const baselineVolumetricMCM = (baselineWaterDemandPerHa * totalAgriHectares) / 1000000.0;
  const simulatedVolumetricMCM = (simulatedWaterDemandPerHa * totalAgriHectares) / 1000000.0;
  const waterSavedMCM = Math.max(0, baselineVolumetricMCM - simulatedVolumetricMCM);
  const waterSavedPercent = baselineVolumetricMCM > 0 ? (waterSavedMCM / baselineVolumetricMCM) * 100.0 : 0;

  const baselineTotalRupees = baselineRevenuePerHa * totalAgriHectares;
  const simulatedTotalRupees = simulatedRevenuePerHa * totalAgriHectares;
  const revenueChangeRupees = simulatedTotalRupees - baselineTotalRupees;
  const revenueChangeCrores = revenueChangeRupees / 10000000.0;
  const revenueChangePercent = baselineTotalRupees > 0 ? (revenueChangeRupees / baselineTotalRupees) * 100.0 : 0;

  const simulatedDistricts = {};
  Object.entries(groundwaterData).forEach(([dist, gw]) => {
    const originalDepth = gw.mean_depth;
    const originalRate = gw.annual_drawdown_rate;

    const reductionRatio = waterSavedPercent / 100.0;
    const newDrawdownRate = Math.max(-0.1, originalRate * (1.0 - reductionRatio * 1.8));

    const simulated5YearDepth = Math.max(2.0, roundVal(originalDepth + newDrawdownRate * 5.0));

    let simCategory = "Safe";
    let simColor = "#10b981"; // emerald-500

    if (simulated5YearDepth > 12.0 || newDrawdownRate > 0.22) {
      simCategory = "Over-Exploited";
      simColor = "#ef4444"; // red-500
    } else if (simulated5YearDepth > 9.5 || newDrawdownRate > 0.12) {
      simCategory = "Critical";
      simColor = "#f97316"; // orange-500
    } else if (simulated5YearDepth > 7.0 || newDrawdownRate > 0.04) {
      simCategory = "Semi-Critical";
      simColor = "#f59e0b"; // amber-500
    }

    simulatedDistricts[dist] = {
      district: dist,
      baseline_depth: originalDepth,
      simulated_depth: simulated5YearDepth,
      simulated_category: simCategory,
      simulated_risk_color: simColor,
      simulated_drawdown_rate: roundVal(newDrawdownRate)
    };
  });

  const baseDist = selectedDistrict === 'ALL' ? groundwaterData['Banaskantha'] : (groundwaterData[selectedDistrict] || groundwaterData['Banaskantha']);
  const startDepth = baseDist ? baseDist.mean_depth : 10.5;
  const baseRate = baseDist ? baseDist.annual_drawdown_rate : 0.18;
  const simRate = Math.max(-0.05, baseRate * (1.0 - (waterSavedPercent / 100.0) * 1.8));

  const trajectoryData = [];
  for (let yr = 2020; yr <= 2035; yr++) {
    const t = yr - 2020;
    const bDepth = roundVal(startDepth + baseRate * t);
    const sDepth = roundVal(startDepth + simRate * t);
    trajectoryData.push({
      year: yr.toString(),
      baselineDepth: bDepth,
      simulatedDepth: sDepth
    });
  }

  return {
    waterSavedMCM: roundVal(waterSavedMCM),
    waterSavedPercent: roundVal(waterSavedPercent),
    revenueChangeCrores: roundVal(revenueChangeCrores),
    revenueChangePercent: roundVal(revenueChangePercent),
    simulatedRevenuePerHa: roundVal(simulatedRevenuePerHa),
    baselineRevenuePerHa: roundVal(baselineRevenuePerHa),
    simulatedDistricts,
    trajectoryData,
    cropValueBreakdown: breakdown
  };
}
