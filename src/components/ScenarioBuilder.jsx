import React, { useState } from 'react';
import { Sliders, Calendar, Sparkles, Droplets, Info, CheckCircle2, AlertTriangle, Droplet, IndianRupee, TrendingUp, Cpu, Scale, RefreshCw, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { runOptimization } from '../utils/optimizer.js';
import { predictCrop, getModelMetadata } from '../utils/mlInference.js';
import { useAuth } from '../contexts/AuthContext';

const CROP_COLORS = {
  'Cotton': '#2563eb',
  'Groundnut': '#7c3aed',
  'Wheat': '#d97706',
  'Pearl Millet (Bajra)': '#16a34a'
};

const CROP_META = {
  'Cotton': { waterBadge: 'High Water · 8,500 m³/ha', kc: '1.15' },
  'Groundnut': { waterBadge: 'Medium · 5,500 m³/ha', kc: '0.95' },
  'Wheat': { waterBadge: 'Medium · 4,800 m³/ha', kc: '0.85' },
  'Pearl Millet (Bajra)': { waterBadge: 'Low Water · 2,800 m³/ha', kc: '0.65' }
};

export default function ScenarioBuilder({ 
  cropAllocations, setCropAllocations, sowingShift, setSowingShift, activePreset, applyPreset, simulationResults, selectedDistrict,
  baselineAllocations, marketPrices, cropApy, groundwaterData
}) {
  const { hasPermission } = useAuth();
  const canSimulate = hasPermission('run_simulation');
  const canOptimize = hasPermission('run_optimizer');

  const [recommendedScenarios, setRecommendedScenarios] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const results = runOptimization(selectedDistrict, baselineAllocations, marketPrices, cropApy, groundwaterData);
      setRecommendedScenarios(results);
      setIsOptimizing(false);
    }, 100);
  };

  const applyRecommendation = (allocations) => {
    setCropAllocations({ ...allocations });
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

  const { waterSavedPercent, revenueChangePercent, waterSavedMCM, revenueChangeCrores, trajectoryData } = simulationResults || {};

  // ML Crop Recommendation
  const mlMeta = getModelMetadata();
  const districtData = selectedDistrict === 'ALL' ? groundwaterData['Banaskantha'] : (groundwaterData[selectedDistrict] || groundwaterData['Banaskantha']);
  const cropRec = predictCrop(districtData);

  // Feasibility
  let feasStatus = 'Optimal Balance';
  let feasColor = 'text-emerald-900';
  let feasBg = 'bg-emerald-50 border-emerald-200';
  let FeasIcon = CheckCircle2;
  let feasMsg = 'Sustainable balance between groundwater recharge and economic yield.';

  if (waterSavedPercent < 0) {
    feasStatus = 'Unsustainable Aquifer Depletion'; feasColor = 'text-rose-900'; feasBg = 'bg-rose-50 border-rose-200'; FeasIcon = AlertTriangle;
    feasMsg = 'Accelerates drawdown. Reduce Cotton acreage or shift sowing window.';
  } else if (revenueChangePercent < -5) {
    feasStatus = 'Economically Challenging'; feasColor = 'text-amber-900'; feasBg = 'bg-amber-50 border-amber-200'; FeasIcon = AlertTriangle;
    feasMsg = 'Ecologically sustainable, but farmers face revenue drop without MSP subsidies.';
  } else if (waterSavedPercent > 0 && waterSavedPercent < 5) {
    feasStatus = 'Marginal Gain'; feasColor = 'text-sky-900'; feasBg = 'bg-sky-50 border-sky-200'; FeasIcon = CheckCircle2;
    feasMsg = 'Slight aquifer improvement. Further Bajra swap recommended for high impact.';
  }

  const finalSimDepth = trajectoryData?.[trajectoryData.length - 1]?.simulatedDepth;
  const finalBaseDepth = trajectoryData?.[trajectoryData.length - 1]?.baselineDepth;

  const presets = [
    { key: 'baseline', label: 'Baseline', sub: 'Historical 2022-25' },
    { key: 'bajra_swap', label: 'Bajra Swap', sub: '25% Cotton → Millet' },
    { key: 'gw_rescue', label: 'Aquifer Rescue', sub: 'Max water savings' },
    { key: 'max_revenue', label: 'Econ Max', sub: 'Market price focus' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column: Controls */}
      <div className="flex-1 flex flex-col gap-5">
        {/* Title */}
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-600" />
            {selectedDistrict === 'ALL' ? 'Statewide Gujarat Simulation Model' : `${selectedDistrict} District Model`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust crop acreage parameters and monsoon sowing alignment to evaluate real-time hydro-economic trade-offs.
            {!canSimulate && <span className="text-amber-700 font-semibold ml-2">🔒 Read-only view</span>}
          </p>
        </div>

        {/* Policy Presets */}
        <div className={!canSimulate ? 'opacity-50 pointer-events-none' : ''}>
          <label className="text-[11px] font-bold text-slate-500 mb-2 block uppercase tracking-wider">Quick Presets</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {presets.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`p-2.5 rounded-lg text-left transition-all text-xs border ${
                  activePreset === p.key
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-[#e2e8f0] text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold">{p.label}</div>
                <div className={`text-[10px] mt-0.5 ${activePreset === p.key ? 'text-slate-300' : 'text-slate-400'}`}>{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Crop Allocation Sliders + Pie Chart */}
        <div className="v-card p-5">
          <div className="flex items-center justify-between mb-4">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
              <Droplets className="w-3.5 h-3.5 text-slate-500" />
              Crop Acreage Allocation
            </label>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Total: 100%</span>
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
                        <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: CROP_COLORS[crop] }}></span>
                        {crop}
                      </span>
                      <span className="text-sm font-extrabold tabular-nums" style={{ color: CROP_COLORS[crop] }}>
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
                    <div className="text-[10px] text-slate-500 mt-1 font-medium">{meta.waterBadge} · Kc {meta.kc}</div>
                  </div>
                );
              })}
            </div>

            {/* Pie Chart */}
            <div className="w-[170px] flex-shrink-0 flex flex-col items-center justify-center border-l border-slate-100 pl-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value" strokeWidth={0}>
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
              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Acreage Mix</div>
            </div>
          </div>
        </div>

        {/* Sowing Shift */}
        <div className={`v-card p-5 ${!canSimulate ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              Monsoon Sowing Date Alignment
            </label>
            <span className="text-sm font-extrabold text-slate-900 tabular-nums">
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
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-medium">
            Shifts sowing window to align maximum vegetative evapotranspiration directly with July-August monsoon rainfall peaks.
          </p>
        </div>

        {/* Optimizer */}
        {canOptimize && (
          <div className="v-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Pareto Trade-Off Optimizer</h3>
                  <p className="text-[10px] text-slate-500">Multiobjective scenario search engine</p>
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

            {!recommendedScenarios && !isOptimizing && (
              <p className="text-[11px] text-slate-500 text-center py-2">
                Sweeps 1,771 crop permutations to identify optimal water conservation vs revenue frontiers.
              </p>
            )}

            {isOptimizing && (
              <div className="py-4 flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-slate-500 font-mono">Evaluating hydro-economic permutations...</p>
              </div>
            )}

            {recommendedScenarios && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { data: recommendedScenarios.maxWater, label: 'Max Water', icon: Droplet, color: 'blue' },
                  { data: recommendedScenarios.balanced, label: 'Balanced', icon: Scale, color: 'indigo' },
                  { data: recommendedScenarios.maxRevenue, label: 'Max Revenue', icon: TrendingUp, color: 'emerald' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-sky-700">+{item.data.waterSavedPercent.toFixed(1)}%</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className={`font-bold ${item.data.revenueChangePercent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {item.data.revenueChangePercent > 0 ? '+' : ''}{item.data.revenueChangePercent.toFixed(1)}%
                        </span>
                      </div>
                      <button
                        onClick={() => applyRecommendation(item.data.allocations)}
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

        {/* ML Insights */}
        <div className="v-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-emerald-700" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">ML Crop Classifier Recommendation</h3>
              <p className="text-[10px] text-slate-500">Random Forest Classifier ({mlMeta?.crop?.nTrees} trees, {(mlMeta?.crop?.accuracy * 100).toFixed(0)}% acc)</p>
            </div>
          </div>
          
          {cropRec && (
            <div>
              <div className="flex items-center gap-2 mb-3 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-900">Predicted Primary Crop:</span>
                <span className="text-xs font-extrabold text-emerald-800">
                  {cropRec.recommended}
                </span>
              </div>
              <div className="space-y-1.5">
                {Object.entries(cropRec.confidence)
                  .sort((a, b) => b[1] - a[1])
                  .filter(([_, prob]) => prob > 0)
                  .map(([crop, prob]) => (
                    <div key={crop} className="flex items-center text-[10px]">
                      <div className="w-24 truncate font-semibold text-slate-700">{crop}</div>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-2 border border-slate-200">
                        <div 
                          className="h-full rounded-full" 
                          style={{ width: `${prob * 100}%`, backgroundColor: CROP_COLORS[crop] }}
                        />
                      </div>
                      <div className="w-8 text-right font-mono font-bold text-slate-600">{(prob * 100).toFixed(0)}%</div>
                    </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Outcomes */}
      <div className="lg:w-[360px] flex flex-col gap-5">
        {/* Feasibility Banner */}
        <div className={`rounded-xl p-4 border ${feasBg}`}>
          <div className={`flex items-center gap-2 font-bold text-sm ${feasColor}`}>
            <FeasIcon className="w-4 h-4" />
            {feasStatus}
          </div>
          <p className={`text-xs mt-1.5 leading-relaxed ${feasColor} font-medium`}>{feasMsg}</p>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="stat-card water">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <Droplet className="w-3.5 h-3.5 text-sky-600" /> Water Saved
            </div>
            <div className={`text-2xl font-extrabold ${waterSavedPercent >= 0 ? 'text-sky-900' : 'text-rose-700'}`}>
              {waterSavedPercent > 0 ? '+' : ''}{waterSavedPercent?.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono font-bold mt-1">{waterSavedMCM?.toFixed(0)} MCM/yr</div>
          </div>

          <div className={`stat-card ${revenueChangePercent >= 0 ? 'revenue' : 'danger'}`}>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Revenue
            </div>
            <div className={`text-2xl font-extrabold ${revenueChangePercent >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
              {revenueChangePercent > 0 ? '+' : ''}{revenueChangePercent?.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono font-bold mt-1">{revenueChangeCrores?.toFixed(1)} ₹ Cr</div>
          </div>
        </div>

        {/* 2035 Projection */}
        <div className="v-card p-5 flex justify-between items-center">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Simulated Depth 2035</div>
            <div className="text-2xl font-extrabold text-slate-900">{finalSimDepth?.toFixed(1)} <span className="text-xs font-normal text-slate-500">m bgl</span></div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Baseline</div>
            <div className="text-base font-bold text-rose-600 line-through">{finalBaseDepth?.toFixed(1)} m</div>
          </div>
        </div>

        {/* Engine Notice */}
        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-[11px] font-bold text-slate-800">Deterministic Engine</strong>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-medium">
              ETc = Kc × ET₀ (Penman-Monteith). Evidence-based baseline for state and district policy decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
