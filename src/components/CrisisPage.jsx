import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Droplet, AlertTriangle, TrendingDown, ArrowRight, MapPin,
  Waves, Zap, Sprout, ShieldAlert, Activity, Clock,
  ChevronDown, BarChart3, Sliders, Gauge, CheckCircle2,
  ExternalLink, Search, Flame, Sparkles
} from 'lucide-react';

// Animated counter hook
function useCounter(target, duration = 1800, startOnView = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasStarted(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

export default function CrisisPage({
  groundwaterData = {},
  onNavigateToMap,
  onNavigateToCropLab,
  onNavigateToStressTest,
  onSelectDistrict
}) {
  // Counters
  const counter62 = useCounter(62, 1600);
  const counter18 = useCounter(18, 1400);
  const counter4200 = useCounter(4200, 1800);
  const counter46k = useCounter(46426, 2000);

  // ───── Interactive Tool 1: Tubewell Depth Simulator ─────
  const [interactiveDepth, setInteractiveDepth] = useState(42); // meters

  const depthSimulation = useMemo(() => {
    const depth = interactiveDepth;
    // Power needed: HP = (Q * H) / (75 * eff)
    let hp = 5;
    if (depth > 75) hp = 15;
    else if (depth > 50) hp = 10;
    else if (depth > 30) hp = 7.5;

    const drillCost = Math.round(depth * 3200 + 45000); // Boring + casing + submersible assembly
    const annualKwh = Math.round(depth * 185); // Annual extraction energy for typical holding
    const annualPowerBillSubsidized = Math.round(annualKwh * 0.60);
    const annualPowerBillTrueCost = Math.round(annualKwh * 6.50);

    let salinityPpm = 350 + Math.round(Math.pow(depth / 10, 2.2) * 28);
    let salinityStatus = 'Potable / Fresh';
    let salinityColor = '#10b981';
    if (depth > 70) {
      salinityStatus = 'Brackish & Toxic Fluoride (>2200 ppm)';
      salinityColor = '#ef4444';
    } else if (depth > 45) {
      salinityStatus = 'Elevated Mineral Hardness (>1200 ppm)';
      salinityColor = '#f59e0b';
    }

    return {
      hp,
      drillCost,
      annualKwh,
      annualPowerBillSubsidized,
      annualPowerBillTrueCost,
      salinityPpm,
      salinityStatus,
      salinityColor
    };
  }, [interactiveDepth]);

  // ───── Interactive Tool 2: Cotton vs Bajra Tradeoff Balancer ─────
  const [cottonAcreagePercent, setCottonAcreagePercent] = useState(80); // 0 to 100% on 100 Ha
  const bajraAcreagePercent = 100 - cottonAcreagePercent;

  const tradeoffCalc = useMemo(() => {
    // 100 Hectares baseline
    const cottonWaterM3 = (cottonAcreagePercent * 8500);
    const bajraWaterM3 = (bajraAcreagePercent * 2800);
    const totalWaterM3 = cottonWaterM3 + bajraWaterM3;

    // Gross Revenue
    const cottonGross = cottonAcreagePercent * (850 * 87.74);
    const bajraGross = bajraAcreagePercent * (680 * 27.75);
    const totalGross = cottonGross + bajraGross;

    // Power required
    const totalKwh = Math.round(totalWaterM3 * 0.42);

    return {
      totalWaterM3,
      totalGross,
      totalKwh,
      waterSavedVsFullCotton: (850000 - totalWaterM3)
    };
  }, [cottonAcreagePercent, bajraAcreagePercent]);

  // ───── Interactive Tool 3: District Risk Classification Matrix ─────
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('Over-Exploited');
  const [districtSearch, setDistrictSearch] = useState('');

  const categories = { 'Over-Exploited': 0, 'Critical': 0, 'Semi-Critical': 0, 'Safe': 0 };
  Object.values(groundwaterData).forEach(d => {
    if (categories[d.cgwb_category] !== undefined) categories[d.cgwb_category]++;
  });
  const totalDistricts = Object.keys(groundwaterData).length || 32;

  const filteredDistricts = useMemo(() => {
    return Object.entries(groundwaterData)
      .filter(([name, data]) => {
        const matchesCat = activeCategoryFilter === 'ALL' || data.cgwb_category === activeCategoryFilter;
        const matchesSearch = name.toLowerCase().includes(districtSearch.toLowerCase());
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => (b[1].mean_depth || 0) - (a[1].mean_depth || 0));
  }, [groundwaterData, activeCategoryFilter, districtSearch]);

  // ───── Interactive Tool 4: Historical Timeline ─────
  const [selectedTimelineYear, setSelectedTimelineYear] = useState('2025');

  const timelineData = {
    '1995': {
      year: '1995',
      title: 'Baseline Equilibrium',
      depth: '6.8m',
      status: 'Equilibrium',
      color: '#10b981',
      extractRate: '3.2 BCM/yr',
      wells: '~85,000 Open Wells',
      headline: 'Traditional bullock & shallow open wells dominate agriculture. Surface canals maintain water tables within 7 meters.'
    },
    '2005': {
      year: '2005',
      title: 'Bt-Cotton & Tubewell Revolution',
      depth: '14.2m',
      status: 'Warning Signs',
      color: '#f59e0b',
      extractRate: '6.8 BCM/yr',
      wells: '320,000 Submersible Wells',
      headline: 'Introduction of Bt-Cotton drives rapid electrification. Submersible pumps replace dug wells across North Gujarat and Saurashtra.'
    },
    '2015': {
      year: '2015',
      title: 'Systemic Aquifer Depletion',
      depth: '24.6m',
      status: 'Critical Stress',
      color: '#ea580c',
      extractRate: '9.4 BCM/yr',
      wells: '650,000 High-HP Tubewells',
      headline: '11 districts classified critical. Pre-monsoon water tables drop below 20 meters; farmers drill beyond 80m to find water.'
    },
    '2025': {
      year: '2025',
      title: 'Statewide Groundwater Crisis',
      depth: '38.4m',
      status: 'Over-Exploited Emergency',
      color: '#ef4444',
      extractRate: '12.6 BCM/yr',
      wells: '850,000+ Deep Borewells',
      headline: '18 of 32 districts over-exploited. State annual deficit reaches 4,200 MCM. Coastal aquifers face irreversible salinity intrusion.'
    }
  };

  const activeTimeline = timelineData[selectedTimelineYear];

  return (
    <div className="crisis-page">
      {/* ═══════ HERO SECTION ═══════ */}
      <section className="crisis-hero">
        <div className="crisis-hero__bg" />
        <div className="crisis-hero__content">
          <div className="crisis-hero__badge">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Gujarat Groundwater Crisis Assessment</span>
          </div>

          <h1 className="crisis-hero__title">
            <span className="crisis-hero__title-accent" ref={counter62.ref}>
              {counter62.count}%
            </span>
            <span className="crisis-hero__title-text">
              of Gujarat's agricultural basins are in over-draft
            </span>
          </h1>

          <p className="crisis-hero__subtitle">
            Analyzing 46,426 government monitoring wells across all 32 districts.
            Explore groundwater depletion trends, test farm crop transitions, and model policy solutions.
          </p>

          <div className="crisis-hero__actions">
            <button onClick={onNavigateToMap} className="crisis-hero__cta">
              <MapPin className="w-4 h-4" />
              <span>Explore Groundwater Map</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('depth-tool');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-300 shadow-xs transition-all"
            >
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Launch Crisis Simulators</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="crisis-hero__stats">
          <div className="crisis-stat-float crisis-stat-float--red" ref={counter18.ref}>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div className="crisis-stat-float__value">{counter18.count}</div>
            <div className="crisis-stat-float__label">Districts in Severe Deficit</div>
          </div>
          <div className="crisis-stat-float crisis-stat-float--blue" ref={counter4200.ref}>
            <Waves className="w-5 h-5 text-sky-600" />
            <div className="crisis-stat-float__value">{counter4200.count.toLocaleString()}</div>
            <div className="crisis-stat-float__label">MCM/yr Water Deficit</div>
          </div>
          <div className="crisis-stat-float crisis-stat-float--teal" ref={counter46k.ref}>
            <Activity className="w-5 h-5 text-emerald-600" />
            <div className="crisis-stat-float__value">{counter46k.count.toLocaleString()}</div>
            <div className="crisis-stat-float__label">Active Telemetry Wells</div>
          </div>
        </div>
      </section>

      {/* ═══════ INTERACTIVE TOOL 1: Tubewell Depth & Pumping Cost Calculator ═══════ */}
      <section id="depth-tool" className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="v-card p-6 md:p-8 bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="v-badge bg-rose-50 text-rose-800 border border-rose-200 font-extrabold text-xs">
                  INTERACTIVE DIAGNOSTIC 1
                </span>
                <span className="text-xs font-bold text-slate-500">Pumping Cost vs Water Depth</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                The Depth Trap: What Happens as Water Tables Drop?
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-1 font-medium">
                Drag the well depth slider to see how falling water tables cause capital costs, motor sizes, electricity bills, and salinity to surge.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">Operating Depth:</span>
              <span className="text-lg font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200 tabular-nums">
                {interactiveDepth} Meters
              </span>
            </div>
          </div>

          {/* Depth Slider */}
          <div className="mb-8">
            <input
              type="range"
              min="10"
              max="120"
              step="2"
              value={interactiveDepth}
              onChange={(e) => setInteractiveDepth(parseInt(e.target.value))}
              className="w-full accent-rose-600"
            />
            <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
              <span>10m (1995 Sustainable)</span>
              <span>35m (Current Average)</span>
              <span>75m (Severe Over-draft)</span>
              <span>120m (Bedrock / Dry Well)</span>
            </div>
          </div>

          {/* Responsive Diagnostic Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Box 1: Motor HP */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                <span>Motor Required</span>
                <Gauge className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 tabular-nums">
                {depthSimulation.hp} HP
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Requires heavy-duty 3-phase submersible pump
              </div>
            </div>

            {/* Box 2: Boring & Assembly Capital Cost */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                <span>Borewell & Motor Cost</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-800 tabular-nums">
                ₹{depthSimulation.drillCost.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                Heavy capital debt placed on farming families
              </div>
            </div>

            {/* Box 3: Annual Electricity Drawn */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                <span>Annual Power Used</span>
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-900 tabular-nums">
                {depthSimulation.annualKwh.toLocaleString()} <span className="text-sm font-semibold text-slate-600">kWh</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                State power subsidy cost: ₹{depthSimulation.annualPowerBillTrueCost.toLocaleString()}/yr
              </div>
            </div>

            {/* Box 4: Salinity Hazard */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                <span>Water Quality</span>
                <Droplet className="w-4 h-4" style={{ color: depthSimulation.salinityColor }} />
              </div>
              <div className="text-lg font-black tabular-nums" style={{ color: depthSimulation.salinityColor }}>
                {depthSimulation.salinityPpm} PPM
              </div>
              <div className="text-xs font-bold mt-1" style={{ color: depthSimulation.salinityColor }}>
                {depthSimulation.salinityStatus}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ INTERACTIVE TOOL 2: Cotton vs Bajra Tradeoff Balancer ═══════ */}
      <section className="p-6 md:p-10 max-w-6xl mx-auto pt-0">
        <div className="v-card p-6 md:p-8 bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="v-badge bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs">
                  INTERACTIVE DIAGNOSTIC 2
                </span>
                <span className="text-xs font-bold text-slate-500">Crop Economics & Water Savings</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                The Crop Dilemma: Cash Crop Profit vs Water Depletion
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-1 font-medium">
                Adjust the 100-Hectare crop balance to see how switching from Cotton (heavy water demand) to Bajra (drought resilient) slashes water drain while preserving income.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onNavigateToCropLab && (
                <button
                  onClick={onNavigateToCropLab}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <span>Open Full Crop Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Balance Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                Bt Cotton: {cottonAcreagePercent} Ha (High Water)
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Pearl Millet (Bajra): {bajraAcreagePercent} Ha (Water Saving)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={cottonAcreagePercent}
              onChange={(e) => setCottonAcreagePercent(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Tradeoff Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Water Required
              </div>
              <div className="text-2xl font-black text-sky-900 tabular-nums">
                {(tradeoffCalc.totalWaterM3 / 1000).toFixed(0)} <span className="text-sm font-semibold text-slate-600">Thousand m³</span>
              </div>
              <div className="text-xs text-emerald-700 font-bold mt-1">
                {tradeoffCalc.waterSavedVsFullCotton > 0 ? `Saved: ${(tradeoffCalc.waterSavedVsFullCotton / 1000).toFixed(0)}k m³ water` : 'Maximum water usage'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pumping Electricity Consumed
              </div>
              <div className="text-2xl font-black text-amber-900 tabular-nums">
                {tradeoffCalc.totalKwh.toLocaleString()} <span className="text-sm font-semibold text-slate-600">kWh</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                At 38m average basin pumping depth
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Gross Harvest Revenue
              </div>
              <div className="text-2xl font-black text-emerald-900 tabular-nums">
                ₹{(tradeoffCalc.totalGross / 100000).toFixed(2)} <span className="text-sm font-semibold text-slate-600">Lakhs</span>
              </div>
              <div className="text-xs text-emerald-800 font-semibold mt-1">
                Income gap can be 100% bridged via Varuna direct subsidies
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ INTERACTIVE TOOL 3: District Risk Classification Explorer ═══════ */}
      <section className="p-6 md:p-10 max-w-6xl mx-auto pt-0">
        <div className="v-card p-6 md:p-8 bg-white border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="v-badge bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-xs">
                  INTERACTIVE DIAGNOSTIC 3
                </span>
                <span className="text-xs font-bold text-slate-500">Government Water Table Classification</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                District Risk Matrix & Water Table Inventory
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-1 font-medium">
                Click any risk tier to filter the districts and view live water table telemetry.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Gujarat district..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { cat: 'Over-Exploited', count: categories['Over-Exploited'], color: '#ef4444', border: 'border-rose-300' },
              { cat: 'Critical', count: categories['Critical'], color: '#f59e0b', border: 'border-amber-300' },
              { cat: 'Semi-Critical', count: categories['Semi-Critical'], color: '#eab308', border: 'border-yellow-300' },
              { cat: 'Safe', count: categories['Safe'], color: '#10b981', border: 'border-emerald-300' },
            ].map(item => {
              const isSelected = activeCategoryFilter === item.cat;
              return (
                <div
                  key={item.cat}
                  onClick={() => setActiveCategoryFilter(isSelected ? 'ALL' : item.cat)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{item.cat}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <div className="text-2xl font-black mt-1 tabular-nums">
                    {item.count} <span className="text-xs font-normal opacity-70">Districts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* District Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredDistricts.map(([name, d]) => (
              <div
                key={name}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-xs transition-all flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.risk_color || '#3b82f6' }} />
                    {name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Mean Depth: <strong>{d.mean_depth?.toFixed(1) || 'N/A'}m</strong> · {d.cgwb_category}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onSelectDistrict) onSelectDistrict(name);
                    if (onNavigateToMap) onNavigateToMap();
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-[11px] font-bold transition-all flex items-center gap-1"
                >
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ INTERACTIVE TOOL 4: 30-Year Timeline Explorer ═══════ */}
      <section className="p-6 md:p-10 max-w-6xl mx-auto pt-0">
        <div className="v-card p-6 md:p-8 bg-white border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="v-badge bg-indigo-50 text-indigo-800 border border-indigo-200 font-extrabold text-xs">
              INTERACTIVE DIAGNOSTIC 4
            </span>
            <span className="text-xs font-bold text-slate-500">30-Year Historical Timeline</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-1">
            30 Years of Groundwater Extraction in Gujarat
          </h2>
          <p className="text-xs md:text-sm text-slate-600 mb-6">
            Click on each milestone epoch to observe how technological, electrical, and crop revolutions transformed the aquifer state.
          </p>

          {/* Timeline Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {Object.keys(timelineData).map(yr => {
              const item = timelineData[yr];
              const isSelected = selectedTimelineYear === yr;
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedTimelineYear(yr)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black">{yr}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  </div>
                  <div className="text-xs font-bold mt-1 truncate">{item.title}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Epoch Details */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Epoch: {activeTimeline.year}</span>
                <span className="v-badge text-xs font-bold" style={{ backgroundColor: `${activeTimeline.color}20`, color: activeTimeline.color, borderColor: activeTimeline.color }}>
                  {activeTimeline.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {activeTimeline.title}
              </h3>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                {activeTimeline.headline}
              </p>
            </div>

            <div className="md:w-1/3 grid grid-cols-2 gap-3 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 font-semibold block">Avg Table Depth:</span>
                <span className="text-base font-black text-slate-900">{activeTimeline.depth}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 font-semibold block">Total Extraction:</span>
                <span className="text-base font-black text-slate-900">{activeTimeline.extractRate}</span>
              </div>
              <div className="col-span-2 p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-500 font-semibold block">Tubewell Population:</span>
                <span className="text-sm font-extrabold text-slate-900">{activeTimeline.wells}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA BRIDGE ═══════ */}
      <section className="crisis-bridge">
        <div className="crisis-bridge__content">
          <h2 className="crisis-bridge__title">
            Take Action: Explore the Policy Lab
          </h2>
          <p className="crisis-bridge__text">
            Varuna models the precise crop substitution, micro-irrigation rollout, and sowing calendar
            interventions required to reverse aquifer decline — protecting farmer incomes through
            fully-funded Direct Benefit Transfers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onNavigateToMap} className="crisis-bridge__cta">
              <MapPin className="w-4 h-4" />
              <span>Explore Spatial Map</span>
            </button>
            {onNavigateToCropLab && (
              <button
                onClick={onNavigateToCropLab}
                className="px-6 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Crop Economics Lab</span>
              </button>
            )}
            {onNavigateToStressTest && (
              <button
                onClick={onNavigateToStressTest}
                className="px-6 py-3.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-bold text-sm flex items-center gap-2 border border-slate-700 transition-all"
              >
                <Zap className="w-4 h-4 text-rose-400" />
                <span>Aquifer Stress Simulator</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
