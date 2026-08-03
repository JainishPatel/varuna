import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, IndianRupee, Droplet, ArrowUpRight, ArrowDownRight, Layers, BarChart3, Activity, Cpu } from 'lucide-react';
import { predictRevenue, getModelMetadata } from '../utils/mlInference.js';

const lightTooltipStyle = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#0f172a',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
};

export default function AnalyticsPanel({ simulationResults, selectedDistrict, marketPrices, cropAllocations, sowingShift = 0, groundwaterData = {} }) {
  const {
    waterSavedMCM, waterSavedPercent, revenueChangeCrores, revenueChangePercent,
    simulatedRevenuePerHa, baselineRevenuePerHa, trajectoryData, cropValueBreakdown
  } = simulationResults;

  const isRevenuePositive = revenueChangeCrores >= 0;

  // ML Revenue Prediction
  const mlMeta = getModelMetadata();
  const districtData = selectedDistrict === 'ALL' || !groundwaterData[selectedDistrict]
    ? { mean_depth: 8.5, annual_drawdown_rate: 0.1 }
    : groundwaterData[selectedDistrict];
  const revPred = predictRevenue(cropAllocations, sowingShift, districtData);

  // Water demand bar chart data
  const waterBarData = cropValueBreakdown.map(item => ({
    name: item.name.length > 10 ? item.name.substring(0, 10) + '…' : item.name,
    fullName: item.name,
    waterReq: item.waterReq,
    share: item.share,
    color: item.color
  }));

  // Revenue pie data
  const revenuePieData = cropValueBreakdown.map(item => ({
    name: item.name,
    value: Math.round(item.share * item.grossRevenue / 100),
    color: item.color
  }));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700" />
          Hydro-Economic Impact & Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {selectedDistrict === 'ALL' ? 'Statewide Gujarat' : `${selectedDistrict} District`} · FAO-56 Simulation Metrics
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Water Saved */}
        <div className="stat-card water">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <Droplet className="w-3.5 h-3.5 text-sky-600" /> Net Water Saved
          </div>
          <div className="text-2xl font-extrabold text-sky-900 tabular-nums">
            {waterSavedMCM.toLocaleString()} <span className="text-xs font-normal text-slate-500">MCM/yr</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <span className={`v-badge ${waterSavedPercent >= 0 ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {waterSavedPercent > 0 ? '+' : ''}{waterSavedPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">vs baseline</span>
          </div>
        </div>

        {/* Revenue Impact */}
        <div className={`stat-card ${isRevenuePositive ? 'revenue' : 'danger'}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Revenue Impact
          </div>
          <div className={`text-2xl font-extrabold tabular-nums ${isRevenuePositive ? 'text-emerald-900' : 'text-rose-700'}`}>
            {isRevenuePositive ? '+' : ''}{revenueChangeCrores.toFixed(1)} <span className="text-xs font-normal text-slate-500">₹ Cr</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <span className={`v-badge ${isRevenuePositive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {isRevenuePositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {revenueChangePercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Yield Value */}
        <div className="stat-card neutral">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Yield Value / Ha</div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            ₹{Math.round(simulatedRevenuePerHa).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1.5">
            Baseline: ₹{Math.round(baselineRevenuePerHa).toLocaleString()}
          </div>
        </div>

        {/* Water Productivity */}
        <div className="stat-card water">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Water Productivity</div>
          <div className="text-2xl font-extrabold text-indigo-900 tabular-nums">
            ₹{(simulatedRevenuePerHa / 45.0).toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1.5">per m³ irrigation water</div>
        </div>
      </div>

      {/* ML Prediction Banner */}
      {revPred && (
        <div className="v-card p-4 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Random Forest Revenue Prediction</div>
              <div className="text-[10px] text-slate-500">Based on {mlMeta?.revenue?.nTrees} decision trees (R²: {mlMeta?.revenue?.r2Score})</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-900">₹{revPred.predicted.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ ha</span></div>
            <div className="text-[10px] font-mono text-slate-500">Range: ₹{revPred.range[0].toLocaleString()} - ₹{revPred.range[1].toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trajectory Chart */}
        <div className="v-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Groundwater Trajectory (2020-2035)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">Depth m bgl</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
                <YAxis reversed domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={lightTooltipStyle} formatter={(value) => [`${value} m bgl`, '']} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="baselineDepth" name="Baseline" stroke="#dc2626" fillOpacity={1} fill="url(#baseGrad)" strokeWidth={1.5} strokeDasharray="5 5" />
                <Area type="monotone" dataKey="simulatedDepth" name="Simulated" stroke="#16a34a" fillOpacity={1} fill="url(#simGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water Demand Bar Chart */}
        <div className="v-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              Crop Water Demand
            </h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold">m³/ha</span>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterBarData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }} barSize={32}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={lightTooltipStyle} formatter={(val, name, props) => [`${val.toLocaleString()} m³/ha`, props.payload.fullName]} />
                <Bar dataKey="waterReq" radius={[4, 4, 0, 0]}>
                  {waterBarData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Pie + Matrix Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Share Pie */}
        <div className="v-card p-5 flex flex-col items-center justify-center">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-1.5 self-start uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            Revenue Share
          </h3>
          <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenuePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {revenuePieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [`₹${val.toLocaleString()}/ha`, name]} contentStyle={lightTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {cropValueBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.color }}></span>
                {item.name}
              </div>
            ))}
          </div>
        </div>

        {/* Crop Matrix Table */}
        <div className="v-card p-5 lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between uppercase tracking-wider">
            <span>Crop Economic & Water Mix Matrix</span>
            <span className="font-normal text-slate-500 text-[10px] font-mono">Real APMC Mandi Rates</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="density-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Share</th>
                  <th>Water Req</th>
                  <th>Mandi Price</th>
                  <th className="text-right">Gross Rev</th>
                </tr>
              </thead>
              <tbody>
                {cropValueBreakdown.map(item => (
                  <tr key={item.name}>
                    <td className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </td>
                    <td className="font-bold tabular-nums" style={{ color: item.color }}>{item.share}%</td>
                    <td className="text-slate-600 font-mono tabular-nums">{item.waterReq.toLocaleString()} m³</td>
                    <td className="text-slate-700 font-mono">₹{item.mandiPrice.toLocaleString()}/qtl</td>
                    <td className="text-right font-extrabold text-slate-900 tabular-nums">₹{Math.round(item.grossRevenue).toLocaleString()}/ha</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
