import React, { useState } from 'react';
import { 
  Map as MapIcon, Award, Layers, ShieldAlert, AlertTriangle, 
  CheckCircle2, ArrowRight, Search, Filter, Droplet, ArrowUpDown, 
  ExternalLink, Info, Activity, Sliders, Scale, Waves, ArrowRightLeft,
  MapPin
} from 'lucide-react';
import SpatialMap from './SpatialMap';
import DistrictRankings from './DistrictRankings';

export default function DiagnoseHub({
  geojson,
  groundwaterData = {},
  selectedDistrict,
  setSelectedDistrict,
  simulatedDistricts = {},
  cropApy = {},
  onNavigateToSimulate
}) {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'rankings' | 'compare'
  
  // District Comparator State
  const districtList = Object.keys(groundwaterData);
  const [compDistrictA, setCompDistrictA] = useState('Banaskantha');
  const [compDistrictB, setCompDistrictB] = useState('Surat');

  // Summary counts
  const totalDistricts = districtList.length;
  const overExploited = Object.values(groundwaterData).filter(d => d.cgwb_category === 'Over-Exploited').length;
  const critical = Object.values(groundwaterData).filter(d => d.cgwb_category === 'Critical').length;
  const semiCritical = Object.values(groundwaterData).filter(d => d.cgwb_category === 'Semi-Critical').length;
  const safe = Object.values(groundwaterData).filter(d => d.cgwb_category === 'Safe').length;

  const handleSelectAndSimulate = (districtName) => {
    setSelectedDistrict(districtName);
    if (onNavigateToSimulate) {
      onNavigateToSimulate();
    }
  };

  const getDistrictProfile = (distName) => {
    const gw = groundwaterData[distName] || {};
    const sim = simulatedDistricts[distName] || {};
    const crops = cropApy[distName] || {};
    const totalArea = Object.values(crops).reduce((s, c) => s + c.area_hectares, 0);
    const cottonArea = crops['Cotton']?.area_hectares || 0;
    const cottonPct = totalArea > 0 ? (cottonArea / totalArea) * 100 : 0;
    
    return {
      name: distName,
      meanDepth: gw.mean_depth || 10,
      drawdown: gw.annual_drawdown_rate || 0.15,
      category: gw.cgwb_category || 'Critical',
      stations: gw.stations_count || 120,
      simDepth: sim.simulated_depth || (gw.mean_depth ? gw.mean_depth + 1 : 11),
      simCat: sim.simulated_category || gw.cgwb_category || 'Critical',
      cottonPct: Math.round(cottonPct),
      crops
    };
  };

  const profA = getDistrictProfile(compDistrictA);
  const profB = getDistrictProfile(compDistrictB);

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">
      {/* ───── Hub Header Banner (Executive Light Theme) ───── */}
      <div className="v-card p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="v-badge bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs">
                SPATIAL INTELLIGENCE
              </span>
              <span className="text-xs text-slate-500 font-bold">
                Telemetry (1991–2025) & River Gauges
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Aquifer Vulnerability & Spatial Intelligence
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed font-medium">
              Spatial groundwater monitoring across Gujarat: view government risk tiers, historical trajectories (1995–2035), and river discharge.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-emerald-600" />
              Spatial Map & Timeline
            </button>

            <button
              onClick={() => setViewMode('rankings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'rankings'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Rankings Matrix
            </button>

            <button
              onClick={() => setViewMode('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'compare'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              Dual-District Compare
            </button>
          </div>
        </div>

        {/* State Stress KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200">
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-rose-800">
              <span>Over-Exploited</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-950 mt-1 tabular-nums">
              {overExploited} <span className="text-xs font-semibold text-rose-700">Districts</span>
            </div>
            <div className="text-xs text-rose-700 font-medium mt-0.5">Drawdown &gt; 0.22 m/yr</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-amber-800">
              <span>Critical</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 mt-1 tabular-nums">
              {critical} <span className="text-xs font-semibold text-amber-700">Districts</span>
            </div>
            <div className="text-xs text-amber-700 font-medium mt-0.5">Drawdown 0.12–0.22 m/yr</div>
          </div>

          <div className="p-3.5 rounded-xl bg-yellow-50/70 border border-yellow-200">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-yellow-900">
              <span>Semi-Critical</span>
              <Activity className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-black text-yellow-950 mt-1 tabular-nums">
              {semiCritical} <span className="text-xs font-semibold text-yellow-700">Districts</span>
            </div>
            <div className="text-xs text-yellow-800 font-medium mt-0.5">Pre-monsoon decline</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              <span>Safe Basins</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">
              {safe} <span className="text-xs font-semibold text-emerald-700">Districts</span>
            </div>
            <div className="text-xs text-emerald-800 font-medium mt-0.5">Sustainable recharge</div>
          </div>
        </div>
      </div>

      {/* ───── Mode 1: Spatial Map & Timeline ───── */}
      {viewMode === 'map' && (
        <div className="flex flex-col gap-4">
          <div className="v-card overflow-hidden h-[680px] relative border-slate-200 shadow-sm">
            <SpatialMap
              geojson={geojson}
              groundwaterData={groundwaterData}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              simulatedDistricts={simulatedDistricts}
              cropApy={cropApy}
            />
          </div>

          {/* Bridge CTA */}
          <div className="v-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/70 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-xs">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Ready to test policy interventions for {selectedDistrict === 'ALL' ? 'Statewide Gujarat' : `${selectedDistrict} District`}?
                </h3>
                <p className="text-[11px] text-slate-600">
                  Simulate crop substitution, sowing calendar shift, and micro-irrigation drip penetration.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelectAndSimulate(selectedDistrict)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <span>Open Simulation Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ───── Mode 2: District Rankings Matrix ───── */}
      {viewMode === 'rankings' && (
        <div className="flex flex-col gap-4">
          <DistrictRankings onSelectDistrict={(dist) => handleSelectAndSimulate(dist)} />
        </div>
      )}

      {/* ───── Mode 3: Dual-District Comparative Diagnostic ───── */}
      {viewMode === 'compare' && (
        <div className="v-card p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                Cross-Basin Regional Comparator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare two contrasting Gujarat agro-climatic basins to demonstrate why localized micro-policies are required.
              </p>
            </div>

            {/* Selectors */}
            <div className="flex items-center gap-3">
              <select
                value={compDistrictA}
                onChange={(e) => setCompDistrictA(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                {districtList.map(d => (
                  <option key={`a-${d}`} value={d}>District A: {d}</option>
                ))}
              </select>

              <span className="text-xs font-bold text-slate-400">vs</span>

              <select
                value={compDistrictB}
                onChange={(e) => setCompDistrictB(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
              >
                {districtList.map(d => (
                  <option key={`b-${d}`} value={d}>District B: {d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* District A Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="v-badge bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs">
                    DISTRICT A
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{profA.name}</h3>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  profA.category === 'Over-Exploited' ? 'bg-rose-100 text-rose-800' :
                  profA.category === 'Critical' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {profA.category}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-slate-600 text-xs uppercase font-extrabold">Mean Aquifer Depth</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{profA.meanDepth} m bgl</div>
                  <div className="text-rose-600 font-bold text-xs mt-0.5">{profA.drawdown} m/yr drop</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-slate-600 text-xs uppercase font-extrabold">Cotton Acreage</div>
                  <div className="text-xl font-black text-blue-700 font-mono mt-0.5">{profA.cottonPct}%</div>
                  <div className="text-slate-600 text-xs font-medium mt-0.5">of total farmland</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectAndSimulate(profA.name)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-auto"
              >
                <span>Simulate {profA.name} Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* District B Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="v-badge bg-teal-100 text-teal-900 border border-teal-300 font-bold text-xs">
                    DISTRICT B
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{profB.name}</h3>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  profB.category === 'Over-Exploited' ? 'bg-rose-100 text-rose-800' :
                  profB.category === 'Critical' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {profB.category}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-slate-600 text-xs uppercase font-extrabold">Mean Aquifer Depth</div>
                  <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{profB.meanDepth} m bgl</div>
                  <div className="text-rose-600 font-bold text-xs mt-0.5">{profB.drawdown} m/yr drop</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-slate-600 text-xs uppercase font-extrabold">Cotton Acreage</div>
                  <div className="text-xl font-black text-blue-700 font-mono mt-0.5">{profB.cottonPct}%</div>
                  <div className="text-slate-600 text-xs font-medium mt-0.5">of total farmland</div>
                </div>
              </div>

              <button
                onClick={() => handleSelectAndSimulate(profB.name)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-auto"
              >
                <span>Simulate {profB.name} Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
