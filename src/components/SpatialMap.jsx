import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import { 
  MapPin, Layers, Activity, Info, Droplet, Sprout, TrendingDown, 
  ChevronRight, X, BarChart3, Waves, Play, Pause, RotateCcw, Calendar
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip } from 'recharts';

import riverStations from '../data/river_stations.json';
import historicalTimeline from '../data/historical_timeline.json';

const TIMELINE_YEARS = ['1995', '2000', '2005', '2010', '2015', '2020', '2025', '2030', '2035'];

const TIMELINE_NARRATIVES = {
  '1995': '1995 Baseline: Aquifers predominantly Safe (Average depth 6.8m bgl). Flood irrigation widespread.',
  '2000': '2000 Period: Early signs of groundwater stress in Mehsana and Gandhinagar.',
  '2005': '2005 Bt-Cotton Boom: Submersible tubewell adoption surges across North Gujarat and Saurashtra.',
  '2010': '2010 Drawdown: Banaskantha and Patan cross the 12m critical threshold; pumping load doubles.',
  '2015': '2015 Water Stress: Pre-monsoon water tables drop below 16m in semi-arid basins.',
  '2020': '2020 Accelerated Over-Draft: 15 districts categorized Critical or Over-Exploited by CGWB.',
  '2025': '2025 Present Day: 18 of 32 districts in severe depletion; statewide water deficit ~4,200 MCM/yr.',
  '2030': '2030 Interim Horizon: Projected impact of crop diversification and 30% drip irrigation adoption.',
  '2035': '2035 Simulated Target: Bajra substitution + 50% GGRC drip penetration stabilizes aquifer recharge.'
};

function MapViewController({ selectedDistrict, geojson }) {
  const map = useMap();
  useEffect(() => {
    if (selectedDistrict && selectedDistrict !== 'ALL' && geojson) {
      const feature = geojson.features.find(f => f.properties.name === selectedDistrict);
      if (feature && feature.geometry && feature.geometry.coordinates) {
        let allCoords = [];
        if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach(poly => poly[0].forEach(c => allCoords.push(c)));
        } else {
          allCoords = feature.geometry.coordinates[0];
        }
        const lats = allCoords.map(c => c[1]);
        const lngs = allCoords.map(c => c[0]);
        const bounds = [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
        map.flyToBounds(bounds, { duration: 1.2, padding: [30, 30] });
      }
    } else {
      map.flyTo([22.5, 71.5], 7, { duration: 1.0 });
    }
  }, [selectedDistrict, geojson, map]);
  return null;
}

export default function SpatialMap({ geojson, groundwaterData, selectedDistrict, setSelectedDistrict, simulatedDistricts = {}, cropApy }) {
  const [showWells, setShowWells] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [timelineYear, setTimelineYear] = useState('2025');
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play timeline animation
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineYear(current => {
          const idx = TIMELINE_YEARS.indexOf(current);
          if (idx === -1 || idx === TIMELINE_YEARS.length - 1) {
            return TIMELINE_YEARS[0];
          }
          return TIMELINE_YEARS[idx + 1];
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Compute statewide summary stats for active year
  const statewideSummary = useMemo(() => {
    const cats = { 'Safe': 0, 'Semi-Critical': 0, 'Critical': 0, 'Over-Exploited': 0 };
    let totalDepth = 0;
    let count = 0;

    if (timelineYear <= '2025' && historicalTimeline.by_year[timelineYear]) {
      const yearMap = historicalTimeline.by_year[timelineYear];
      Object.values(yearMap).forEach(d => {
        cats[d.category] = (cats[d.category] || 0) + 1;
        totalDepth += d.depth;
        count++;
      });
    } else {
      Object.values(simulatedDistricts).forEach(sim => {
        cats[sim.simulated_category] = (cats[sim.simulated_category] || 0) + 1;
        totalDepth += sim.simulated_depth;
        count++;
      });
    }
    return { cats, avgDepth: count > 0 ? (totalDepth / count).toFixed(1) : '--', total: count };
  }, [simulatedDistricts, timelineYear]);

  const getFeatureColor = (districtName) => {
    // If exploring historical years (1995-2025)
    if (timelineYear <= '2025') {
      const hist = historicalTimeline?.by_year?.[timelineYear]?.[districtName];
      if (hist && hist.color) return hist.color;
    }
    // Projected / Simulated horizon (2030-2035)
    const sim = simulatedDistricts[districtName];
    if (!sim) return '#16a34a';
    const cat = sim.simulated_category;
    if (cat === 'Over-Exploited') return '#dc2626';
    if (cat === 'Critical') return '#ea580c';
    if (cat === 'Semi-Critical') return '#d97706';
    return '#16a34a';
  };

  const styleFeature = (feature) => {
    const distName = feature.properties.name;
    const isSelected = selectedDistrict === distName;
    const color = getFeatureColor(distName);
    return {
      fillColor: color,
      weight: isSelected ? 2.5 : 1,
      opacity: 1,
      color: isSelected ? '#0f172a' : '#ffffff',
      fillOpacity: isSelected ? 0.7 : 0.45
    };
  };

  const onEachFeature = (feature, layer) => {
    const distName = feature.properties.name;
    const gw = groundwaterData[distName];
    const sim = simulatedDistricts[distName] || {};

    layer.on({
      mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.8, weight: 2.5 }); },
      mouseout: (e) => { e.target.setStyle(styleFeature(feature)); },
      click: () => { setSelectedDistrict(distName); }
    });

    layer.bindPopup(`
      <div style="min-width:180px">
        <div style="font-weight:800;font-size:13px;color:#0f172a;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">${distName}</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
          <span style="color:#64748b">Status</span>
          <span style="font-weight:700;color:${sim.simulated_risk_color || '#16a34a'}">${sim.simulated_category || 'Safe'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
          <span style="color:#64748b">Depth</span>
          <span style="font-weight:700;color:#0f172a">${gw ? gw.mean_depth : '--'} m</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11px">
          <span style="color:#64748b">Drawdown</span>
          <span style="font-weight:700;color:#dc2626">${gw ? gw.annual_drawdown_rate : '--'} m/yr</span>
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:6px;font-style:italic">Click for full details →</div>
      </div>
    `);
  };

  let sampleWellMarkers = [];
  if (showWells && groundwaterData) {
    Object.values(groundwaterData).forEach(gw => {
      if (selectedDistrict === 'ALL' || selectedDistrict === gw.district) {
        if (gw.sample_wells) {
          gw.sample_wells.forEach(well => {
            sampleWellMarkers.push({
              district: gw.district, name: well.name, tehsil: well.tehsil,
              lat: well.lat, lng: well.lng, depth: well.avg_depth
            });
          });
        }
      }
    });
  }

  const selectedGw = selectedDistrict !== 'ALL' ? groundwaterData[selectedDistrict] : null;
  const selectedSim = selectedDistrict !== 'ALL' ? simulatedDistricts[selectedDistrict] : null;
  const selectedCrops = selectedDistrict !== 'ALL' && cropApy ? cropApy[selectedDistrict] : null;

  // Build historical sparkline data
  const historyData = selectedGw?.yearly_history || [];

  const categoryColors = {
    'Safe': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-600' },
    'Semi-Critical': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-600' },
    'Critical': { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', dot: 'bg-orange-600' },
    'Over-Exploited': { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-600' },
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Map Area */}
      <div className="flex-1 relative">
        {geojson && (
          <MapContainer
            center={[22.5, 71.5]}
            zoom={7}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
            <GeoJSON
              key={JSON.stringify(simulatedDistricts) + selectedDistrict}
              data={geojson}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
            {/* Ground Water Wells */}
            {showWells && sampleWellMarkers.map((w, idx) => (
              <CircleMarker
                key={`well-${idx}`}
                center={[w.lat, w.lng]}
                radius={3.5}
                pathOptions={{
                  fillColor: '#0284c7',
                  fillOpacity: 0.85,
                  color: '#ffffff',
                  weight: 1.5
                }}
              >
                <Popup>
                  <div style={{fontSize:'12px'}}>
                    <strong style={{color:'#0284c7'}}>{w.name}</strong>
                    <div style={{color:'#64748b',marginTop:'2px'}}>Tehsil: {w.tehsil} · {w.district}</div>
                    <div style={{fontWeight:700,color:'#16a34a',marginTop:'4px'}}>{w.depth} m bgl</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* River Discharge Stations */}
            {showRivers && riverStations.map((r, idx) => (
              <CircleMarker
                key={`river-${idx}`}
                center={[r.lat, r.lng]}
                radius={Math.min(8, Math.max(4, Math.log10(r.peak_monsoon_m3s + 1) * 2.2))}
                pathOptions={{
                  fillColor: '#06b6d4',
                  fillOpacity: 0.9,
                  color: '#083344',
                  weight: 1.5
                }}
              >
                <Popup>
                  <div style={{minWidth:'200px', fontSize:'11px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'4px', color:'#0891b2', fontWeight:800, fontSize:'12px'}}>
                      <span>🌊</span>
                      <span>{r.river}</span>
                    </div>
                    <div style={{color:'#475569', marginTop:'2px', fontWeight:600}}>
                      Station: {r.station} ({r.district})
                    </div>
                    <div style={{color:'#64748b', fontSize:'10px', marginTop:'2px'}}>
                      Basin: {r.basin}
                    </div>
                    <div style={{marginTop:'6px', paddingTop:'4px', borderTop:'1px solid #e2e8f0', display:'flex', flexDirection:'column', gap:'2px'}}>
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                        <span style={{color:'#64748b'}}>Peak Monsoon Flow:</span>
                        <strong style={{color:'#0284c7'}}>{r.peak_monsoon_m3s.toLocaleString()} m³/s</strong>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                        <span style={{color:'#64748b'}}>Lean Summer Flow:</span>
                        <strong style={{color: r.lean_summer_m3s < 1 ? '#dc2626' : '#16a34a'}}>
                          {r.lean_summer_m3s.toLocaleString()} m³/s
                        </strong>
                      </div>
                    </div>
                    {r.lean_summer_m3s < 1 && (
                      <div style={{marginTop:'6px', padding:'3px 6px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'4px', color:'#b91c1c', fontSize:'9px', lineHeight:'1.2'}}>
                        ⚠️ Flow dries out post-monsoon; driving 100% agricultural tubewell reliance.
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            <MapViewController selectedDistrict={selectedDistrict} geojson={geojson} />
          </MapContainer>
        )}

        {/* Top Control Bar: Layer Toggles */}
        <div className="absolute top-4 left-4 z-[400] flex items-center gap-2">
          <button
            onClick={() => setShowWells(!showWells)}
            className={`v-card px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              showWells ? 'bg-sky-50 text-sky-800 border-sky-300' : 'bg-white text-slate-500'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-sky-600" />
            {showWells ? 'Wells (ON)' : 'Wells (OFF)'}
          </button>

          <button
            onClick={() => setShowRivers(!showRivers)}
            className={`v-card px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              showRivers ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-white text-slate-500'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-cyan-600" />
            {showRivers ? 'Rivers (77 Gauges)' : 'Rivers (OFF)'}
          </button>
        </div>

        {/* Floating Legend */}
        <div className="absolute top-16 left-4 z-[400] v-card p-3 text-xs bg-white/95 backdrop-blur-sm border-slate-300 shadow-md">
          <div className="font-extrabold text-slate-800 mb-2 text-xs uppercase tracking-wider">Aquifer Status</div>
          <div className="space-y-1.5">
            {[
              { color: '#16a34a', label: 'Safe' },
              { color: '#d97706', label: 'Semi-Critical' },
              { color: '#ea580c', label: 'Critical' },
              { color: '#dc2626', label: 'Over-Exploited' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs text-slate-800 font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───── Bottom Timeline Player Controller (Executive Light Theme) ───── */}
        <div className="absolute bottom-4 left-4 right-4 z-[400] p-3.5 rounded-xl bg-white/95 text-slate-900 backdrop-blur-md border border-slate-300 shadow-xl">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
                  title={isPlaying ? 'Pause Timeline' : 'Play Timeline Animation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-slate-900">
                    Groundwater Timeline: <span className="text-emerald-700">{timelineYear}</span>
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {timelineYear <= '2025' ? '(Observed Telemetry)' : '(Projected Simulation)'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-700 font-bold hidden md:block">
                Avg Basin Depth: <strong className="text-slate-900">{statewideSummary.avgDepth}m</strong> · <strong className="text-rose-700">{statewideSummary.cats['Over-Exploited']} Over-Exploited</strong>
              </div>
            </div>

            {/* Year Selector Buttons */}
            <div className="grid grid-cols-9 gap-1.5">
              {TIMELINE_YEARS.map(yr => (
                <button
                  key={yr}
                  onClick={() => {
                    setTimelineYear(yr);
                    setIsPlaying(false);
                  }}
                  className={`py-1.5 rounded-lg text-center text-xs font-mono font-bold transition-all ${
                    timelineYear === yr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Narrative Ticker */}
            <div className="text-xs text-slate-600 font-medium px-1 truncate">
              📌 {TIMELINE_NARRATIVES[timelineYear]}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar Panel */}
      <div className="w-[360px] border-l border-slate-200 bg-white overflow-y-auto sidebar-scroll flex flex-col">
        {selectedDistrict === 'ALL' ? (
          /* Statewide Summary */
          <div className="p-6 flex flex-col gap-6 animate-fadeInUp">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gujarat Overview</h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">Simulated aquifer risk across {statewideSummary.total} districts</p>
            </div>

            {/* Risk Distribution */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statewideSummary.cats).map(([cat, count]) => {
                const style = categoryColors[cat] || categoryColors['Safe'];
                return (
                  <div key={cat} className={`${style.bg} rounded-xl p-3.5 border`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></span>
                      <span className={`text-xs font-extrabold ${style.text}`}>{cat}</span>
                    </div>
                    <div className={`text-2xl font-black ${style.text}`}>{count}</div>
                    <div className="text-xs text-slate-600 font-bold">districts</div>
                  </div>
                );
              })}
            </div>

            {/* Avg Depth */}
            <div className="stat-card water">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Avg. Simulated Depth (2035)</div>
              <div className="text-2xl font-extrabold text-slate-900">{statewideSummary.avgDepth} <span className="text-sm font-semibold text-slate-600">m bgl</span></div>
            </div>

            {/* Instruction */}
            <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl p-4">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-900 leading-relaxed font-semibold">
                Click on any district on the map to view localized groundwater telemetry, crop acreage data, and historical depth trends.
              </p>
            </div>
          </div>
        ) : (
          /* District Detail Panel */
          <div className="flex flex-col animate-fadeInUp">
            {/* District Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedDistrict}</h3>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">District Groundwater Intelligence</p>
              </div>
              <button
                onClick={() => setSelectedDistrict('ALL')}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Reset to Statewide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5 overflow-y-auto sidebar-scroll flex-1">
              {/* Risk Status */}
              {selectedSim && (
                <div className="rounded-xl p-4" style={{ backgroundColor: `${selectedSim.simulated_risk_color}15`, border: `1px solid ${selectedSim.simulated_risk_color}40` }}>
                  <div className="text-xs font-extrabold uppercase tracking-wider mb-0.5" style={{ color: selectedSim.simulated_risk_color }}>
                    Simulated Risk (2035)
                  </div>
                  <div className="text-xl font-black" style={{ color: selectedSim.simulated_risk_color }}>
                    {selectedSim.simulated_category}
                  </div>
                  <div className="text-xs text-slate-700 mt-1 font-semibold">
                    Projected depth: <strong className="text-slate-900 font-black">{selectedSim.simulated_depth} m</strong> bgl
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-card water">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    <Droplet className="w-3.5 h-3.5 text-sky-600" /> Depth
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">{selectedGw?.mean_depth} <span className="text-xs font-normal text-slate-600">m</span></div>
                </div>
                <div className="stat-card danger">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> Drawdown
                  </div>
                  <div className="text-xl font-extrabold text-rose-700">{selectedGw?.annual_drawdown_rate} <span className="text-xs font-normal text-rose-600">m/yr</span></div>
                </div>
              </div>

              {/* Pre/Post Monsoon */}
              {selectedGw && (
                <div className="v-card-flat p-4 flex items-center justify-between">
                  <div className="text-center flex-1">
                     <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Pre-Monsoon</div>
                     <div className="text-lg font-black text-amber-900 mt-0.5">{selectedGw.pre_monsoon_avg} m</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="text-center flex-1">
                     <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Post-Monsoon</div>
                     <div className="text-lg font-black text-emerald-900 mt-0.5">{selectedGw.post_monsoon_avg} m</div>
                  </div>
                </div>
              )}

              {/* Historical Sparkline */}
              {historyData.length > 0 && (
                <div className="v-card-flat p-4">
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-extrabold text-slate-800">
                    <BarChart3 className="w-4 h-4 text-slate-600" /> Historical Depth Trend (1991-2019)
                  </div>
                  <div className="h-[110px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                        <YAxis reversed tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                        <ReTooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                          formatter={(val) => [`${val} m bgl`, 'Depth']}
                        />
                        <Area type="monotone" dataKey="depth" stroke="#4f46e5" strokeWidth={2.5} fill="url(#sparkGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Crop Profile */}
              {selectedCrops && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <Sprout className="w-3.5 h-3.5 text-slate-500" /> Crop Acreage Breakdown
                  </div>
                  <div className="space-y-3">
                    {Object.entries(selectedCrops).sort((a, b) => b[1].area_hectares - a[1].area_hectares).map(([crop, stats]) => {
                      const maxArea = Math.max(...Object.values(selectedCrops).map(s => s.area_hectares));
                      const pct = maxArea > 0 ? (stats.area_hectares / maxArea) * 100 : 0;
                      const cropColors = { 'Cotton': '#2563eb', 'Groundnut': '#7c3aed', 'Wheat': '#d97706', 'Pearl Millet (Bajra)': '#16a34a' };
                      return (
                        <div key={crop}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-800">{crop}</span>
                            <span className="text-slate-500 font-mono">{(stats.area_hectares / 1000).toFixed(1)}k Ha</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cropColors[crop] || '#7c3aed' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Station Info */}
              <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-500 mt-auto">
                <Activity className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span><strong className="text-slate-800">{selectedGw?.stations_count || 0}</strong> CGWB telemetry stations · <strong className="text-slate-800">{selectedGw?.cgwb_category}</strong> baseline classification</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
