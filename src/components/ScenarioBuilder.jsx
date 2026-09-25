import React, { useState } from 'react';
import { 
  Sliders, Calendar, Sparkles, Droplets, Info, CheckCircle2, 
  AlertTriangle, Droplet, IndianRupee, TrendingUp, Cpu, Scale, 
  RefreshCw, Lock, Zap, Compass, Target, ArrowRight, ShieldCheck, 
  Layers, Gauge
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { runOptimization, solveTargetScenario } from '../utils/optimizer.js';
import { predictCrop, getModelMetadata } from '../utils/mlInference.js';
import { useAuth } from '../contexts/AuthContext';

const CROP_COLORS = {
  'Cotton': '#2563eb', // blue-600
  'Groundnut': '#7c3aed', // violet-600
  'Wheat': '#d97706', // amber-600
  'Pearl Millet (Bajra)': '#16a34a' // emerald-600
};

const CROP_META = {
  'Cotton': { waterBadge: 'High Water · 8,500 m³/ha', kc: '1.15' },
  'Groundnut': { waterBadge: 'Medium · 5,500 m³/ha', kc: '0.95' },
  'Wheat': { waterBadge: 'Medium · 4,800 m³/ha', kc: '0.85' },
  'Pearl Millet (Bajra)': { waterBadge: 'Low Water · 2,800 m³/ha', kc: '0.65' }
};

export default function ScenarioBuilder({ 
  cropAllocations, 
  setCropAllocations, 
  sowingShift, 
  setSowingShift, 
  microIrrigationAdoption = 0,
  setMicroIrrigationAdoption,
  activePreset, 
  applyPreset, 
  simulationResults, 
  selectedDistrict,
  baselineAllocations, 
  marketPrices, 
  cropApy, 
  groundwaterData,
  onNavigateToNexus
}) {
  const { hasPermission } = useAuth();
  const canSimulate = hasPermission('run_simulation');
  const canOptimize = hasPermission('run_optimizer');

  const [recommendedScenarios, setRecommendedScenarios] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGoalSeeking, setIsGoalSeeking] = useState(false);
  const [goalMessage, setGoalMessage] = useState('');

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const results = runOptimization(
        selectedDistrict, 
        baselineAllocations, 
        marketPrices, 
        cropApy, 
        groundwaterData,
        microIrrigationAdoption
      );
      setRecommendedScenarios(results);
      setIsOptimizing(false);
    }, 120);
  };

  const handleGoalSeek = (targetPercent) => {
    setIsGoalSeeking(true);
    setTimeout(() => {
      const solved = solveTargetScenario(
        targetPercent,
        selectedDistrict,
        baselineAllocations,
        marketPrices,
        cropApy,
        groundwaterData
      );
      if (solved) {
        setCropAllocations(solved.allocations);
        if (setMicroIrrigationAdoption) setMicroIrrigationAdoption(solved.microIrrigationAdoption);
        if (setSowingShift) setSowingShift(solved.sowingShift);
        setGoalMessage(`Target ${targetPercent}% solved: +${solved.waterSavedPercent.toFixed(1)}% water saved with minimal disruption.`);
        setTimeout(() => setGoalMessage(''), 4000);
      }
      setIsGoalSeeking(false);
    }, 150);
  };

  const applyRecommendation = (allocations, drip = 0) => {
    setCropAllocations({ ...allocations });
    if (setMicroIrrigationAdoption) setMicroIrrigationAdoption(drip);
  };

  const handleSliderChange = (cropKey, newValue) => {
    const delta = newValue - cropAllocations[cropKey];
    const otherCrops = Object.keys(cropAllocations).filter(c => c !== cropKey);
    const sumOther = otherCrops.reduce((acc, c) => acc + cropAllocations[c], 0);
    let updated = { ...cropAllocations, [cropKey]: newValue };
    if (sumOther > 0) {
      otherCrops.forEach(c => {
        const ratio = cropAllocations[c] / sumOther;
        updated[c] = Math.max(0, Math.round((cropAllocations[c] - delta * ratio) * 10) / 10);
      });
    }
    const total = Object.values(updated).reduce((a, b) => a + b, 0);
    if (total !== 100 && total > 0) {
      const scale = 100 / total;
      Object.keys(updated).forEach(k => { updated[k] = Math.round(updated[k] * scale * 10) / 10; });
    }
    setCropAllocations(updated);
  };

  // Pie chart data
  const pieData = Object.entries(cropAllocations).map(([name, value]) => ({
    name, value, color: CROP_COLORS[name] || '#6366f1'
  }));

  const { 
    waterSavedPercent = 0, 
    revenueChangePercent = 0, 
    waterSavedMCM = 0, 
    revenueChangeCrores = 0, 
    trajectoryData = [],
    farmerRevenueGapCrores = 0,
    subsidyPerHectare = 0,
    costPerM3Saved = 0,
    energySavedMWh = 0,
    avoidedCarbonTons = 0
  } = simulationResults || {};

  // ML Crop Recommendation
  const mlMeta = getModelMetadata();
  const districtData = selectedDistrict === 'ALL' ? groundwaterData['Banaskantha'] : (groundwaterData[selectedDistrict] || groundwaterData['Banaskantha']);
  const cropRec = predictCrop(districtData);

  // Feasibility status evaluation
  let feasStatus = 'Optimal Balance';
  let feasColor = 'text-emerald-900';
  let feasBg = 'bg-emerald-50 border-emerald-200';
  let FeasIcon = CheckCircle2;
  let feasMsg = 'Sustainable balance between groundwater recharge and economic yield.';

  if (waterSavedPercent <= 0) {
    feasStatus = 'Unsustainable Aquifer Depletion'; 
    feasColor = 'text-rose-900'; 
    feasBg = 'bg-rose-50 border-rose-200'; 
    FeasIcon = AlertTriangle;
    feasMsg = 'Accelerates drawdown. Reduce Cotton acreage, adopt drip irrigation, or shift sowing.';
  } else if (revenueChangePercent < -5) {
    feasStatus = 'Economically Challenging'; 
    feasColor = 'text-amber-900'; 
    feasBg = 'bg-amber-50 border-amber-200'; 
    FeasIcon = AlertTriangle;
    feasMsg = 'Ecologically sustainable, but farmers face income loss without state transition subsidies.';
  } else if (waterSavedPercent > 0 && waterSavedPercent < 5) {
    feasStatus = 'Marginal Conservation Gain'; 
    feasColor = 'text-sky-900'; 
    feasBg = 'bg-sky-50 border-sky-200'; 
    FeasIcon = CheckCircle2;
    feasMsg = 'Slight aquifer improvement. Combine micro-irrigation with Bajra swap for maximum resilience.';
  }

  const finalSimDepth = trajectoryData?.[trajectoryData.length - 1]?.simulatedDepth;
  const finalBaseDepth = trajectoryData?.[trajectoryData.length - 1]?.baselineDepth;

  const presets = [
    { key: 'baseline', label: 'Baseline', sub: 'Status Quo 2025' },
    { key: 'bajra_swap', label: 'Bajra Swap', sub: '25% Cotton → Millet' },
    { key: 'high_drip', label: 'Drip Blitz', sub: '50% Drip + Cash Crops' },
    { key: 'gw_rescue', label: 'Aquifer Rescue', sub: 'Max Conservation' },
    { key: 'max_revenue', label: 'Econ Max', sub: 'High Cotton Focus' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      {/* ───── Left Column: Policy Levers ───── */}
      <div className="flex-1 flex flex-col gap-5">
        {/* Title & Stage Tag */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="v-badge bg-sky-100 text-sky-900 border border-sky-300 font-bold text-xs">
              SIMULATION LAB
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold">
              FAO-56 Penman-Monteith Engine
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-700" />
            {selectedDistrict === 'ALL' ? 'Statewide Gujarat Multi-Lever Simulation' : `${selectedDistrict} District Decision Cockpit`}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Calibrate crop acreage allocations, micro-irrigation penetration, and monsoon sowing alignment to evaluate real-time hydro-economic trade-offs.
          </p>
        </div>

        {/* Quick Presets */}
        <div className={!canSimulate ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Strategic Policy Presets
            </label>
            <span className="text-xs text-slate-500 font-mono font-semibold">1-Click Scenarios</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`p-2.5 rounded-xl text-left transition-all text-xs border ${
                  activePreset === p.key
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-extrabold">{p.label}</div>
                <div className={`text-xs mt-0.5 ${activePreset === p.key ? 'text-slate-300' : 'text-slate-500 font-medium'}`}>
                  {p.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ───── Lever 1: Crop Acreage Allocation ───── */}
        <div className="v-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-mono font-bold">1</span>
                Crop Acreage Allocation
              </label>
              <p className="text-xs text-slate-600 mt-0.5">Adjust proportional distribution of irrigated farmland</p>
            </div>
            <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded font-mono font-bold">
              Total: 100%
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sliders */}
            <div className="flex-1 space-y-4">
              {Object.entries(cropAllocations).map(([crop, val]) => {
                const meta = CROP_META[crop] || { waterBadge: 'Medium', kc: '1.0' };
                return (
                  <div key={crop} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CROP_COLORS[crop] }}></span>
                        {crop}
                      </span>
                      <span className="text-sm font-extrabold tabular-nums font-mono" style={{ color: CROP_COLORS[crop] }}>
                        {val.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="80" step="0.5" value={val}
                      onChange={(e) => handleSliderChange(crop, parseFloat(e.target.value))}
                      disabled={!canSimulate}
                      className="w-full"
                      style={{ background: `linear-gradient(to right, ${CROP_COLORS[crop]} 0%, ${CROP_COLORS[crop]} ${val * 1.25}%, #e2e8f0 ${val * 1.25}%, #e2e8f0 100%)` }}
                    />
                    <div className="text-xs text-slate-600 mt-1 font-semibold">{meta.waterBadge} · Kc {meta.kc}</div>
                  </div>
                );
              })}
            </div>

            {/* Pie Chart */}
            <div className="w-[170px] flex-shrink-0 flex flex-col items-center justify-center border-l border-slate-100 pl-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val}%`, name]}
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-xs font-extrabold text-slate-600 mt-1 uppercase tracking-wider">Acreage Mix</div>
            </div>
          </div>
        </div>

        {/* ───── Lever 2: Micro-Irrigation (Drip & Sprinkler) Adoption ───── */}
        <div className={`v-card p-5 border-l-4 border-l-cyan-500 ${!canSimulate ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-cyan-100 text-cyan-800 flex items-center justify-center text-xs font-mono font-bold">2</span>
                Micro-Irrigation (Drip / Sprinkler) Adoption
              </label>
              <p className="text-xs text-slate-600 mt-0.5">
                Gujarat Green Revolution Company (GGRC) high-efficiency irrigation scheme
              </p>
            </div>
            <span className="text-sm font-black text-cyan-700 font-mono tabular-nums">
              {microIrrigationAdoption}% Adoption
            </span>
          </div>

          <input
            type="range" min="0" max="100" step="5" value={microIrrigationAdoption}
            onChange={(e) => setMicroIrrigationAdoption && setMicroIrrigationAdoption(parseInt(e.target.value))}
            disabled={!canSimulate}
            className="w-full"
            style={{ background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${microIrrigationAdoption}%, #e2e8f0 ${microIrrigationAdoption}%, #e2e8f0 100%)` }}
          />

          <div className="flex items-center justify-between mt-2 text-xs font-semibold text-slate-600">
            <span>0% (Flood Irrigation · 45% eff)</span>
            <span className="text-cyan-800 font-extrabold">
              {microIrrigationAdoption > 0 ? `Saves ~${Math.round(microIrrigationAdoption * 0.35)}% field water + 6% yield gain` : 'Standard flood loss'}
            </span>
            <span>100% (Micro-Drip · 85% eff)</span>
          </div>
        </div>

        {/* ───── Lever 3: Sowing Shift ───── */}
        <div className={`v-card p-5 border-l-4 border-l-amber-500 ${!canSimulate ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-mono font-bold">3</span>
                Monsoon Sowing Date Alignment
              </label>
              <p className="text-xs text-slate-600 mt-0.5">
                Shift sowing dates to match maximum vegetative ET with July-August rainfall
              </p>
            </div>
            <span className="text-sm font-black text-amber-700 font-mono tabular-nums">
              {sowingShift > 0 ? `+${sowingShift}` : sowingShift} days
            </span>
          </div>

          <input
            type="range" min="-30" max="30" step="5" value={sowingShift}
            onChange={(e) => setSowingShift(parseInt(e.target.value))}
            disabled={!canSimulate}
            className="w-full"
            style={{ background: `linear-gradient(to right, #d97706 0%, #d97706 ${((sowingShift + 30) / 60) * 100}%, #e2e8f0 ${((sowingShift + 30) / 60) * 100}%, #e2e8f0 100%)` }}
          />

          <div className="flex items-center justify-between mt-2 text-xs font-semibold text-slate-600">
            <span>-30 Days Early</span>
            <span className="text-slate-700 font-bold">Historical Baseline (0 Days)</span>
            <span>+30 Days Monsoon Peak</span>
          </div>
        </div>

        {/* ───── Goal-Seek Reverse Optimizer ───── */}
        <div className="v-card p-5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Goal-Seek Aquifer Target Solver</h3>
                <p className="text-[10px] text-slate-500">Reverse-engineers the least disruptive policy for any target water saving</p>
              </div>
            </div>

            {goalMessage && (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded animate-fadeIn">
                {goalMessage}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[10, 15, 20, 25, 30].map(pct => (
              <button
                key={pct}
                onClick={() => handleGoalSeek(pct)}
                disabled={isGoalSeeking}
                className="flex-1 min-w-[100px] py-1.5 px-3 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-900 font-bold text-xs transition-all shadow-2xs disabled:opacity-50"
              >
                {isGoalSeeking ? '...' : `Target -${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Pareto Sweeper */}
        {canOptimize && (
          <div className="v-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Multi-Objective Pareto Search</h3>
                  <p className="text-[10px] text-slate-500">Evaluates hydro-economic permutations along the Pareto frontier</p>
                </div>
              </div>
              <button
                onClick={handleRunOptimizer}
                disabled={isOptimizing}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                {isOptimizing ? 'Evaluating...' : 'Run Search'}
              </button>
            </div>

            {recommendedScenarios && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { data: recommendedScenarios.maxWater, label: 'Max Water', icon: Droplet },
                  { data: recommendedScenarios.balanced, label: 'Balanced', icon: Scale },
                  { data: recommendedScenarios.maxRevenue, label: 'Max Revenue', icon: TrendingUp },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
                      </div>
                      <div className="text-xs font-mono">
                        <span className="font-bold text-sky-700">+{item.data.waterSavedPercent.toFixed(1)}%</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className={`font-bold ${item.data.revenueChangePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {item.data.revenueChangePercent > 0 ? '+' : ''}{item.data.revenueChangePercent.toFixed(1)}%
                        </span>
                      </div>
                      <button
                        onClick={() => applyRecommendation(item.data.allocations, item.data.microIrrigationAdoption)}
                        className="w-full py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10px] font-bold text-slate-700 transition-colors shadow-2xs"
                      >
                        Apply
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───── Right Column: Real-Time Hydro-Economic Outcomes ───── */}
      <div className="lg:w-[380px] flex flex-col gap-5">
        {/* Feasibility Banner */}
        <div className={`rounded-xl p-4 border ${feasBg}`}>
          <div className={`flex items-center gap-2 font-bold text-sm ${feasColor}`}>
            <FeasIcon className="w-4 h-4" />
            {feasStatus}
          </div>
          <p className={`text-xs mt-1.5 leading-relaxed ${feasColor} font-medium`}>{feasMsg}</p>
        </div>

        {/* Primary Hydro-Economic KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card water">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              <Droplet className="w-3.5 h-3.5 text-sky-600" /> Net Water Saved
            </div>
            <div className={`text-2xl font-black ${waterSavedPercent >= 0 ? 'text-sky-950' : 'text-rose-700'}`}>
              {waterSavedPercent > 0 ? '+' : ''}{waterSavedPercent?.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-700 font-mono font-extrabold mt-1">
              {waterSavedMCM?.toFixed(0)} MCM/yr
            </div>
          </div>

          <div className={`stat-card ${revenueChangePercent >= 0 ? 'revenue' : 'danger'}`}>
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Farmer Revenue
            </div>
            <div className={`text-2xl font-black ${revenueChangePercent >= 0 ? 'text-emerald-950' : 'text-rose-700'}`}>
              {revenueChangePercent > 0 ? '+' : ''}{revenueChangePercent?.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-700 font-mono font-extrabold mt-1">
              {revenueChangeCrores > 0 ? `+${revenueChangeCrores.toFixed(1)}` : revenueChangeCrores?.toFixed(1)} ₹ Cr
            </div>
          </div>
        </div>

        {/* ───── Farmer Income Protection & State Subsidy Box ───── */}
        <div className="v-card p-5 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="v-badge bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs">
              POLICY TRANSITION BUDGET
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>

          <h3 className="text-xs font-extrabold text-slate-900">
            Farmer Revenue Gap & Transition Bonus
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
            State budget needed to guarantee zero agrarian income loss during crop transition.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-600 font-bold">Income Gap to Cover</div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {farmerRevenueGapCrores > 0 ? `₹${farmerRevenueGapCrores.toFixed(1)} Cr` : '₹0 (Profitable)'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 font-bold">Per Hectare Bonus</div>
              <div className="text-lg font-black text-emerald-800 font-mono">
                {subsidyPerHectare > 0 ? `₹${subsidyPerHectare.toLocaleString()}/ha` : '₹0 / ha'}
              </div>
            </div>
          </div>

          {/* Conserved Water Cost Comparison */}
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="font-extrabold text-slate-800 flex items-center justify-between">
              <span>Cost of Conserved Water:</span>
              <span className="text-emerald-700 font-black font-mono">₹{costPerM3Saved.toFixed(2)} / m³</span>
            </div>
            <div className="text-xs text-slate-500 flex justify-between font-medium">
              <span>Narmada Canal Lift:</span>
              <span className="line-through text-slate-400">₹32.00 / m³</span>
            </div>
            <div className="text-xs text-slate-500 flex justify-between font-medium">
              <span>Coastal Desalination:</span>
              <span className="line-through text-slate-400">₹58.00 / m³</span>
            </div>
          </div>
        </div>

        {/* 2035 Aquifer Trajectory Preview */}
        <div className="v-card p-5 flex justify-between items-center">
          <div>
            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
              Aquifer Depth in 2035
            </div>
            <div className="text-2xl font-black text-slate-900">
              {finalSimDepth?.toFixed(1)} <span className="text-xs font-semibold text-slate-600">m bgl</span>
            </div>
            <div className="text-xs text-emerald-700 font-bold mt-0.5">
              Avoids {finalBaseDepth && finalSimDepth ? (finalBaseDepth - finalSimDepth).toFixed(1) : '0'}m tubewell drop
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-1">
              Status Quo
            </div>
            <div className="text-base font-extrabold text-rose-600 line-through">
              {finalBaseDepth?.toFixed(1)} m
            </div>
          </div>
        </div>

        {/* Bridge to Stage 3 */}
        {onNavigateToNexus && (
          <button
            onClick={onNavigateToNexus}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>View Impact Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
