import React, { useState, useMemo } from 'react';
import {
  Sprout, Droplets, IndianRupee, Zap, ArrowRight, ShieldCheck,
  TrendingUp, TrendingDown, Scale, Sliders, AlertCircle, Sparkles,
  Layers, CheckCircle2, Info, HelpCircle, ArrowUpRight, Gauge
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, Cell, RadialBarChart, RadialBar, PieChart, Pie
} from 'recharts';

// Crop agronomic & economic database
const CROP_PROFILES = {
  'Cotton': {
    name: 'Bt Cotton',
    waterReqM3Ha: 8500,
    typicalYieldKgHa: 850,
    mandiPricePerKg: 87.74,
    inputCostPerHa: 32000,
    growingDays: 165,
    waterCategory: 'High Water (Heavy Depletion)',
    riskLevel: 'Severe Aquifer Drawdown',
    color: '#ef4444'
  },
  'Groundnut': {
    name: 'Groundnut (Kharif)',
    waterReqM3Ha: 5500,
    typicalYieldKgHa: 2100,
    mandiPricePerKg: 71.06,
    inputCostPerHa: 28000,
    growingDays: 120,
    waterCategory: 'Moderate Water',
    riskLevel: 'Moderate Depletion',
    color: '#f59e0b'
  },
  'Wheat': {
    name: 'Rabi Wheat',
    waterReqM3Ha: 4800,
    typicalYieldKgHa: 1550,
    mandiPricePerKg: 26.16,
    inputCostPerHa: 18000,
    growingDays: 110,
    waterCategory: 'Moderate-High Water',
    riskLevel: 'Winter Aquifer Stress',
    color: '#eab308'
  },
  'Rice (Paddy)': {
    name: 'Common Paddy',
    waterReqM3Ha: 11000,
    typicalYieldKgHa: 2800,
    mandiPricePerKg: 23.56,
    inputCostPerHa: 26000,
    growingDays: 130,
    waterCategory: 'Extremely High Water',
    riskLevel: 'Critical Aquifer Depletion',
    color: '#dc2626'
  },
  'Pearl Millet (Bajra)': {
    name: 'Pearl Millet (Bajra)',
    waterReqM3Ha: 2800,
    typicalYieldKgHa: 680,
    mandiPricePerKg: 23.92,
    mspPerKg: 27.75,
    inputCostPerHa: 9500,
    growingDays: 85,
    waterCategory: 'Drought-Hardy / Low Water',
    riskLevel: 'Aquifer Recharging',
    color: '#10b981'
  },
  'Pulses (Gram)': {
    name: 'Bengal Gram (Chana)',
    waterReqM3Ha: 2500,
    typicalYieldKgHa: 920,
    mandiPricePerKg: 65.76,
    mspPerKg: 58.75,
    inputCostPerHa: 12500,
    growingDays: 95,
    waterCategory: 'Low Water / Nitrogen Fixing',
    riskLevel: 'Soil Restorative',
    color: '#059669'
  },
  'Mustard': {
    name: 'Mustard (Rai)',
    waterReqM3Ha: 3000,
    typicalYieldKgHa: 1400,
    mandiPricePerKg: 74.70,
    mspPerKg: 62.00,
    inputCostPerHa: 13500,
    growingDays: 105,
    waterCategory: 'Low-Medium Water',
    riskLevel: 'Sustainable Winter',
    color: '#14b8a6'
  }
};

export default function CropTransitionLab({
  groundwaterData = {},
  selectedDistrict = 'ALL',
  setSelectedDistrict,
  marketPrices = {},
  cropApy = {},
  onNavigateToSimulate
}) {
  // Farm Profile Interactive State
  const [sourceCrop, setSourceCrop] = useState('Cotton');
  const [targetCrop, setTargetCrop] = useState('Pearl Millet (Bajra)');
  const [farmSizeHa, setFarmSizeHa] = useState(4.0); // hectares
  const [shiftPercent, setShiftPercent] = useState(50); // % of farm shifted
  const [wellDepthMeters, setWellDepthMeters] = useState(38); // tubewell depth
  const [pumpHp, setPumpHp] = useState(7.5); // pump horsepower
  const [useDrip, setUseDrip] = useState(true); // micro-irrigation
  const [tariffMode, setTariffMode] = useState('subsidized'); // 'subsidized' vs 'real'
  const [priceVolatility, setPriceVolatility] = useState(0); // +/- % on target crop price
  const [incentiveBonusPercent, setIncentiveBonusPercent] = useState(15); // +15% incentive above parity

  // District specific depth prefill
  const districtData = selectedDistrict === 'ALL'
    ? { mean_depth: 10.4, annual_drawdown_rate: 0.18, cgwb_category: 'Semi-Critical' }
    : groundwaterData[selectedDistrict] || { mean_depth: 12.0, annual_drawdown_rate: 0.2, cgwb_category: 'Critical' };

  // Adjust depth if district changed and user hasn't overridden dramatically
  React.useEffect(() => {
    if (districtData.mean_depth) {
      setWellDepthMeters(Math.round(districtData.mean_depth * 2.5)); // Tubewell depth is typically 2-3x static depth
    }
  }, [selectedDistrict]);

  // Source & Target Profiles
  const src = CROP_PROFILES[sourceCrop] || CROP_PROFILES['Cotton'];
  const tgt = CROP_PROFILES[targetCrop] || CROP_PROFILES['Pearl Millet (Bajra)'];

  // Calculations
  const shiftedHectares = (farmSizeHa * shiftPercent) / 100;
  const unchangedHectares = farmSizeHa - shiftedHectares;

  // Water calculations (m3)
  const dripEfficiencyMultiplier = useDrip ? 0.65 : 1.0; // Drip saves ~35% water
  const baselineWaterM3 = farmSizeHa * src.waterReqM3Ha;
  const newWaterM3 = (unchangedHectares * src.waterReqM3Ha) +
                     (shiftedHectares * tgt.waterReqM3Ha * dripEfficiencyMultiplier);
  const waterSavedM3 = Math.max(0, baselineWaterM3 - newWaterM3);
  const waterSavedPercent = baselineWaterM3 > 0 ? (waterSavedM3 / baselineWaterM3) * 100 : 0;
  const tankerTrucksSaved = Math.round(waterSavedM3 / 10); // Standard 10,000L tanker

  // Energy & Pumping calculations
  // Energy to pump 1 m3: E (kWh) = (density * g * head) / (3.6e6 * efficiency)
  // Approx ~ 0.0035 kWh per m3 per meter head at 55% pump efficiency
  const kwhPerM3 = (9.81 * wellDepthMeters) / (3600 * 0.55);
  const baselineKwh = baselineWaterM3 * kwhPerM3;
  const newKwh = newWaterM3 * kwhPerM3;
  const energySavedKwh = Math.max(0, baselineKwh - newKwh);

  // Power cost: subsidized (₹0.60/kWh) vs true grid supply cost (₹6.50/kWh)
  const farmerTariffRate = tariffMode === 'subsidized' ? 0.60 : 6.50;
  const utilityCostRate = 6.50;
  const farmerPowerSavedRs = energySavedKwh * farmerTariffRate;
  const statePowerSubsidySavedRs = energySavedKwh * (utilityCostRate - 0.60);
  const avoidedCo2Kg = energySavedKwh * 0.82; // Indian grid factor ~ 0.82 kg CO2/kWh

  // Revenue & Economic calculations
  const effectiveTgtPrice = tgt.mandiPricePerKg * (1 + priceVolatility / 100);

  // Status Quo Financials (Full farm in Source Crop)
  const baselineGrossPerHa = src.typicalYieldKgHa * src.mandiPricePerKg;
  const baselineNetPerHa = baselineGrossPerHa - src.inputCostPerHa - (src.waterReqM3Ha * kwhPerM3 * farmerTariffRate);
  const baselineTotalNetFarmIncome = baselineNetPerHa * farmSizeHa;

  // Transition Financials
  const srcNetPerHa = baselineNetPerHa;
  const tgtGrossPerHa = tgt.typicalYieldKgHa * effectiveTgtPrice;
  const tgtNetPerHa = tgtGrossPerHa - tgt.inputCostPerHa - (tgt.waterReqM3Ha * dripEfficiencyMultiplier * kwhPerM3 * farmerTariffRate);

  const transitionNetFarmIncome = (unchangedHectares * srcNetPerHa) + (shiftedHectares * tgtNetPerHa);
  const rawIncomeGap = baselineTotalNetFarmIncome - transitionNetFarmIncome;

  // Recommended Varuna Green Transition Incentive Subsidy
  // 1. Guaranteed Income Parity: covers 100% of any per-hectare profit shortfall
  const perHectareParityGap = Math.max(0, srcNetPerHa - tgtNetPerHa);

  // 2. Ecological Stewardship Grant:
  // Even when the target crop is profitable, farmers bear transition friction, learning curves,
  // and agronomic adoption risks. Meanwhile, the state avoids heavy GUVNL power subsidies (~₹5.90/kWh).
  // The state dedicates an aquifer stewardship grant (sharing ~25% of power subsidy savings or min ₹3,500/ha floor),
  // dynamically amplified by the farmer adoption bonus slider.
  const waterSavedPerShiftedHa = Math.max(0, src.waterReqM3Ha - (tgt.waterReqM3Ha * dripEfficiencyMultiplier));
  const kwhSavedPerShiftedHa = waterSavedPerShiftedHa * kwhPerM3;
  const powerSubsidySavedPerShiftedHa = kwhSavedPerShiftedHa * (utilityCostRate - 0.60);

  const baseStewardshipGrantPerHa = Math.max(3500, Math.round(powerSubsidySavedPerShiftedHa * 0.25));
  const stewardshipIncentivePerHa = Math.round(baseStewardshipGrantPerHa * (1 + incentiveBonusPercent / 100));

  // Total Recommended DBT Subsidy per Hectare shifted
  const recommendedIncentivePerHa = perHectareParityGap + stewardshipIncentivePerHa;
  const totalFarmSubsidyRs = shiftedHectares > 0 ? recommendedIncentivePerHa * shiftedHectares : 0;

  const finalNetFarmIncomeWithSubsidy = transitionNetFarmIncome + totalFarmSubsidyRs;
  const netFarmerGainVsBaseline = finalNetFarmIncomeWithSubsidy - baselineTotalNetFarmIncome;

  // Chart data for visual comparison
  const financialChartData = [
    {
      category: 'Status Quo',
      'Gross Revenue': Math.round((baselineGrossPerHa * farmSizeHa) / 1000),
      'Input & Power Cost': Math.round(((src.inputCostPerHa + (src.waterReqM3Ha * kwhPerM3 * farmerTariffRate)) * farmSizeHa) / 1000),
      'Net Profit': Math.round(baselineTotalNetFarmIncome / 1000),
    },
    {
      category: 'Shift (Raw)',
      'Gross Revenue': Math.round(((src.typicalYieldKgHa * src.mandiPricePerKg * unchangedHectares) + (tgtGrossPerHa * shiftedHectares)) / 1000),
      'Input & Power Cost': Math.round((((src.inputCostPerHa + (src.waterReqM3Ha * kwhPerM3 * farmerTariffRate)) * unchangedHectares) +
        ((tgt.inputCostPerHa + (tgt.waterReqM3Ha * dripEfficiencyMultiplier * kwhPerM3 * farmerTariffRate)) * shiftedHectares)) / 1000),
      'Net Profit': Math.round(transitionNetFarmIncome / 1000),
    },
    {
      category: 'With Varuna DBT',
      'Gross Revenue': Math.round((((src.typicalYieldKgHa * src.mandiPricePerKg * unchangedHectares) + (tgtGrossPerHa * shiftedHectares)) + totalFarmSubsidyRs) / 1000),
      'Input & Power Cost': Math.round((((src.inputCostPerHa + (src.waterReqM3Ha * kwhPerM3 * farmerTariffRate)) * unchangedHectares) +
        ((tgt.inputCostPerHa + (tgt.waterReqM3Ha * dripEfficiencyMultiplier * kwhPerM3 * farmerTariffRate)) * shiftedHectares)) / 1000),
      'Net Profit': Math.round(finalNetFarmIncomeWithSubsidy / 1000),
    }
  ];

  return (
    <div className="crop-lab-container">
      {/* ───── Hero Banner ───── */}
      <div className="v-card crop-lab-hero">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="v-badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                FARMER ECONOMICS SANDBOX
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {selectedDistrict === 'ALL' ? 'Statewide Gujarat' : `${selectedDistrict} Basin`}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Crop Transition & Farmer Incentive Lab
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Calculate exact farm-level water savings, energy reductions, and the precise Direct Benefit
              Transfer (DBT) subsidy needed to keep farmers profitable when transitioning to drought-resilient crops.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToSimulate && (
              <button
                onClick={onNavigateToSimulate}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <span>Launch Macro Simulator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ───── Top KPI Row: The Grand Equation ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* KPI 1: Water Saved */}
        <div className="stat-card water">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-600" /> Net Water Saved
            </span>
            <span className="v-badge bg-sky-100 text-sky-800 border border-sky-300 font-bold">
              -{waterSavedPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-sky-950 tabular-nums">
            {(waterSavedM3 / 1000).toFixed(1)} <span className="text-sm font-semibold text-slate-600">Thousand m³</span>
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2 flex items-center gap-1">
            <span>≈ <strong>{tankerTrucksSaved.toLocaleString()}</strong> Tankers (10,000 L)</span>
          </div>
        </div>

        {/* KPI 2: Energy & Carbon Saved */}
        <div className="stat-card neutral">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" /> Grid Power Saved
            </span>
            <span className="v-badge bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold">
              {(avoidedCo2Kg / 1000).toFixed(1)}t CO₂
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-indigo-950 tabular-nums">
            {Math.round(energySavedKwh).toLocaleString()} <span className="text-sm font-semibold text-slate-600">kWh/yr</span>
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2">
            Saves state ₹<strong>{Math.round(statePowerSubsidySavedRs).toLocaleString()}</strong> in power subsidy
          </div>
        </div>

        {/* KPI 3: Required Transition Incentive */}
        <div className="stat-card revenue">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" /> Varuna DBT Subsidy
            </span>
            <span className="v-badge bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              +{incentiveBonusPercent}% Bonus
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-950 tabular-nums">
            ₹{Math.round(recommendedIncentivePerHa).toLocaleString()} <span className="text-sm font-semibold text-slate-600">/ Ha</span>
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2">
            Total payout: ₹<strong>{Math.round(totalFarmSubsidyRs).toLocaleString()}</strong> for {shiftedHectares.toFixed(1)} Ha
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
            {perHectareParityGap > 0
              ? `Parity deficit (₹${Math.round(perHectareParityGap).toLocaleString()}) + Eco grant (₹${Math.round(stewardshipIncentivePerHa).toLocaleString()})`
              : `Aquifer stewardship & adoption grant (Zero parity deficit)`}
          </div>
        </div>

        {/* KPI 4: Final Farmer Net Profit */}
        <div className="stat-card">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" /> Farmer Final Net Income
            </span>
            <span className="v-badge bg-teal-100 text-teal-800 border border-teal-300 font-bold">
              +{netFarmerGainVsBaseline >= 0 ? '+' : ''}{Math.round(netFarmerGainVsBaseline).toLocaleString()} ₹
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-slate-900 tabular-nums">
            ₹{Math.round(finalNetFarmIncomeWithSubsidy).toLocaleString()}
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2">
            Vs Baseline: ₹{Math.round(baselineTotalNetFarmIncome).toLocaleString()} (Guaranteed Parity)
          </div>
        </div>
      </div>

      {/* ───── Main Interactive Workspace ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* ───── Left 7 Cols: Interactive Controls & Configuration ───── */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Card 1: Farm & Crop Configuration */}
          <div className="v-card p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Step 1: Configure Farm & Crop Swap
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">Live Simulation</span>
            </div>

            {/* Crop Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {/* Source Crop */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <label className="text-xs font-bold text-rose-900 block mb-1.5 uppercase tracking-wider">
                  Current High-Water Crop (Source)
                </label>
                <select
                  value={sourceCrop}
                  onChange={(e) => setSourceCrop(e.target.value)}
                  className="w-full bg-white border border-rose-300 text-slate-900 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Cotton">Bt Cotton (8,500 m³/Ha)</option>
                  <option value="Groundnut">Groundnut (5,500 m³/Ha)</option>
                  <option value="Wheat">Rabi Wheat (4,800 m³/Ha)</option>
                  <option value="Rice (Paddy)">Rice / Paddy (11,000 m³/Ha)</option>
                </select>
                <div className="mt-2 text-xs text-rose-800 font-medium flex justify-between">
                  <span>Water: <strong>{src.waterReqM3Ha.toLocaleString()} m³/Ha</strong></span>
                  <span>Yield: <strong>{src.typicalYieldKgHa} kg/Ha</strong></span>
                </div>
              </div>

              {/* Target Crop */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <label className="text-xs font-bold text-emerald-900 block mb-1.5 uppercase tracking-wider">
                  Target Drought-Resilient Crop
                </label>
                <select
                  value={targetCrop}
                  onChange={(e) => setTargetCrop(e.target.value)}
                  className="w-full bg-white border border-emerald-300 text-slate-900 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Pearl Millet (Bajra)">Pearl Millet / Bajra (2,800 m³/Ha)</option>
                  <option value="Pulses (Gram)">Bengal Gram / Pulses (2,500 m³/Ha)</option>
                  <option value="Mustard">Mustard / Oilseeds (3,000 m³/Ha)</option>
                </select>
                <div className="mt-2 text-xs text-emerald-800 font-medium flex justify-between">
                  <span>Water: <strong>{tgt.waterReqM3Ha.toLocaleString()} m³/Ha</strong></span>
                  <span>Saves: <strong>{Math.round(((src.waterReqM3Ha - tgt.waterReqM3Ha) / src.waterReqM3Ha) * 100)}% Water</strong></span>
                </div>
              </div>
            </div>

            {/* Sliders: Farm Size & Acreage Shift */}
            <div className="flex flex-col gap-5">
              {/* Farm Size */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Total Farm Landholding</span>
                  <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {farmSizeHa.toFixed(1)} Hectares ({Math.round(farmSizeHa * 2.47)} Acres)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={farmSizeHa}
                  onChange={(e) => setFarmSizeHa(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 font-medium mt-1">
                  <span>1 Ha (Smallholder)</span>
                  <span>4 Ha (Median Gujarat Farm)</span>
                  <span>20 Ha (Large Commercial)</span>
                </div>
              </div>

              {/* Acreage Shift Percentage */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Acreage Shifted to {tgt.name}</span>
                  <span className="text-sm font-extrabold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                    {shiftPercent}% ({shiftedHectares.toFixed(1)} Ha Shifted)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={shiftPercent}
                  onChange={(e) => setShiftPercent(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 font-medium mt-1">
                  <span>0% (Status Quo)</span>
                  <span>50% (Recommended Diversification)</span>
                  <span>100% (Complete Transition)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Aquifer & Pumping Parameters */}
          <div className="v-card p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Step 2: Aquifer Depth & Energy Configuration
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">Hydro-Power Physics</span>
            </div>

            <div className="flex flex-col gap-5">
              {/* Tubewell Depth Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Tubewell Operating Depth</span>
                  <span className="text-sm font-extrabold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {wellDepthMeters} Meters ({Math.round(wellDepthMeters * 3.28)} Feet)
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="2"
                  value={wellDepthMeters}
                  onChange={(e) => setWellDepthMeters(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 font-medium mt-1">
                  <span>10m (Coastal / Safe)</span>
                  <span>40m (North Gujarat Avg)</span>
                  <span>120m (Over-Exploited Bedrock)</span>
                </div>
              </div>

              {/* Toggles: Drip Irrigation & Tariff Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Drip Irrigation Toggle */}
                <div
                  onClick={() => setUseDrip(!useDrip)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    useDrip
                      ? 'bg-sky-50 border-sky-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Drip / Micro-Irrigation</span>
                    <span className={`v-badge font-bold ${useDrip ? 'bg-sky-200 text-sky-900' : 'bg-slate-200 text-slate-700'}`}>
                      {useDrip ? 'ACTIVE (+35% EFF)' : 'FLOOD / FURROW'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Reduces evaporation and percolation losses. Cuts required volumetric water by 35%.
                  </p>
                </div>

                {/* Tariff Mode Toggle */}
                <div
                  onClick={() => setTariffMode(tariffMode === 'subsidized' ? 'real' : 'subsidized')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    tariffMode === 'real'
                      ? 'bg-amber-50 border-amber-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Electricity Tariff Rate</span>
                    <span className={`v-badge font-bold ${tariffMode === 'real' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                      {tariffMode === 'real' ? 'REAL (₹6.50/kWh)' : 'SUBSIDIZED (₹0.60/kWh)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Switch between farmer billing rate and state discom generation cost to test economic distortion.
                  </p>
                </div>
              </div>

              {/* Incentive Bonus Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">
                    Aquifer Stewardship DBT Incentive Bonus
                  </span>
                  <span className="text-sm font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                    +{incentiveBonusPercent}% Premium
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="5"
                  value={incentiveBonusPercent}
                  onChange={(e) => setIncentiveBonusPercent(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 font-medium mt-1">
                  <span>0% (Base Grant)</span>
                  <span>15% (Recommended Adoption Incentive)</span>
                  <span>35% (Aggressive Conversion)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───── Right 5 Cols: Financial Ledger & Comparative Analysis ───── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Card: Financial Ledger Comparison */}
          <div className="v-card p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Annual Farm Ledger Breakdown
                </h2>
              </div>
              <span className="v-badge bg-slate-100 text-slate-700 font-bold">Per Farm/Yr</span>
            </div>

            {/* Income Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <th className="py-2 text-left font-bold">Metric</th>
                    <th className="py-2 text-right font-bold">Status Quo</th>
                    <th className="py-2 text-right font-bold text-emerald-700">With Varuna</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 text-slate-700 font-medium">Gross Crop Sales</td>
                    <td className="py-2 text-right text-slate-900 font-bold">₹{Math.round(baselineGrossPerHa * farmSizeHa).toLocaleString()}</td>
                    <td className="py-2 text-right text-emerald-800 font-bold">
                      ₹{Math.round((baselineGrossPerHa * unchangedHectares) + (tgtGrossPerHa * shiftedHectares)).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 font-medium">Input Costs (Seeds, Fert, Chem)</td>
                    <td className="py-2 text-right text-rose-700 font-semibold">₹{Math.round(src.inputCostPerHa * farmSizeHa).toLocaleString()}</td>
                    <td className="py-2 text-right text-emerald-700 font-semibold">
                      ₹{Math.round((src.inputCostPerHa * unchangedHectares) + (tgt.inputCostPerHa * shiftedHectares)).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-700 font-medium">Electricity Bill (Pumping)</td>
                    <td className="py-2 text-right text-rose-700 font-semibold">₹{Math.round(baselineKwh * farmerTariffRate).toLocaleString()}</td>
                    <td className="py-2 text-right text-emerald-700 font-semibold">
                      ₹{Math.round(newKwh * farmerTariffRate).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                    <td className="py-2 px-1 text-emerald-900">Varuna DBT Subsidy Direct Credit</td>
                    <td className="py-2 text-right text-slate-400">₹0</td>
                    <td className="py-2 text-right text-emerald-700 font-black">+₹{Math.round(totalFarmSubsidyRs).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-slate-900 text-sm">
                    <td className="py-2.5 px-1">Final Net Income</td>
                    <td className="py-2.5 text-right font-extrabold text-slate-900">₹{Math.round(baselineTotalNetFarmIncome).toLocaleString()}</td>
                    <td className="py-2.5 text-right font-black text-emerald-700">₹{Math.round(finalNetFarmIncomeWithSubsidy).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bar Chart Visualization */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-2">
                Comparative Cash Flow (in ₹ Thousands)
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="category" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                    <Tooltip
                      formatter={(val) => [`₹${val.toLocaleString()}k`, '']}
                      contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Gross Revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Input & Power Cost" fill="#f87171" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Card: Policy Return on Investment (State Perspective) */}
          <div className="v-card p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-indigo-900">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                State Exchequers Fiscal Return
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              By paying this farmer <strong>₹{Math.round(totalFarmSubsidyRs).toLocaleString()}</strong> in crop transition DBT,
              the state avoids paying <strong>₹{Math.round(statePowerSubsidySavedRs).toLocaleString()}</strong> in agricultural power subsidies
              for deep groundwater pumping.
            </p>

            <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-300 font-medium">Net Fiscal Balance for State</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">
                  {statePowerSubsidySavedRs >= totalFarmSubsidyRs ? '+' : ''}
                  ₹{Math.round(statePowerSubsidySavedRs - totalFarmSubsidyRs).toLocaleString()} / Farm
                </div>
              </div>
              <span className={`v-badge font-bold ${statePowerSubsidySavedRs >= totalFarmSubsidyRs ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}`}>
                {statePowerSubsidySavedRs >= totalFarmSubsidyRs ? 'FISCAL SELF-FUNDING' : 'REINVESTMENT NEEDED'}
              </span>
            </div>

            <div className="mt-4 text-xs text-slate-400 flex items-center justify-between">
              <span>Aquifer Drawdown Avoided: <strong>~{((waterSavedM3 / (farmSizeHa * 10000)) * 100).toFixed(1)} cm/yr</strong></span>
              <span>Water Productivity: <strong>+42% ₹/m³</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
