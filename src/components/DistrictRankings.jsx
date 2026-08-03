import React, { useState, useMemo } from 'react';
import { Award, ArrowUpDown, Filter, AlertTriangle, CheckCircle2, Droplet, Sprout, TrendingDown, Search, ArrowRight, ShieldAlert } from 'lucide-react';
import groundwaterData from '../data/groundwater_summary.json';
import cropApy from '../data/crop_apy.json';

export default function DistrictRankings({ onSelectDistrict }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sortField, setSortField] = useState('drawdown'); // drawdown, depth, vulnerability, stationCount
  const [sortAsc, setSortAsc] = useState(false);

  // Process and compute composite vulnerability & rankings for all 32 districts
  const districtRankings = useMemo(() => {
    return Object.values(groundwaterData).map(dist => {
      const crops = cropApy[dist.district] || {};
      const cottonArea = crops['Cotton']?.area_hectares || 0;
      const bajraArea = crops['Pearl Millet (Bajra)']?.area_hectares || 0;
      const totalArea = Object.values(crops).reduce((sum, c) => sum + c.area_hectares, 0);
      const cottonRatio = totalArea > 0 ? (cottonArea / totalArea) * 100 : 0;

      // Composite Vulnerability Score (0 - 100)
      // Depth weight 40%, Drawdown weight 40%, High-water Crop ratio weight 20%
      const depthScore = Math.min(100, (dist.mean_depth / 25) * 100);
      const drawdownScore = Math.min(100, (dist.annual_drawdown_rate / 0.45) * 100);
      const vulnerability = Math.round(depthScore * 0.4 + drawdownScore * 0.4 + cottonRatio * 0.2);

      // Recommended Action
      let recAction = 'Maintain baseline crop balance';
      if (vulnerability > 70) {
        recAction = 'Urgent: Swap 25-35% Cotton acreage to Pearl Millet & advance sowing';
      } else if (vulnerability > 50) {
        recAction = 'Moderate: Expand drip micro-irrigation and shift sowing by +15 days';
      } else if (vulnerability > 30) {
        recAction = 'Minor: Monitor pre-monsoon drawdown and promote MSP wheat alternatives';
      }

      return {
        district: dist.district,
        stationsCount: dist.stations_count,
        meanDepth: dist.mean_depth,
        preMonsoon: dist.pre_monsoon_avg,
        postMonsoon: dist.post_monsoon_avg,
        drawdown: dist.annual_drawdown_rate,
        category: dist.cgwb_category,
        riskColor: dist.risk_color,
        cottonRatio: Math.round(cottonRatio),
        vulnerability,
        recAction
      };
    });
  }, []);

  // Filter & Sort
  const filteredRankings = useMemo(() => {
    return districtRankings
      .filter(item => filterCategory === 'ALL' || item.category === filterCategory)
      .filter(item => item.district.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [districtRankings, filterCategory, searchTerm, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Summary state metrics
  const overExploitedCount = districtRankings.filter(d => d.category === 'Over-Exploited').length;
  const criticalCount = districtRankings.filter(d => d.category === 'Critical').length;
  const avgDrawdown = (districtRankings.reduce((sum, d) => sum + d.drawdown, 0) / districtRankings.length).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="v-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            District Vulnerability Rankings & Hydrological Benchmarks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparative evaluation of all 32 Gujarat districts ranked by CGWB aquifer stress, drawdown velocity, and recommended policy intervention urgency.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            {overExploitedCount} Over-Exploited
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {criticalCount} Critical
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            Avg Drawdown: {avgDrawdown} m/yr
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="v-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search district name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-full font-medium placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Categories (32)</option>
              <option value="Over-Exploited">Over-Exploited Only</option>
              <option value="Critical">Critical Only</option>
              <option value="Semi-Critical">Semi-Critical Only</option>
              <option value="Safe">Safe Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* High Density Ranking Table */}
      <div className="v-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="density-table">
            <thead>
              <tr>
                <th className="w-12 text-center">Rank</th>
                <th>District</th>
                <th className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    CGWB Status <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('meanDepth')}>
                  <div className="flex items-center gap-1">
                    Mean Depth <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('drawdown')}>
                  <div className="flex items-center gap-1">
                    Drawdown Rate <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('cottonRatio')}>
                  <div className="flex items-center gap-1">
                    Cotton Mix % <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="cursor-pointer hover:text-slate-900" onClick={() => handleSort('vulnerability')}>
                  <div className="flex items-center gap-1">
                    Vulnerability Score <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th>Recommended Policy Intervention</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankings.map((item, idx) => (
                <tr key={item.district} className="hover:bg-slate-50 transition-colors">
                  <td className="text-center font-bold text-slate-400 font-mono text-xs">#{idx + 1}</td>
                  <td className="font-bold text-slate-900">
                    <button
                      onClick={() => onSelectDistrict && onSelectDistrict(item.district)}
                      className="hover:text-emerald-700 transition-colors text-left font-bold"
                    >
                      {item.district}
                    </button>
                    <div className="text-[10px] text-slate-400 font-normal font-mono">{item.stationsCount} wells logged</div>
                  </td>
                  <td>
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold border"
                      style={{ borderColor: `${item.riskColor}40`, color: item.riskColor, backgroundColor: `${item.riskColor}15` }}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="font-mono font-semibold text-slate-800">{item.meanDepth} m bgl</td>
                  <td className="font-mono font-bold text-rose-700">+{item.drawdown} m/yr</td>
                  <td className="font-mono text-slate-700">{item.cottonRatio}%</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.vulnerability}%`,
                            backgroundColor: item.vulnerability > 70 ? '#dc2626' : item.vulnerability > 45 ? '#d97706' : '#16a34a'
                          }}
                        />
                      </div>
                      <span className="font-mono font-bold text-xs" style={{ color: item.vulnerability > 70 ? '#dc2626' : item.vulnerability > 45 ? '#d97706' : '#16a34a' }}>
                        {item.vulnerability}/100
                      </span>
                    </div>
                  </td>
                  <td className="text-xs text-slate-600 font-medium">{item.recAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
