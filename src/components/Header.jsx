import React, { useState } from 'react';
import { 
  MapPin, RefreshCw, Download, Sliders, Map as MapIcon, 
  BarChart3, Database, Users, Droplet, Award, Calculator, 
  FileText, Sparkles, AlertTriangle, Zap, Layers, MoreHorizontal,
  Compass, ChevronDown, CheckCircle2
} from 'lucide-react';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  selectedDistrict, 
  setSelectedDistrict, 
  districts, 
  onResetScenario, 
  onExportReport,
  onOpenTour,
  simulationResults = {}
}) {
  const { hasPermission } = useAuth();
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  const primaryTabs = [
    { key: 'diagnose', label: '1. Diagnose Hub', icon: MapIcon, desc: 'Spatial Map & Aquifer Risk Matrix' },
    { key: 'simulate', label: '2. Simulation Cockpit', icon: Sliders, desc: 'Multi-lever Hydro-Economic Engine' },
    { key: 'nexus', label: '3. Scenario Studio & Nexus', icon: Zap, desc: 'A/B Policy Compare & Carbon/Power Co-Benefits' },
    { key: 'dossier', label: '4. Executive Dossier', icon: FileText, desc: 'Official District Policy Brief' },
  ];

  const secondaryTabs = [
    { key: 'methodology', label: 'FAO-56 Methodology & Physics', icon: Calculator, permission: 'view_methodology' },
    { key: 'explorer', label: 'Telemetry & Agronomic Data Inventory', icon: Database, permission: 'view_data_explorer' },
    { key: 'users', label: 'User Roles & Access Control', icon: Users, permission: 'manage_users' },
  ].filter(tab => hasPermission(tab.permission));

  const { waterSavedPercent = 0, energySavedMWh = 0 } = simulationResults;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-xs">
      {/* ───── Top Command Center Ribbon ───── */}
      <div className="mission-control-ribbon px-4 lg:px-6 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          {/* Live Aquifer Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-soft-pulse shrink-0" />
            <span className="text-slate-300 font-semibold">
              Gujarat Aquifer Stress: <strong className="text-rose-400 font-bold">62% Critical/OE</strong>
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-300">
              18 of 32 Districts In Over-Draft
            </span>
          </div>

          {/* Statewide Water Deficit */}
          <div className="hidden lg:flex items-center gap-1.5 text-cyan-300 font-semibold">
            <Droplet className="w-3 h-3 text-cyan-400" />
            <span>State Agri Deficit: ~4,200 MCM/yr</span>
          </div>

          {/* Active Policy Delta */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Active Simulation:</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              waterSavedPercent > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700/50 text-slate-300'
            }`}>
              {waterSavedPercent > 0 ? `+${waterSavedPercent.toFixed(1)}% Water Saved` : 'Status Quo Baseline'}
            </span>
            {energySavedMWh > 0 && (
              <span className="hidden xl:inline text-emerald-400 font-bold">
                • {energySavedMWh.toLocaleString()} MWh Power Relieved
              </span>
            )}
          </div>
        </div>

        {/* Right side: Telemetry Active Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-soft-pulse" />
            <span>46,426 Wells Synced</span>
          </div>
        </div>
      </div>

      {/* ───── Main Navigation Bar ───── */}
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        {/* Brand & Mission Statement */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 shrink-0">
            <Droplet className="w-4.5 h-4.5 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-none">
                Varuna
              </h1>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                v2.5 Hydro-Economic
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none hidden sm:block">
              Gujarat Sustainable Crop-Water Decision Intelligence System
            </p>
          </div>
        </div>

        {/* Core 4-Stage Decision Flow Tabs */}
        <nav className="flex items-center gap-1 border border-slate-200 p-1 rounded-xl bg-slate-100/70">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`nav-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                title={tab.desc}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}

          {/* Secondary Dropdown for Reference & Admin */}
          {secondaryTabs.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-all ${
                  secondaryTabs.some(t => t.key === activeTab) ? 'bg-white text-slate-900 shadow-xs' : ''
                }`}
                title="Reference data & system options"
              >
                <MoreHorizontal className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showSecondaryMenu && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setShowSecondaryMenu(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-mono uppercase font-bold text-slate-400 border-b border-slate-100">
                    Technical Reference & Admin
                  </div>
                  {secondaryTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setActiveTab(tab.key);
                          setShowSecondaryMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-semibold transition-colors"
                      >
                        <Icon className="w-4 h-4 text-emerald-600" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Controls: District Selector & Actions */}
        <div className="flex items-center gap-2">
          {/* District Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs transition-colors">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <select
              id="district-selector"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs min-w-[125px]"
            >
              <option value="ALL">All Gujarat (32 Districts)</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <button
            id="reset-scenario-btn"
            onClick={onResetScenario}
            title="Reset to Baseline Scenario"
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Export Report */}
          {hasPermission('export_report') && (
            <button
              id="export-report-btn"
              onClick={onExportReport}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Brief
            </button>
          )}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
