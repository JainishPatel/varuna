import React, { useState } from 'react';
import { Database, Search, Download, Filter, Droplet, Sprout, DollarSign, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DataExplorer({ groundwaterData, marketPrices, cropApy }) {
  const { hasPermission } = useAuth();
  const canDownload = hasPermission('download_csv');

  const [activeDataset, setActiveDataset] = useState('groundwater');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterDistrict, setSelectedFilterDistrict] = useState('ALL');

  const districts = Object.keys(groundwaterData || {});

  const handleDownloadCSV = () => {
    if (!canDownload) return;
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeDataset === 'groundwater') {
      csvContent += "District,Telemetry Stations,Mean Depth (m bgl),Pre-Monsoon Avg (m),Post-Monsoon Avg (m),Annual Drawdown Rate (m/yr),CGWB Risk Category\n";
      Object.values(groundwaterData).forEach(item => {
        csvContent += `"${item.district}",${item.stations_count},${item.mean_depth},${item.pre_monsoon_avg},${item.post_monsoon_avg},${item.annual_drawdown_rate},"${item.cgwb_category}"\n`;
      });
    } else if (activeDataset === 'market') {
      csvContent += "Crop Name,Commodity Raw,2026 MSP (Rs/Qtl),Mandi Price (Rs/Qtl),Price per Kg (Rs),Water Category,Seasonal Water Req (m3/ha),Kc Factor\n";
      Object.values(marketPrices).forEach(item => {
        csvContent += `"${item.name}","${item.raw_name}",${item.msp_per_quintal},${item.mandi_price_per_quintal},${item.price_per_kg},"${item.water_category}",${item.water_req_m3_ha},${item.kc_factor}\n`;
      });
    } else if (activeDataset === 'apy') {
      csvContent += "District,Crop,Area (Hectares),Yield (kg/ha)\n";
      Object.entries(cropApy).forEach(([dist, crops]) => {
        Object.entries(crops).forEach(([cName, meta]) => {
          csvContent += `"${dist}","${cName}",${meta.area_hectares},${meta.yield_kg_per_ha}\n`;
        });
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `varuna_${activeDataset}_dataset.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const datasets = [
    { key: 'groundwater', icon: Droplet, label: 'Groundwater Telemetry (1991-2020)', color: 'sky' },
    { key: 'market', icon: DollarSign, label: 'Market Prices & MSP (2026)', color: 'amber' },
    { key: 'apy', icon: Sprout, label: 'Area, Production & Yield', color: 'emerald' },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Title Bar */}
      <div className="v-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700" />
            Spatial & Agronomic Data Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse multi-disciplinary raw and processed time-series records aggregated from NWIC, IMD, Agmarknet, and State Agriculture Dept.
          </p>
        </div>

        <div>
          {canDownload ? (
            <button
              id="download-csv-btn"
              onClick={handleDownloadCSV}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              Download Active CSV
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-2 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              CSV Locked
            </div>
          )}
        </div>
      </div>

      {/* Dataset Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {datasets.map(ds => {
          const Icon = ds.icon;
          const isActive = activeDataset === ds.key;
          return (
            <button
              key={ds.key}
              onClick={() => setActiveDataset(ds.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              {ds.label}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="v-card p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search district, station, or crop name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-full font-medium placeholder-slate-400"
          />
        </div>

        {activeDataset !== 'market' && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedFilterDistrict}
              onChange={(e) => setSelectedFilterDistrict(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Districts ({districts.length})</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* High Density Table View */}
      <div className="v-card overflow-hidden">
        <div className="overflow-x-auto">
          {activeDataset === 'groundwater' && (
            <table className="density-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Telemetry Stations</th>
                  <th>Mean Depth (m bgl)</th>
                  <th>Pre-Monsoon (May)</th>
                  <th>Post-Monsoon (Oct)</th>
                  <th>Annual Drawdown Rate</th>
                  <th>CGWB Risk Category</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groundwaterData)
                  .filter(item => selectedFilterDistrict === 'ALL' || item.district === selectedFilterDistrict)
                  .filter(item => item.district.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <tr key={item.district}>
                      <td className="font-bold text-slate-900">{item.district}</td>
                      <td className="font-mono text-sky-800 font-bold">{item.stations_count} wells</td>
                      <td className="font-mono text-slate-700">{item.mean_depth} m</td>
                      <td className="font-mono text-amber-700 font-bold">{item.pre_monsoon_avg} m</td>
                      <td className="font-mono text-emerald-700 font-bold">{item.post_monsoon_avg} m</td>
                      <td className="font-mono text-rose-700 font-bold">+{item.annual_drawdown_rate} m/yr</td>
                      <td>
                        <span 
                          className="px-2.5 py-0.5 rounded text-[10px] font-bold border"
                          style={{ borderColor: `${item.risk_color}40`, color: item.risk_color, backgroundColor: `${item.risk_color}15` }}
                        >
                          {item.cgwb_category}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeDataset === 'market' && (
            <table className="density-table">
              <thead>
                <tr>
                  <th>Target Crop</th>
                  <th>Agmarknet Raw Name</th>
                  <th>2026 MSP (₹/qtl)</th>
                  <th>Mandi Price (₹/qtl)</th>
                  <th>Price per Kg</th>
                  <th>Water Intensity</th>
                  <th>Seasonal Water Req</th>
                  <th>Kc Factor</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(marketPrices)
                  .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <tr key={item.name}>
                      <td className="font-bold text-slate-900">{item.name}</td>
                      <td className="text-slate-500">{item.raw_name}</td>
                      <td className="font-mono text-amber-800 font-bold">₹{item.msp_per_quintal.toLocaleString()}</td>
                      <td className="font-mono text-emerald-800 font-bold">₹{item.mandi_price_per_quintal.toLocaleString()}</td>
                      <td className="font-mono text-slate-800">₹{item.price_per_kg}/kg</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                          {item.water_category}
                        </span>
                      </td>
                      <td className="font-mono text-slate-700">{item.water_req_m3_ha.toLocaleString()} m³/ha</td>
                      <td className="font-mono text-emerald-800 font-bold">{item.kc_factor}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeDataset === 'apy' && (
            <table className="density-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Crop Name</th>
                  <th>Acreage (Hectares)</th>
                  <th>Yield (kg/ha)</th>
                  <th>Total Production</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(cropApy)
                  .filter(([dist]) => selectedFilterDistrict === 'ALL' || dist === selectedFilterDistrict)
                  .flatMap(([dist, crops]) => 
                    Object.entries(crops).map(([cName, meta]) => ({ dist, cName, ...meta }))
                  )
                  .filter(item => item.dist.toLowerCase().includes(searchTerm.toLowerCase()) || item.cName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 100)
                  .map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-bold text-slate-900">{item.dist}</td>
                      <td className="text-emerald-800 font-bold">{item.cName}</td>
                      <td className="font-mono text-slate-700">{Math.round(item.area_hectares).toLocaleString()} ha</td>
                      <td className="font-mono text-amber-700 font-bold">{item.yield_kg_per_ha} kg/ha</td>
                      <td className="font-mono text-slate-900 font-extrabold">
                        {Math.round((item.area_hectares * item.yield_kg_per_ha) / 1000).toLocaleString()} MT
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
