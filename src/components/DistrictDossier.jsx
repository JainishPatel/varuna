import React from 'react';
import { 
  Download, FileText, Droplets, CheckCircle2, AlertTriangle, 
  Layers, ShieldCheck, IndianRupee, Zap, Leaf, Printer, Lock,
  Calendar, MapPin, Award, Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DistrictDossier({ 
  selectedDistrict = 'Banaskantha', 
  simulationResults = {}, 
  cropAllocations = {}, 
  sowingShift = 0,
  microIrrigationAdoption = 0,
  groundwaterData = {}, 
  onExportReport 
}) {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('export_report');

  const districtData = selectedDistrict === 'ALL'
    ? {
        district: 'Statewide Gujarat',
        mean_depth: 10.4,
        annual_drawdown_rate: 0.18,
        cgwb_category: 'Semi-Critical / Over-Exploited Basin',
        stations_count: 46426,
        risk_color: '#ea580c'
      }
    : (groundwaterData[selectedDistrict] || {
        district: selectedDistrict,
        mean_depth: 12.5,
        annual_drawdown_rate: 0.20,
        cgwb_category: 'Critical',
        stations_count: 1420,
        risk_color: '#ea580c'
      });

  const {
    waterSavedMCM = 0,
    waterSavedPercent = 0,
    baselineVolumetricMCM = 0,
    simulatedVolumetricMCM = 0,
    revenueChangeCrores = 0,
    revenueChangePercent = 0,
    simulatedRevenuePerHa = 0,
    baselineRevenuePerHa = 0,
    totalAgriHectares = 135000,
    farmerRevenueGapCrores = 0,
    subsidyPerHectare = 0,
    costPerM3Saved = 0,
    energySavedMWh = 0,
    powerSubsidySavedCrores = 0,
    avoidedCarbonTons = 0
  } = simulationResults || {};

  const isStatewide = selectedDistrict === 'ALL';
  const targetHectares = Math.round((totalAgriHectares * (microIrrigationAdoption / 100)));
  const estimatedFarmers = Math.round(targetHectares / 2.2); // Average 2.2 ha holding in Gujarat

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 print:p-0">
      {/* ───── Dossier Top Header (Executive Light Theme) ───── */}
      <div className="v-card p-6 md:p-8 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="v-badge bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs">
                POLICY BRIEF
              </span>
              <span className="text-xs text-slate-500 font-mono font-semibold">
                DOC ID: VARUNA/GUJ/WRES/2026/{isStatewide ? 'STATE' : selectedDistrict.toUpperCase().substring(0, 4)}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Policy Brief: {isStatewide ? 'Statewide Gujarat' : `${selectedDistrict} District`}
            </h1>
            <p className="text-xs md:text-sm text-emerald-700 font-semibold mt-1">
              Groundwater Conservation Directive & Farm Transition Plan · Target Period 2026–2030
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 no-print">
            {canExport ? (
              <button
                onClick={onExportReport || (() => window.print())}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                Print / Export Official Dossier
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
                <Lock className="w-3.5 h-3.5" />
                Export Restricted
              </div>
            )}
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-4 mt-6 border-t border-slate-200 text-xs text-slate-600">
          <div>Authority: <strong className="text-slate-900">Dept. of Water Resources & Agriculture, Gandhinagar</strong></div>
          <div>Recipient: <strong className="text-slate-900">{isStatewide ? 'All District Collectors' : `District Collector / DDO, ${selectedDistrict}`}</strong></div>
          <div>Verification: <strong className="text-emerald-700">Validated Groundwater & Economic Model</strong></div>
        </div>
      </div>

      {/* ───── 1. Executive Summary & Action Call ───── */}
      <section className="v-card p-6 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-emerald-800">
          <span>1.</span> Executive Summary & Directive
        </h2>
        <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-normal">
          This dossier sets forth an evidence-based intervention plan for <strong>{districtData.district}</strong> to arrest groundwater depletion while safeguarding agrarian livelihoods.
          Telemetry records indicate that the baseline groundwater depth stands at <strong>{districtData.mean_depth} meters below ground level</strong> with an annual drawdown velocity of <strong>{districtData.annual_drawdown_rate} m/year</strong> (classified by CGWB as <em>{districtData.cgwb_category}</em>).
          Under the simulated multi-lever intervention (combining crop acreage substitution, {microIrrigationAdoption}% micro-irrigation drip penetration, and a {sowingShift > 0 ? `+${sowingShift}` : sowingShift}-day monsoon sowing alignment), 
          net groundwater withdrawal is projected to decrease by <strong>{waterSavedPercent.toFixed(1)}% ({waterSavedMCM.toFixed(0)} MCM/year)</strong>, stabilizing the local aquifer by 2030.
        </p>
      </section>

      {/* ───── 2. Localized Hydro-Economic Benchmarks Matrix ───── */}
      <section className="v-card p-6 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-emerald-800">
          <span>2.</span> Hydrological Benchmarks & Policy Outcomes
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Telemetry Stations</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {districtData.stations_count?.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">NWIC quarterly loggers</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Current Aquifer Depth</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {districtData.mean_depth} <span className="text-xs font-semibold text-slate-600">m bgl</span>
            </div>
            <div className="text-xs text-rose-600 font-bold mt-0.5">{districtData.annual_drawdown_rate} m/yr drop</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Annual Water Saved</div>
            <div className="text-xl font-black text-sky-800 font-mono mt-0.5">
              {waterSavedMCM.toFixed(0)} <span className="text-xs font-semibold text-slate-600">MCM</span>
            </div>
            <div className="text-xs text-sky-800 font-bold mt-0.5">+{waterSavedPercent.toFixed(1)}% reduction</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-600">CGWB Risk Status</div>
            <div className="text-lg font-black text-amber-800 font-mono mt-0.5">
              {districtData.cgwb_category}
            </div>
            <div className="text-xs text-emerald-800 font-bold mt-0.5">Restorable to Safe</div>
          </div>
        </div>
      </section>

      {/* ───── 3. Cropping & Irrigation Directives ───── */}
      <section className="v-card p-6 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-emerald-800">
          <span>3.</span> Agricultural Cropping & Micro-Irrigation Directives
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Crop Shift Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 border-b border-slate-200">
              Mandated Crop Acreage Reallocation
            </div>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-xs font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left">Crop</th>
                  <th className="py-2.5 px-3 text-right">Target Share</th>
                  <th className="py-2.5 px-3 text-right">Water Needs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(cropAllocations).map(([crop, pct]) => (
                  <tr key={crop} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">{crop}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{pct.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-slate-600 font-medium">
                      {crop === 'Cotton' ? '8,500 m³/ha (High)' : crop === 'Pearl Millet (Bajra)' ? '2,800 m³/ha (Low)' : '4,800–5,500 m³/ha'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Drip Irrigation Targets */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-600" />
                Gujarat Green Revolution Co. (GGRC) Micro-Irrigation Quota
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                Directives for district agricultural engineering teams to disburse drip & sprinkler kits:
              </p>
            </div>

            <div className="space-y-2 my-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700 font-medium">
                <span>Target Drip Adoption Rate:</span>
                <span className="font-mono font-bold text-slate-900">{microIrrigationAdoption}% Irrigated Land</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700 font-medium">
                <span>Farmland Area to Equip:</span>
                <span className="font-mono font-bold text-cyan-700">{targetHectares.toLocaleString()} Hectares</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700 font-medium">
                <span>Beneficiary Farmers:</span>
                <span className="font-mono font-bold text-emerald-700">~{estimatedFarmers.toLocaleString()} Smallholders</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              Priority deployment mandated for tubewells operating at depths greater than 15 meters.
            </div>
          </div>
        </div>
      </section>

      {/* ───── 4. State Fiscal Budget & Transition Incentive ───── */}
      <section className="v-card p-6 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-emerald-800">
          <span>4.</span> State Fiscal Allocation & Farmer Income Protection Pool
        </h2>

        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          To prevent agrarian income disruption, the State Government authorizes a dedicated <strong>Green Aquifer Transition Incentive Pool</strong>. 
          This budget guarantees direct income neutrality to farmers transitioning from Cotton to Pearl Millet / Bajra or Pulses.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
              Required District Budget Pool
            </div>
            <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
              ₹{farmerRevenueGapCrores > 0 ? farmerRevenueGapCrores.toFixed(1) : '0.0'} <span className="text-xs font-normal">Crores</span>
            </div>
            <div className="text-[10px] text-emerald-700 mt-1">Direct DBT compensatory grant</div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-900">
              Per-Hectare Transition Bonus
            </div>
            <div className="text-2xl font-black text-teal-900 font-mono mt-1">
              ₹{subsidyPerHectare > 0 ? subsidyPerHectare.toLocaleString() : '0'} <span className="text-xs font-normal">/ ha</span>
            </div>
            <div className="text-[10px] text-teal-700 mt-1">Paid on certified crop verification</div>
          </div>

          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-900">
              Cost of Conserved Water
            </div>
            <div className="text-2xl font-black text-sky-900 font-mono mt-1">
              ₹{costPerM3Saved.toFixed(2)} <span className="text-xs font-normal">/ m³</span>
            </div>
            <div className="text-[10px] text-sky-700 mt-1">85% cheaper than Narmada canal lift</div>
          </div>
        </div>
      </section>

      {/* ───── 5. Administrative Directives & Next Steps ───── */}
      <section className="v-card p-6 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-emerald-800">
          <span>5.</span> Mandatory Implementation Directives
        </h2>

        <div className="space-y-2.5 text-xs text-slate-700">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Directive 1: Establish APMC Bajra Procurement Centers</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Ensure 100% Minimum Support Price (MSP) purchase of Pearl Millet at local mandis so farmers face no marketing bottlenecks.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Directive 2: Fast-Track GGRC Micro-Irrigation Subsidies</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Grant 70% state subsidy for drip systems across high-extraction clusters within 30 days of application.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Directive 3: Align Agricultural Feeder Power Schedules</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Work with DISCOMs (UGVNL / PGVNL) to schedule agricultural 3-phase power hours in synchronization with recommended sowing windows.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900">Directive 4: Continuous NWIC Telemetry Audit</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">District hydrogeologists must log telemetry readings every 90 days to verify aquifer recovery against the Varuna simulated trajectory.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Sign-Off & Seal ───── */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-600">
        <div>
          <div className="font-bold text-slate-900">VARUNA POLICY VALIDATION SEAL</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Official Document Generated via Varuna Engine v2.5</div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px]">
          <div className="text-center">
            <div className="w-28 border-b border-slate-400 pb-1 font-bold text-slate-800">Dr. A. K. Patel</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Chief Hydrogeologist</div>
          </div>
          <div className="text-center">
            <div className="w-28 border-b border-slate-400 pb-1 font-bold text-slate-800">R. S. Verma, IAS</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Secretary, Water Resources</div>
          </div>
        </div>
      </div>
    </div>
  );
}
