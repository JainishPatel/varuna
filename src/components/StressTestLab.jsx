import React, { useState, useMemo } from 'react';
import {
  Zap, AlertTriangle, ShieldCheck, Droplets, RefreshCw,
  TrendingDown, TrendingUp, Calendar, Compass, Flame,
  Layers, Search, CheckCircle2, ChevronRight, Activity,
  Sliders, Gauge, Clock, ShieldAlert, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ReferenceLine, CartesianGrid
} from 'recharts';

export default function StressTestLab({
  groundwaterData = {},
  selectedDistrict = 'Banaskantha',
  setSelectedDistrict,
  onNavigateToSimulate,
  onNavigateToCropLab
}) {
  // Climate Stress Levers
  const [monsoonDeficit, setMonsoonDeficit] = useState(-20); // % rainfall anomaly (-40 to +30)
  const [droughtYears, setDroughtYears] = useState(2); // consecutive drought years (1 to 5)
  const [extractionGrowth, setExtractionGrowth] = useState(3); // annual extraction drift % (-5 to +8)
  const [canalReliability, setCanalReliability] = useState(60); // % canal water delivery (0 to 100)

  // Policy Defense Levers
  const [enableCropShift, setEnableCropShift] = useState(true);
  const [enableDripMandate, setEnableDripMandate] = useState(true);
  const [enableCheckDams, setEnableCheckDams] = useState(false);
  const [enableSolarRationing, setEnableSolarRationing] = useState(false);

  // Search & filter in table
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');

  // Active district data
  // Chart scale view mode: 'focused' (dynamic auto-zoom) or 'full' (0-95m bedrock view)
  const [chartScaleMode, setChartScaleMode] = useState('focused');

  // Active district data
  const isStatewide = selectedDistrict === 'ALL';
  const districtList = Object.keys(groundwaterData || {}).sort();

  const district = useMemo(() => {
    if (isStatewide) {
      return {
        district: 'Statewide Gujarat',
        mean_depth: 14.2,
        annual_drawdown_rate: 0.35,
        cgwb_category: 'Semi-Critical / Over-Exploited Basin',
        stations_count: 46426,
        risk_color: '#ea580c'
      };
    }
    return groundwaterData[selectedDistrict] || {
      district: selectedDistrict,
      mean_depth: 14.5,
      annual_drawdown_rate: 0.38,
      cgwb_category: 'Critical',
      stations_count: 1200,
      risk_color: '#ea580c'
    };
  }, [selectedDistrict, isStatewide, groundwaterData]);

  // Physics & Hydrogeological modeling of trajectory (2024 - 2040)
  const simulationTrajectory = useMemo(() => {
    const baseDepth = district.mean_depth || 14.5;
    
    // Categorical base annual drawdown rate (m/yr)
    let catRate = 0.55;
    if (district.cgwb_category?.includes('Over-Exploited')) catRate = 1.10;
    else if (district.cgwb_category?.includes('Critical')) catRate = 0.80;
    else if (district.cgwb_category?.includes('Semi-Critical')) catRate = 0.55;
    else catRate = 0.35;

    const historicalAnnualRate = Math.max(0.40, Math.abs(district.annual_drawdown_rate || catRate) * 1.4);

    // Realistic Climate Stress:
    // Negative rainfall anomaly (-10% to -40%) slashes natural percolation while borewell pumping surges
    const rainfallStressAdd = monsoonDeficit < 0 ? (-monsoonDeficit / 10) * 0.45 : (monsoonDeficit / 10) * -0.25;
    const canalDeficitPenalty = ((100 - canalReliability) / 100) * 0.40;
    const extractionFactor = (extractionGrowth / 100) * 0.60;

    const stressAnnualDrawdown = Math.max(0.25, historicalAnnualRate + rainfallStressAdd + canalDeficitPenalty + extractionFactor);

    // Defense reduction factors
    let policySavings = 0;
    if (enableCropShift) policySavings += 0.40; // 40% reduction by shifting cotton to pulses/bajra
    if (enableDripMandate) policySavings += 0.25; // 25% evaporation reduction
    if (enableSolarRationing) policySavings += 0.15; // 15% daytime pumping cap
    const artificialRechargeCredit = enableCheckDams ? 0.70 : 0.0; // 0.70m/yr water table boost from check dams

    // Net drawdown under Varuna policy (can even achieve net recharge)
    const varunaAnnualDrawdown = Math.max(-0.35, (stressAnnualDrawdown * (1 - policySavings)) - artificialRechargeCredit);

    // Salinity & Bedrock thresholds
    const salinityThreshold = 45.0; // meters
    const exhaustionThreshold = 85.0; // meters (Day Zero)

    const years = [];
    let curBAUDepth = baseDepth;
    let curStressDepth = baseDepth;
    let curVarunaDepth = baseDepth;

    let dayZeroBAU = null;
    let dayZeroStress = null;
    let dayZeroVaruna = null;

    for (let yr = 2024; yr <= 2040; yr++) {
      const yearIdx = yr - 2024;
      const isDroughtActive = yearIdx < droughtYears;

      // Status Quo (BAU): baseline rate plus modest compounding drift
      const bauRate = historicalAnnualRate + (yearIdx * 0.02);
      curBAUDepth = Math.min(100, curBAUDepth + bauRate);

      // Stress Reality: severe drawdown during drought years, then lingering basin deficit
      const currentYearStressRate = isDroughtActive
        ? stressAnnualDrawdown * 1.35
        : stressAnnualDrawdown * 0.85;
      curStressDepth = Math.min(100, curStressDepth + currentYearStressRate);

      // Varuna Plan: mitigated drawdown, stabilizing and curving upward
      const currentVarunaRate = isDroughtActive
        ? varunaAnnualDrawdown * 1.15
        : varunaAnnualDrawdown * 0.55;
      curVarunaDepth = Math.max(2.0, Math.min(100, curVarunaDepth + currentVarunaRate));

      if (curBAUDepth >= exhaustionThreshold && !dayZeroBAU) dayZeroBAU = yr;
      if (curStressDepth >= exhaustionThreshold && !dayZeroStress) dayZeroStress = yr;
      if (curVarunaDepth >= exhaustionThreshold && !dayZeroVaruna) dayZeroVaruna = yr;

      years.push({
        year: yr.toString(),
        'Status Quo (BAU)': parseFloat(curBAUDepth.toFixed(1)),
        'Stress Tested Reality': parseFloat(curStressDepth.toFixed(1)),
        'With Varuna Plan': parseFloat(curVarunaDepth.toFixed(1)),
        salinityLimit: salinityThreshold,
        exhaustionLimit: exhaustionThreshold
      });
    }

    // Dynamic scale bounds for focused view
    const allDepths = years.flatMap(y => [
      y['Status Quo (BAU)'],
      y['Stress Tested Reality'],
      y['With Varuna Plan']
    ]);
    const minD = Math.min(...allDepths);
    const maxD = Math.max(...allDepths);
    const focusedDomain = [
      Math.max(0, Math.floor(minD - 2)),
      Math.ceil(maxD + 4)
    ];

    return {
      trajectory: years,
      dayZeroBAU: dayZeroBAU || 'Post-2040',
      dayZeroStress: dayZeroStress || 'Post-2040',
      dayZeroVaruna: dayZeroVaruna || 'Secured (>2040)',
      baseDepth,
      salinityThreshold,
      exhaustionThreshold,
      stressRate: stressAnnualDrawdown,
      varunaRate: varunaAnnualDrawdown,
      focusedDomain
    };
  }, [
    district, monsoonDeficit, droughtYears, extractionGrowth, canalReliability,
    enableCropShift, enableDripMandate, enableCheckDams, enableSolarRationing
  ]);

  // Statewide Vulnerability Ranking under current stress scenario
  const rankedDistricts = useMemo(() => {
    return districtList.map(name => {
      const d = groundwaterData[name] || {};
      const depth = d.mean_depth || 10.0;
      const rate = Math.max(0.35, Math.abs(d.annual_drawdown_rate || 0.40));

      const rainfallFactor = 1.0 - (monsoonDeficit / 100) * 1.5;
      const stressRate = rate * rainfallFactor * (1 + extractionGrowth / 100);
      const projected2030Depth = depth + (stressRate * 6);
      const yearsToDayZero = Math.max(1, Math.round((85.0 - depth) / stressRate));

      let riskTier = 'Moderate';
      if (projected2030Depth > 40 || yearsToDayZero <= 8) riskTier = 'Extreme';
      else if (projected2030Depth > 25 || yearsToDayZero <= 15) riskTier = 'High';

      return {
        name,
        currentDepth: depth,
        projected2030Depth: parseFloat(projected2030Depth.toFixed(1)),
        yearsToDayZero,
        cgwb: d.cgwb_category || 'Safe',
        riskTier,
        riskColor: d.risk_color || '#3b82f6'
      };
    }).sort((a, b) => b.projected2030Depth - a.projected2030Depth);
  }, [districtList, groundwaterData, monsoonDeficit, extractionGrowth]);

  const filteredRankings = rankedDistricts.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = selectedRiskFilter === 'ALL' || item.cgwb === selectedRiskFilter;
    return matchesSearch && matchesRisk;
  });

  const chartYDomain = chartScaleMode === 'focused' ? simulationTrajectory.focusedDomain : [0, 95];

  return (
    <div className="stress-lab-container">
      {/* ───── Hero Header (Executive Light Theme) ───── */}
      <div className="v-card p-6 md:p-8 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="v-badge bg-rose-50 text-rose-800 border border-rose-200 text-xs font-extrabold">
                CLIMATE CRISIS STRESS LAB
              </span>
              <span className="text-xs font-bold text-slate-500">
                {isStatewide ? 'Statewide Aggregate' : `${selectedDistrict} Aquifer System`}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Aquifer Stress Lab & Drought Simulator
            </h1>
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed font-medium">
              Stress-test Gujarat's groundwater basins against multi-year monsoon failures and intensive tube-well extraction.
              Watch curves adjust instantly, track when salinity barriers are hit, and simulate how Varuna policy interventions keep water tables safe.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToCropLab && (
              <button
                onClick={onNavigateToCropLab}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <span>Crop Economics Lab</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ───── Top KPI Cards: The Day Zero Clock ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* KPI 1: Day Zero Status */}
        <div className="stat-card danger">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-600" /> Stress "Day Zero"
            </span>
            <span className="v-badge bg-rose-50 text-rose-800 border border-rose-200 font-bold">
              UNMITIGATED
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-rose-900 tabular-nums">
            {simulationTrajectory.dayZeroStress}
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2">
            Aquifer reaches 85m bedrock depletion threshold
          </div>
        </div>

        {/* KPI 2: With Varuna Protection */}
        <div className="stat-card revenue">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> With Varuna Plan
            </span>
            <span className="v-badge bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              PROTECTED
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-900 tabular-nums">
            {simulationTrajectory.dayZeroVaruna}
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2">
            Drawdown rate curtailed to {simulationTrajectory.varunaRate.toFixed(2)} m/yr
          </div>
        </div>

        {/* KPI 3: Current Water Table Depth */}
        <div className="stat-card water">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-600" /> Current Basin Depth
            </span>
            <span className="v-badge bg-sky-50 text-sky-800 border border-sky-200 font-bold">
              OBSERVED
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-sky-900 tabular-nums">
            {district.mean_depth?.toFixed(1) || '10.4'} <span className="text-sm font-semibold text-slate-600">Meters</span>
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2">
            Category: <strong>{district.cgwb_category}</strong>
          </div>
        </div>

        {/* KPI 4: Water Security Runway Gained */}
        <div className="stat-card neutral">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600" /> Safe Water Runway
            </span>
            <span className="v-badge bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold">
              +RUNWAY
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-indigo-900 tabular-nums">
            +15+ <span className="text-sm font-semibold text-slate-600">Years</span>
          </div>
          <div className="text-xs text-slate-600 font-medium mt-2">
            Halts seawater ingress and prevents deep mineral salinity
          </div>
        </div>
      </div>

      {/* ───── Middle Section: Chart & Simulation Levers ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left 8 Cols: 2024-2040 Projection Chart */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="v-card p-6 bg-white border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  Aquifer Depth Trajectory: 2024–2040 Stress Simulation
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Depth in meters below ground. Downward curve indicates falling water table.
                </p>
              </div>

              {/* Chart Scale Switcher + District Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setChartScaleMode('focused')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      chartScaleMode === 'focused' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Focused View
                  </button>
                  <button
                    onClick={() => setChartScaleMode('full')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      chartScaleMode === 'full' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Full Scale (0–95m)
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">Basin:</span>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict && setSelectedDistrict(e.target.value)}
                    className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
                  >
                    <option value="ALL">Statewide Gujarat</option>
                    {districtList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Trajectory Area Chart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={simulationTrajectory.trajectory}
                  margin={{ top: 15, right: 110, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
                  <YAxis
                    reversed
                    domain={chartYDomain}
                    tick={{ fill: '#475569', fontSize: 11 }}
                    label={{ value: 'Depth (Meters)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, offset: 10 }}
                  />
                  <Tooltip
                    formatter={(val, name) => [`${val} Meters`, name]}
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                  {/* Threshold Lines - displayed when in range */}
                  {chartYDomain[1] >= 45 && (
                    <ReferenceLine
                      y={45}
                      label={{ value: 'Salinity Limit (45m)', fill: '#ea580c', fontSize: 10, position: 'right' }}
                      stroke="#ea580c"
                      strokeDasharray="4 4"
                    />
                  )}
                  {chartYDomain[1] >= 85 && (
                    <ReferenceLine
                      y={85}
                      label={{ value: 'Bedrock Collapse (85m)', fill: '#dc2626', fontSize: 10, position: 'right' }}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Local acute stress line for focused view */}
                  {chartScaleMode === 'focused' && (
                    <ReferenceLine
                      y={parseFloat((district.mean_depth + 6).toFixed(1))}
                      label={{ value: 'Acute Deficit (+6m)', fill: '#f97316', fontSize: 10, position: 'right' }}
                      stroke="#f97316"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Curves */}
                  <Line
                    type="monotone"
                    dataKey="Status Quo (BAU)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Stress Tested Reality"
                    stroke="#ef4444"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="With Varuna Plan"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200 mt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-900 block">Status Quo (BAU):</span>
                <span className="text-amber-800">Historical trend continues. Bedrock hit by {simulationTrajectory.dayZeroBAU}.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-900 block">Stress Tested:</span>
                <span className="text-rose-800">{monsoonDeficit}% monsoon deficit accelerates exhaustion to {simulationTrajectory.dayZeroStress}.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 block">Varuna Defense:</span>
                <span className="text-emerald-800">Crop shift + drip flattens trajectory, keeping basin safely above bedrock.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Interactive Stress & Policy Levers */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Climate Shock Levers */}
          <div className="v-card p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 mb-4">
              <Flame className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Simulate Climate & Drought Scenarios
              </h3>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Monsoon Deficit */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Monsoon Rainfall Anomaly</span>
                  <span className={`px-2 py-0.5 rounded font-extrabold ${monsoonDeficit < 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {monsoonDeficit > 0 ? '+' : ''}{monsoonDeficit}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="30"
                  step="5"
                  value={monsoonDeficit}
                  onChange={(e) => setMonsoonDeficit(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-0.5">
                  <span>-40% (Drought)</span>
                  <span>0% (Normal)</span>
                  <span>+30% (Surplus)</span>
                </div>
              </div>

              {/* Consecutive Drought Years */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Consecutive Drought Years</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold">
                    {droughtYears} {droughtYears === 1 ? 'Year' : 'Years'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={droughtYears}
                  onChange={(e) => setDroughtYears(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-0.5">
                  <span>1 Yr (Single Failure)</span>
                  <span>3 Yrs (Severe Cycle)</span>
                  <span>5 Yrs (Mega-Drought)</span>
                </div>
              </div>

              {/* Tubewell Growth Drift */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Extraction Growth Rate / Drift</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-extrabold">
                    +{extractionGrowth}%/yr
                  </span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="8"
                  step="1"
                  value={extractionGrowth}
                  onChange={(e) => setExtractionGrowth(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-0.5">
                  <span>-5% (Cap)</span>
                  <span>+3% (Current)</span>
                  <span>+8% (Boom)</span>
                </div>
              </div>

              {/* Canal Water Supply */}
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Canal Supply Reliability</span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-extrabold">
                    {canalReliability}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={canalReliability}
                  onChange={(e) => setCanalReliability(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-0.5">
                  <span>0% (Canal Failure)</span>
                  <span>50% (Rationed)</span>
                  <span>100% (Full Narmada)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Defense Levers */}
          <div className="v-card p-5 bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Varuna Policy Interventions
              </h3>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Crop Shift to Bajra / Pulses', state: enableCropShift, set: setEnableCropShift, saving: '-40% Draft' },
                { label: 'Mandatory Drip Irrigation', state: enableDripMandate, set: setEnableDripMandate, saving: '-25% Loss' },
                { label: 'Check Dam Artificial Recharge', state: enableCheckDams, set: setEnableCheckDams, saving: '+Recharge' },
                { label: 'Daytime Solar Power Limit (8 hrs)', state: enableSolarRationing, set: setEnableSolarRationing, saving: '-15% Pumping' },
              ].map((lever, idx) => (
                <div
                  key={idx}
                  onClick={() => lever.set(!lever.state)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    lever.state
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${lever.state ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      {lever.state ? '✓' : ''}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{lever.label}</span>
                  </div>
                  <span className="v-badge bg-white text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    {lever.saving}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ───── Bottom Section: Statewide Vulnerability Ranking Table ───── */}
      <div className="v-card p-6 mt-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 mb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Statewide Groundwater Risk Ranking (Under Active Stress Scenario)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Ranked by projected depth at 2030 and urgency of water table depletion.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Filter by CGWB category */}
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
            >
              <option value="ALL">All Categories</option>
              <option value="Over-Exploited">Over-Exploited</option>
              <option value="Critical">Critical</option>
              <option value="Semi-Critical">Semi-Critical</option>
              <option value="Safe">Safe</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-left font-bold">
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">CGWB Category</th>
                <th className="py-2.5 px-3 text-right">Current Depth</th>
                <th className="py-2.5 px-3 text-right text-rose-700">Projected 2030 Depth</th>
                <th className="py-2.5 px-3 text-center">Years to Day Zero</th>
                <th className="py-2.5 px-3 text-center">Stress Risk</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRankings.slice(0, 10).map((row, idx) => (
                <tr
                  key={row.name}
                  className={`hover:bg-slate-50/80 transition-colors ${selectedDistrict === row.name ? 'bg-emerald-50/50' : ''}`}
                >
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.riskColor }} />
                    {row.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="v-badge bg-slate-100 text-slate-800 font-semibold">
                      {row.cgwb}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700">
                    {row.currentDepth.toFixed(1)} m
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-rose-700">
                    {row.projected2030Depth.toFixed(1)} m
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">
                    <span className={`px-2 py-0.5 rounded font-black ${row.yearsToDayZero <= 8 ? 'bg-rose-100 text-rose-800' : row.yearsToDayZero <= 15 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                      {row.yearsToDayZero} Years
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`v-badge font-bold ${row.riskTier === 'Extreme' ? 'bg-rose-50 text-rose-800 border border-rose-200' : row.riskTier === 'High' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                      {row.riskTier}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedDistrict && setSelectedDistrict(row.name)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    >
                      Test in Simulator
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
