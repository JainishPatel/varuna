import React from 'react';
import { Calculator, Droplet, Layers, DollarSign, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function MethodologyTab() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Title Header */}
      <div className="v-card p-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Deterministic Mathematical Engine & FAO-56 Methodology
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              FAO-56 Penman-Monteith Evapotranspiration Architecture & Spatial Aggregation Framework
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Crop Evapotranspiration (ET_c) */}
        <div className="v-card p-6 flex flex-col gap-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-md border border-emerald-300">
              STEP 1: FAO-56 ENGINE
            </span>
            <Droplet className="w-5 h-5 text-emerald-700" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">Crop Water Requirement (ET_c)</h2>

          <div className="bg-emerald-50 p-4 rounded-xl font-mono text-emerald-950 text-sm border border-emerald-200 text-center font-extrabold shadow-2xs">
            {"ET_c = K_c × ET_0"}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Reference evapotranspiration (ET_0) is calculated using daily meteorological grid data (Solar Radiation, Air Temperature, Wind Speed, Relative Humidity) via the FAO-56 Penman-Monteith equation:
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
            <div>• ET_0: Reference crop evapotranspiration (mm/day)</div>
            <div>• K_c: Stage-specific crop growth coefficient</div>
            <div>• ET_c: Specific crop evapotranspiration requirement</div>
          </div>

          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong className="text-slate-900">Target Crop Coefficients (K_c):</strong>
            <ul className="mt-1.5 space-y-1 font-mono text-[11px]">
              <li className="flex justify-between"><span>Cotton (High Water):</span> <span className="text-rose-700 font-bold">K_c = 1.15 (8,500 m³/ha)</span></li>
              <li className="flex justify-between"><span>Groundnut (Med Water):</span> <span className="text-purple-700 font-bold">K_c = 0.95 (5,500 m³/ha)</span></li>
              <li className="flex justify-between"><span>Wheat (Med Water):</span> <span className="text-amber-700 font-bold">K_c = 0.85 (4,800 m³/ha)</span></li>
              <li className="flex justify-between"><span>Pearl Millet / Bajra (Low):</span> <span className="text-emerald-700 font-bold">K_c = 0.65 (2,800 m³/ha)</span></li>
            </ul>
          </div>
        </div>

        {/* Step 2: Net Groundwater Demand */}
        <div className="v-card p-6 flex flex-col gap-4 border-l-4 border-l-sky-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-sky-800 bg-sky-100 px-3 py-1 rounded-md border border-sky-300">
              STEP 2: HYDROLOGICAL BALANCE
            </span>
            <Layers className="w-5 h-5 text-sky-700" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">Net Groundwater Demand Calculation</h2>

          <div className="bg-sky-50 p-4 rounded-xl font-mono text-sky-950 text-sm border border-sky-200 text-center font-extrabold shadow-2xs">
            {"Net Demand = Σ (ET_c,i × Hectares_i) - P_eff"}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Total agricultural irrigation demand is computed by taking total volumetric crop water requirements across allocated crop hectares and subtracting effective natural monsoon rainfall offsets (P_eff).
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
            <div>• Hectares_i: Simulated crop acreage allocation</div>
            <div>• P_eff: Effective precipitation available to crop root zone</div>
            <div>• Net Aquifer Saved = Δ Net Demand (MCM/yr)</div>
          </div>

          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
            <strong className="text-slate-900">Monsoon Shift Offsets:</strong> Shifting sowing dates by ±30 days shifts the crop growth curve to align maximum vegetative evapotranspiration (K_c,mid) directly with Gujarat's historical July-August monsoon rainfall peak.
          </div>
        </div>

        {/* Step 3: Economic Valuation */}
        <div className="v-card p-6 flex flex-col gap-4 border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-md border border-amber-300">
              STEP 3: MARKET ECONOMIC MODEL
            </span>
            <DollarSign className="w-5 h-5 text-amber-700" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">District Revenue & Farmer Income Formula</h2>

          <div className="bg-amber-50 p-4 rounded-xl font-mono text-amber-950 text-sm border border-amber-200 text-center font-extrabold shadow-2xs">
            {"Revenue = Σ [ (Yield (kg/ha) / 100) × Mandi Price (₹/qtl) × Hectares ]"}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The engine calculates financial outcome by combining historical Area, Production, and Yield (APY) records with live APMC Mandi market rates and Central Government MSP benchmarks.
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
            <div>• Yield in Quintals: Yield (kg/ha) / 100</div>
            <div>• Mandi Pricing: Real 2026 APMC Market arrivals & MSP floor</div>
            <div>• Economic Impact: Net change in ₹ Crores per district</div>
          </div>
        </div>

        {/* Step 4: Spatial Interpolation */}
        <div className="v-card p-6 flex flex-col gap-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-md border border-indigo-300">
              STEP 4: SPATIAL INTERPOLATION
            </span>
            <ShieldCheck className="w-5 h-5 text-indigo-700" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">IDW & Administrative Polygon Joins</h2>

          <div className="bg-indigo-50 p-4 rounded-xl font-mono text-indigo-950 text-sm border border-indigo-200 text-center font-extrabold shadow-2xs">
            {"Z(x) = [ Σ (w_i × Z_i) ] / Σ w_i,   w_i = d_i^-p"}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Isolated telemetry station wells (46,426 quarterly readings) are mapped to Gujarat district polygons using Inverse Distance Weighting (IDW) spatial interpolation to ensure complete choropleth coverage across all 32 districts.
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
            <div>• CGWB Risk Categorization: Safe, Semi-Critical, Critical, Over-Exploited</div>
            <div>• 30-Year Longitudinal Trend: 1991 - 2020 Telemetry baseline</div>
          </div>
        </div>
      </div>
    </div>
  );
}
