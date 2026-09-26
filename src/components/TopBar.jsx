import React from 'react';
import {
  MapPin, Sliders, RefreshCw, Printer, AlertTriangle,
  ChevronDown, Droplet, Sprout, BarChart3, ShieldAlert,
  Compass, Zap, BookOpen, FileText, CheckCircle2, Brain
} from 'lucide-react';

const PAGE_METADATA = {
  crisis: { title: 'The Crisis', category: 'Executive Overview', icon: AlertTriangle },
  map: { title: 'Spatial Intelligence', category: 'GIS Telemetry', icon: MapPin },
  simulate: { title: 'Simulation Lab', category: 'FAO-56 Policy Engine', icon: Sliders },
  mlstudio: { title: 'ML Intelligence Lab', category: 'Predictive Hydro-Economic AI', icon: Brain },
  croplab: { title: 'Crop Transition Lab', category: 'Farmer Economics', icon: Sprout },
  stresstest: { title: 'Aquifer Stress Lab', category: 'Drought & Day Zero', icon: Zap },
  impact: { title: 'Impact Analysis', category: 'WEF Nexus Studio', icon: BarChart3 },
  dossier: { title: 'Policy Brief', category: 'Dossier & Directive', icon: FileText },
  reference: { title: 'Methodology & Data', category: 'Technical Inventory', icon: BookOpen },
  users: { title: 'User Management', category: 'Access Control', icon: ShieldAlert },
};

export default function TopBar({
  activePage = 'crisis',
  setActivePage,
  selectedDistrict = 'ALL',
  setSelectedDistrict,
  groundwaterData = {},
  activePreset = 'baseline',
  applyPreset,
  simulationResults = {},
  onExportReport,
  onResetScenario
}) {
  const meta = PAGE_METADATA[activePage] || {
    title: 'Varuna Engine',
    category: 'System',
    icon: Droplet
  };
  const PageIcon = meta.icon;

  const districtList = Object.keys(groundwaterData || {}).sort();

  const currentDistrictData = selectedDistrict === 'ALL'
    ? { cgwb_category: 'Statewide Aggregate', risk_color: '#3b82f6', mean_depth: 10.4 }
    : groundwaterData[selectedDistrict] || { cgwb_category: 'Unknown', risk_color: '#94a3b8', mean_depth: 0 };

  const waterSaved = simulationResults?.waterSavedMCM || 0;
  const isPositiveWater = waterSaved > 0;

  return (
    <header className="varuna-topbar">
      {/* Left: Page Title & Breadcrumb */}
      <div className="varuna-topbar__left">
        <div className="varuna-topbar__icon-badge">
          <PageIcon className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="varuna-topbar__titles">
          <div className="varuna-topbar__breadcrumb">
            <span>Varuna</span>
            <span className="varuna-topbar__sep">/</span>
            <span className="varuna-topbar__category">{meta.category}</span>
          </div>
          <h1 className="varuna-topbar__page-title">{meta.title}</h1>
        </div>
      </div>

      {/* Right: Controls & Global District Switcher */}
      <div className="varuna-topbar__right">
        {/* Scenario Pill */}
        <div className="varuna-topbar__scenario-pill">
          <span className="varuna-topbar__scenario-label">Active Scenario:</span>
          <select
            value={activePreset}
            onChange={(e) => applyPreset && applyPreset(e.target.value)}
            className="varuna-topbar__preset-select"
            title="Switch active scenario preset"
          >
            <option value="baseline">Baseline (Status Quo)</option>
            <option value="bajra_swap">Bajra Swap (Crop Shift)</option>
            <option value="high_drip">High Drip (50% Micro-Irrigation)</option>
            <option value="gw_rescue">Groundwater Rescue (Strict)</option>
            <option value="max_revenue">Max Revenue (Economic Priority)</option>
          </select>
          {waterSaved !== 0 && (
            <span className={`varuna-topbar__water-delta ${isPositiveWater ? 'varuna-topbar__water-delta--pos' : 'varuna-topbar__water-delta--neg'}`}>
              {isPositiveWater ? '+' : ''}{waterSaved.toLocaleString()} MCM
            </span>
          )}
        </div>

        {/* Global District Selector */}
        <div className="varuna-topbar__district-wrap">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict && setSelectedDistrict(e.target.value)}
            className="varuna-topbar__district-select"
            title="Filter by district statewide"
          >
            <option value="ALL">Entire Gujarat (32 Districts)</option>
            <optgroup label="Districts">
              {districtList.map((d) => {
                const info = groundwaterData[d] || {};
                const tag = info.cgwb_category ? ` [${info.cgwb_category}]` : '';
                return (
                  <option key={d} value={d}>
                    {d}{tag}
                  </option>
                );
              })}
            </optgroup>
          </select>
          <span
            className="varuna-topbar__district-dot"
            style={{ backgroundColor: currentDistrictData.risk_color || '#3b82f6' }}
            title={`Status: ${currentDistrictData.cgwb_category}`}
          />
        </div>

        {/* Action Buttons */}
        <div className="varuna-topbar__actions">
          {onResetScenario && (
            <button
              onClick={onResetScenario}
              className="varuna-topbar__btn varuna-topbar__btn--ghost"
              title="Reset scenario to baseline"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset</span>
            </button>
          )}

          {onExportReport && (
            <button
              onClick={onExportReport}
              className="varuna-topbar__btn varuna-topbar__btn--primary"
              title="Print or export current assessment dossier"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
