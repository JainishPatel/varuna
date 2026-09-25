import React, { useState } from 'react';
import { 
  Zap, Droplet, IndianRupee, TrendingUp, Layers, ArrowRight, 
  ShieldCheck, AlertTriangle, CheckCircle2, Leaf, BarChart3, 
  Cpu, Activity, Flame, Download, Compass, Scale, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Legend, CartesianGrid 
} from 'recharts';

export default function ScenarioStudio({
  simulationResults,
  selectedDistrict,
  marketPrices,
  cropAllocations,
  sowingShift = 0,
  microIrrigationAdoption = 0,
  groundwaterData = {},
  onNavigateToDossier
}) {
  const {
    waterSavedMCM = 0,
    waterSavedPercent = 0,
    baselineVolumetricMCM = 0,
    simulatedVolumetricMCM = 0,
    revenueChangeCrores = 0,
    revenueChangePercent = 0,
    simulatedRevenuePerHa = 0,
    baselineRevenuePerHa = 0,
    farmerRevenueGapCrores = 0,
    subsidyPerHectare = 0,
    costPerM3Saved = 0,
    energySavedMWh = 0,
    energySavedGWh = 0,
    powerSubsidySavedCrores = 0,
    avoidedCarbonTons = 0,
    trajectoryData = [],
    cropValueBreakdown = []
  } = simulationResults || {};

  const isRevenuePositive = revenueChangeCrores >= 0;

  // Chart data: Water vs Revenue comparison by crop
  const cropComparisonData = cropValueBreakdown.map(item => ({
    name: item.name.replace(' (Bajra)', ''),
    fullName: item.name,
    waterReq: item.waterReq,
    grossRev: Math.round(item.grossRevenue / 1000), // in thousands Rs
    share: item.share
  }));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ───── Stage 3 Header (Executive Light Theme) ───── */}
      <div className="v-card p-6 md:p-8 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="v-badge bg-indigo-50 text-indigo-800 border border-indigo-200 font-extrabold text-xs">
                IMPACT ANALYSIS
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {selectedDistrict === 'ALL' ? 'Statewide Gujarat' : `${selectedDistrict} Basin`}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Scenario Studio: Water, Power & Farmer Economics
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Compare baseline extraction against active policies: model how groundwater savings directly cut electricity subsidies, strengthen the grid, and protect farm revenue.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToDossier && (
              <button
                onClick={onNavigateToDossier}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <span>View Policy Brief</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ───── Section 1: Side-by-Side A/B Policy Comparator ───── */}
      <div className="v-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                A/B Policy Comparator: Status Quo vs. Active Policy
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Evaluating the net variance between business-as-usual and the simulated policy intervention
              </p>
            </div>
          </div>
          <span className="v-badge bg-slate-100 text-slate-800 font-bold text-xs">
            {selectedDistrict}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Compare Metric 1: Water Consumed */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Annual Water Demand</span>
              <Droplet className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Status Quo:</span>
                <span className="font-mono font-bold text-slate-700">{baselineVolumetricMCM?.toFixed(0)} MCM</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Simulated:</span>
                <span className="font-mono font-extrabold text-sky-700">{simulatedVolumetricMCM?.toFixed(0)} MCM</span>
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t border-slate-200 text-xs font-bold flex justify-between ${
              waterSavedPercent > 0 ? 'text-emerald-700' : 'text-slate-600'
            }`}>
              <span>Net Variance:</span>
              <span className="font-mono">-{waterSavedMCM?.toFixed(0)} MCM (-{waterSavedPercent?.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Compare Metric 2: 2035 Aquifer Depth */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>2035 Aquifer Level</span>
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Status Quo:</span>
                <span className="font-mono font-bold text-rose-600">
                  {trajectoryData?.[trajectoryData.length - 1]?.baselineDepth?.toFixed(1)} m bgl
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Simulated:</span>
                <span className="font-mono font-extrabold text-emerald-700">
                  {trajectoryData?.[trajectoryData.length - 1]?.simulatedDepth?.toFixed(1)} m bgl
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-emerald-700 flex justify-between">
              <span>Aquifer Protected:</span>
              <span className="font-mono">
                +{(trajectoryData?.[trajectoryData.length - 1]?.baselineDepth - trajectoryData?.[trajectoryData.length - 1]?.simulatedDepth || 0).toFixed(1)}m higher
              </span>
            </div>
          </div>

          {/* Compare Metric 3: Farmer Revenue */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Agrarian Revenue</span>
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Status Quo:</span>
                <span className="font-mono font-bold text-slate-700">₹{Math.round(baselineRevenuePerHa).toLocaleString()}/ha</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Simulated:</span>
                <span className={`font-mono font-extrabold ${isRevenuePositive ? 'text-emerald-700' : 'text-slate-800'}`}>
                  ₹{Math.round(simulatedRevenuePerHa).toLocaleString()}/ha
                </span>
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t border-slate-200 text-xs font-bold flex justify-between ${
              isRevenuePositive ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              <span>Delta:</span>
              <span className="font-mono">{revenueChangePercent > 0 ? '+' : ''}{revenueChangePercent?.toFixed(1)}% ({revenueChangeCrores?.toFixed(1)} Cr)</span>
            </div>
          </div>

          {/* Compare Metric 4: Pumping Electricity */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Tubewell Grid Power</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">Energy Relieved:</span>
                <span className="font-mono font-extrabold text-amber-600">
                  {energySavedMWh > 0 ? `${energySavedMWh.toLocaleString()} MWh` : '0 MWh'}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-500">State Power Subsidy:</span>
                <span className="font-mono font-extrabold text-emerald-700">
                  {powerSubsidySavedCrores > 0 ? `₹${powerSubsidySavedCrores} Cr saved` : '₹0'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-teal-700 flex justify-between">
              <span>CO₂ Emissions:</span>
              <span className="font-mono">-{avoidedCarbonTons.toLocaleString()} tCO₂e</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Section 2: WEF Nexus Deep Dive & Co-Benefits ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Agricultural Power Grid Relief */}
        <div className="v-card p-6 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 border-amber-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="v-badge bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
                ENERGY NEXUS
              </span>
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Agricultural Pumping Electricity Relieved
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Every cubic meter of deep groundwater avoided reduces the heavy load on Gujarat’s power grid (GUVNL).
            </p>
          </div>

          <div className="my-5">
            <div className="text-3xl font-black text-slate-900 font-mono">
              {energySavedMWh.toLocaleString()} <span className="text-sm font-semibold text-slate-600">MWh</span>
            </div>
            <div className="text-xs text-amber-800 font-bold mt-1">
              Equivalent to powering ~{(energySavedMWh * 0.8).toFixed(0)} rural households for a year
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Dynamic Pumping Head:</span>
              <span className="font-mono font-bold text-slate-900">{simulationResults?.meanDepth || 12}m bgl + 15m head</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Submersible Pump Efficiency:</span>
              <span className="font-mono font-bold text-slate-900">50% nominal</span>
            </div>
          </div>
        </div>

        {/* Card 2: State Treasury Subsidy Savings */}
        <div className="v-card p-6 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 border-emerald-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="v-badge bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs">
                FISCAL NEXUS
              </span>
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              State Farm Power Subsidy Savings
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Gujarat heavily subsidizes agricultural power (~₹6.40/kWh gap). Reduced pumping directly unburdens the state budget.
            </p>
          </div>

          <div className="my-5">
            <div className="text-3xl font-black text-emerald-900 font-mono">
              ₹{powerSubsidySavedCrores.toFixed(1)} <span className="text-sm font-semibold text-slate-600">Crores</span>
            </div>
            <div className="text-xs text-emerald-800 font-bold mt-1">
              Can be reallocated to fund farmer drip irrigation subsidies
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-700 font-medium">
              <span>GUVNL Tariff Support:</span>
              <span className="font-mono font-bold text-slate-900">₹6.40 per kWh saved</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Fiscal Payback Period:</span>
              <span className="font-mono font-bold text-emerald-700">Immediate (&lt; 1 Year)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Decarbonization & Climate Mitigation */}
        <div className="v-card p-6 bg-gradient-to-br from-teal-50/40 via-white to-cyan-50/30 border-teal-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="v-badge bg-teal-100 text-teal-900 border border-teal-300 font-bold text-xs">
                CLIMATE MITIGATION
              </span>
              <Leaf className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Avoided Grid Carbon Footprint
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Western India regional electric grid emits ~0.82 kg CO₂/kWh. Energy reduction produces direct carbon offsets.
            </p>
          </div>

          <div className="my-5">
            <div className="text-3xl font-black text-teal-800 font-mono">
              {avoidedCarbonTons.toLocaleString()} <span className="text-sm font-normal text-slate-500">tCO₂e</span>
            </div>
            <div className="text-xs text-teal-700 font-semibold mt-1">
              Eligible for international voluntary carbon credits (VCM)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-teal-200 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>Grid Emission Factor:</span>
              <span className="font-mono font-bold">0.82 kg CO₂ / kWh</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Potential Carbon Value:</span>
              <span className="font-mono font-bold text-teal-700">~₹{(avoidedCarbonTons * 0.08).toFixed(1)} Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Section 3: Visual Analytics (Trajectory & Water/Revenue Spread) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aquifer Trajectory to 2035 */}
        <div className="v-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Aquifer Trajectory Projection (2020–2035)
              </h3>
              <p className="text-xs text-slate-500">
                Simulated dynamic response vs. historical linear drawdown rate (m bgl)
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              NWIC + Simulation
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis reversed domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11 }} unit="m" />
                <Tooltip
                  formatter={(val, name) => [`${val} m bgl`, name === 'baselineDepth' ? 'Status Quo Baseline' : 'Simulated Policy']}
                  contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="baselineDepth" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  fill="#fee2e2" 
                  fillOpacity={0.4} 
                  name="Status Quo Baseline" 
                />
                <Area 
                  type="monotone" 
                  dataKey="simulatedDepth" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fill="#d1fae5" 
                  fillOpacity={0.6} 
                  name="Simulated Policy" 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Water Intensity vs Gross Revenue */}
        <div className="v-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Crop Water Intensity vs. Gross Revenue
              </h3>
              <p className="text-xs text-slate-500">
                FAO-56 water requirement (m³/ha) vs. gross yield value (₹ thousands/ha)
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              FAO-56 + APMC Mandi
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#0284c7" unit=" m³" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#16a34a" unit="k ₹" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'waterReq' ? `${val} m³/ha` : `₹${val * 1000}/ha`,
                    name === 'waterReq' ? 'Water Requirement' : 'Gross Revenue'
                  ]}
                  contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar yAxisId="left" dataKey="waterReq" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Water Requirement (m³/ha)" />
                <Bar yAxisId="right" dataKey="grossRev" fill="#22c55e" radius={[4, 4, 0, 0]} name="Gross Revenue (₹k/ha)" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
