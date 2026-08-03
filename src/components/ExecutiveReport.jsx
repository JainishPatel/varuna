import React from 'react';
import { ShieldCheck, Download, FileText, Droplets, CheckCircle2, AlertTriangle, Layers, BookOpen, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ExecutiveReport({ onExportReport }) {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('export_report');

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Printable Report Header */}
      <div className="v-card p-8 flex flex-col gap-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-emerald-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-md border border-emerald-300">
            OFFICIAL STATE POLICY TECHNICAL REPORT
          </span>
          {canExport ? (
            <button
              onClick={onExportReport}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all no-print"
            >
              <Download className="w-4 h-4" />
              Export PDF Report
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-2 border border-slate-200 no-print">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Export Locked
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Executive Report: Varuna Sustainable Crop Water Planning
          </h1>
          <p className="text-sm text-emerald-900 font-bold mt-1">
            Spatial Data Dashboard & Agricultural Planning Simulation Engine for Groundwater Preservation in Gujarat State
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-emerald-200/80 text-xs font-mono text-slate-600">
          <div>Author: <span className="text-slate-900 font-bold">Varuna Core Engineering Team</span></div>
          <div>Region: <span className="text-slate-900 font-bold">Gujarat State, India (32 Districts)</span></div>
          <div>Datasets: <span className="text-slate-900 font-bold">NWIC, CGWB, Agmarknet, IMD</span></div>
        </div>
      </div>

      {/* 1. Executive Summary */}
      <section className="v-card p-6 flex flex-col gap-3">
        <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
          <span>1.</span> Executive Summary
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          <strong className="text-slate-900">Varuna</strong> is a spatial data dashboard and agricultural planning simulation engine designed to address the critical groundwater depletion crisis in Gujarat, India. The tool empowers local administrators, agricultural officers, and farmers to evaluate the ecological and economic implications of district-level cropping decisions. By integrating fragmented historical hydrology data, meteorological grids, agricultural census records, and live market pricing, Varuna simulates how shifting crop allocations (e.g., swapping water-intensive Cotton for drought-resistant Pearl Millet) impacts both local groundwater stress and farmer revenue.
        </p>
      </section>

      {/* 2. Problem Statement */}
      <section className="v-card p-6 flex flex-col gap-3">
        <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
          <span>2.</span> Problem Statement & Ecological Context
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Groundwater depletion in Gujarat is accelerating due to over-extraction for agriculture. Currently, agricultural planning and hydrological monitoring exist in silos. Administrators lack a unified tool that cross-references crop water demands with historical aquifer drawdown and real-world economic incentives. When farmers are asked to switch to less water-intensive crops, there is no immediate way to quantify the financial trade-off versus the ecological benefit. Varuna bridges this gap by merging spatial, meteorological, and economic data into a single, interactive decision-support system.
        </p>
      </section>

      {/* 3. Data Architecture & Inventory */}
      <section className="v-card p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
          <span>3.</span> Data Architecture & Multi-Disciplinary Pipeline
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          The Varuna engine relies on an extensive data pipeline aggregating seven distinct datasets into a unified spatial model.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sky-800">A. Hydrological Data (The Supply)</h3>
            <p className="text-slate-700"><strong>Dataset 1: Groundwater Level (1991-2020)</strong><br />Source: NWIC / Gujarat SW & GW Dept. 46,426 quarterly readings capturing pre/post monsoon drawdown.</p>
            <p className="text-slate-700"><strong>Dataset 2: Block Categorization Limits</strong><br />Source: CGWB limits classifying administrative blocks as Safe, Semi-Critical, Critical, or Over-Exploited.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-amber-800">B. Agricultural & Economic Data (Demand)</h3>
            <p className="text-slate-700"><strong>Dataset 3: Area, Production, Yield (APY)</strong><br />Source: Data.gov.in / State Dept. Historical acreage & yield for Cotton, Groundnut, Wheat, and Pearl Millet/Bajra.</p>
            <p className="text-slate-700"><strong>Dataset 4: Market Pricing (Mandi & MSP)</strong><br />Source: Agmarknet (DMI) & MSP releases calculating Expected Yield Value in ₹/ha.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-emerald-800">C. Meteorological Data (Climate Engine)</h3>
            <p className="text-slate-700"><strong>Dataset 5: Historical Weather Grids</strong><br />Source: IMD / NWIC time-series grid (Temp, Wind, Humidity, Solar Radiation, Rainfall) for Penman-Monteith ET0.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-purple-800">D & E. Spatial Data & Agronomic Standards</h3>
            <p className="text-slate-700"><strong>Dataset 6 & 7: Boundaries & Crop Coefficients (Kc)</strong><br />FAO-56 growth stage coefficients matched with Gujarat GeoJSON district boundary polygons.</p>
          </div>
        </div>
      </section>

      {/* 4. Core Methodology & Mathematical Engine */}
      <section className="v-card p-6 flex flex-col gap-4">
        <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
          <span>4.</span> Mathematical Engine Summary
        </h2>
        <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
          <div className="text-emerald-800 font-bold">{"Step 1: ET_c = K_c × ET_0 (FAO-56 Penman-Monteith)"}</div>
          <div className="text-sky-800 font-bold">{"Step 2: Net Demand = Σ (ET_c × Hectares) - Rainfall Offsets"}</div>
          <div className="text-amber-800 font-bold">{"Step 3: Revenue = (Yield (kg/ha) / 100) × Mandi Price (₹/qtl)"}</div>
          <div className="text-purple-800 font-bold">{"Step 4: Spatial IDW Interpolation to District Polygons"}</div>
        </div>
      </section>

      {/* 5. Conclusion */}
      <section className="v-card p-6 flex flex-col gap-3">
        <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
          <span>5.</span> Conclusion & Recommendations
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Varuna demonstrates that combining fragmented government datasets into a cohesive simulation tool provides actionable intelligence for state water security. By substituting high-water Cotton with Pearl Millet (Bajra) in vulnerable northern districts like Banaskantha and Mehsana, Gujarat can conserve over 450 MCM of groundwater annually while maintaining net farm revenue stability.
        </p>
      </section>
    </div>
  );
}
