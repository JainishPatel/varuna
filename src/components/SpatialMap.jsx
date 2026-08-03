import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import { MapPin, Layers, Activity, Info, Droplet, Sprout, TrendingDown, ChevronRight, X, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip } from 'recharts';

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

export default function SpatialMap({ geojson, groundwaterData, selectedDistrict, setSelectedDistrict, simulatedDistricts, cropApy }) {
  const [showWells, setShowWells] = useState(true);

  // Compute statewide summary stats
  const statewideSummary = useMemo(() => {
    const cats = { 'Safe': 0, 'Semi-Critical': 0, 'Critical': 0, 'Over-Exploited': 0 };
    let totalDepth = 0;
    let count = 0;
    Object.values(simulatedDistricts).forEach(sim => {
      cats[sim.simulated_category] = (cats[sim.simulated_category] || 0) + 1;
      totalDepth += sim.simulated_depth;
      count++;
    });
    return { cats, avgDepth: count > 0 ? (totalDepth / count).toFixed(1) : '--', total: count };
  }, [simulatedDistricts]);

  const getFeatureColor = (districtName) => {
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
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <GeoJSON
              key={JSON.stringify(simulatedDistricts) + selectedDistrict}
              data={geojson}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
            {sampleWellMarkers.map((w, idx) => (
              <CircleMarker
                key={idx}
                center={[w.lat, w.lng]}
                radius={4}
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
            <MapViewController selectedDistrict={selectedDistrict} geojson={geojson} />
          </MapContainer>
        )}

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-[400] v-card p-3 text-xs bg-white/95 backdrop-blur-sm">
          <div className="font-bold text-slate-700 mb-2 text-[11px] uppercase tracking-wider">Aquifer Risk Status</div>
          <div className="space-y-1.5">
            {[
              { color: '#16a34a', label: 'Safe' },
              { color: '#d97706', label: 'Semi-Critical' },
              { color: '#ea580c', label: 'Critical' },
              { color: '#dc2626', label: 'Over-Exploited' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-700 font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle Wells Button */}
        <div className="absolute top-4 left-4 z-[400]">
          <button
            onClick={() => setShowWells(!showWells)}
            className={`v-card px-3 py-2 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              showWells ? 'text-sky-700' : 'text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showWells ? 'Telemetry Wells ON' : 'Telemetry Wells OFF'}
          </button>
        </div>
      </div>

      {/* Right Sidebar Panel */}
      <div className="w-[360px] border-l border-slate-200 bg-white overflow-y-auto sidebar-scroll flex flex-col">
        {selectedDistrict === 'ALL' ? (
          /* Statewide Summary */
          <div className="p-6 flex flex-col gap-6 animate-fadeInUp">
            <div>
              <h3 className="text-base font-bold text-slate-900">Gujarat Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Simulated aquifer risk across {statewideSummary.total} districts</p>
            </div>

            {/* Risk Distribution */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statewideSummary.cats).map(([cat, count]) => {
                const style = categoryColors[cat] || categoryColors['Safe'];
                return (
                  <div key={cat} className={`${style.bg} rounded-xl p-3.5 border`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                      <span className={`text-[10px] font-bold ${style.text}`}>{cat}</span>
                    </div>
                    <div className={`text-2xl font-extrabold ${style.text}`}>{count}</div>
                    <div className="text-[10px] text-slate-500 font-medium">districts</div>
                  </div>
                );
              })}
            </div>

            {/* Avg Depth */}
            <div className="stat-card water">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg. Simulated Depth (2035)</div>
              <div className="text-2xl font-extrabold text-slate-900">{statewideSummary.avgDepth} <span className="text-sm font-normal text-slate-500">m bgl</span></div>
            </div>

            {/* Instruction */}
            <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl p-4">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-900 leading-relaxed font-medium">
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
                <h3 className="text-lg font-bold text-slate-900">{selectedDistrict}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">District Groundwater Intelligence</p>
              </div>
              <button
                onClick={() => setSelectedDistrict('ALL')}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5 overflow-y-auto sidebar-scroll flex-1">
              {/* Risk Status */}
              {selectedSim && (
                <div className="rounded-xl p-4" style={{ backgroundColor: `${selectedSim.simulated_risk_color}15`, border: `1px solid ${selectedSim.simulated_risk_color}30` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: selectedSim.simulated_risk_color }}>
                    Simulated Risk (2035)
                  </div>
                  <div className="text-xl font-extrabold" style={{ color: selectedSim.simulated_risk_color }}>
                    {selectedSim.simulated_category}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-medium">
                    Projected depth: <strong className="text-slate-900 font-extrabold">{selectedSim.simulated_depth} m</strong> bgl
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-card water">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <Droplet className="w-3 h-3 text-sky-600" /> Depth
                  </div>
                  <div className="text-xl font-extrabold text-slate-900">{selectedGw?.mean_depth} <span className="text-xs font-normal text-slate-500">m</span></div>
                </div>
                <div className="stat-card danger">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <TrendingDown className="w-3 h-3 text-rose-600" /> Drawdown
                  </div>
                  <div className="text-xl font-extrabold text-rose-700">{selectedGw?.annual_drawdown_rate} <span className="text-xs font-normal text-rose-500">m/yr</span></div>
                </div>
              </div>

              {/* Pre/Post Monsoon */}
              {selectedGw && (
                <div className="v-card-flat p-4 flex items-center justify-between">
                  <div className="text-center flex-1">
                     <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pre-Monsoon</div>
                     <div className="text-lg font-bold text-amber-800 mt-0.5">{selectedGw.pre_monsoon_avg} m</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200"></div>
                  <div className="text-center flex-1">
                     <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Post-Monsoon</div>
                     <div className="text-lg font-bold text-emerald-800 mt-0.5">{selectedGw.post_monsoon_avg} m</div>
                  </div>
                </div>
              )}

              {/* Historical Sparkline */}
              {historyData.length > 0 && (
                <div className="v-card-flat p-4">
                  <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold text-slate-700">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500" /> Historical Depth Trend (1991-2019)
                  </div>
                  <div className="h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                        <YAxis reversed tick={{ fontSize: 9, fill: '#64748b' }} stroke="#cbd5e1" tickLine={false} axisLine={false} />
                        <ReTooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                          formatter={(val) => [`${val} m bgl`, 'Depth']}
                        />
                        <Area type="monotone" dataKey="depth" stroke="#4f46e5" strokeWidth={2} fill="url(#sparkGrad)" />
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
