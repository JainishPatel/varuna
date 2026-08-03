import React from 'react';
import { MapPin, RefreshCw, Download, Sliders, Map as MapIcon, BarChart3, Database, Users, Droplet, Award, Calculator, FileText } from 'lucide-react';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

const allTabs = [
  { key: 'scenario', label: 'Simulation', icon: Sliders, permission: 'view_dashboard' },
  { key: 'map', label: 'Spatial Map', icon: MapIcon, permission: 'view_map' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'view_analytics' },
  { key: 'rankings', label: 'Rankings', icon: Award, permission: 'view_rankings' },
  { key: 'methodology', label: 'Methodology', icon: Calculator, permission: 'view_methodology' },
  { key: 'report', label: 'Report', icon: FileText, permission: 'view_report' },
  { key: 'explorer', label: 'Data Inventory', icon: Database, permission: 'view_data_explorer' },
  { key: 'users', label: 'Users', icon: Users, permission: 'manage_users' },
];

export default function Header({ activeTab, setActiveTab, selectedDistrict, setSelectedDistrict, districts, onResetScenario, onExportReport }) {
  const { hasPermission } = useAuth();

  const visibleTabs = allTabs.filter(tab => hasPermission(tab.permission));

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-[#e2e8f0] backdrop-blur-md shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-6 h-13">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Droplet className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
              Varuna
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
              Gujarat Crop-Water Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-0.5 border border-[#e2e8f0] p-0.5 rounded-lg bg-[#faf7f2]">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`nav-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* District Selector */}
          <div className="flex items-center gap-1.5 bg-[#faf7f2] px-2.5 py-1.5 rounded-md border border-[#e2e8f0] text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="district-selector"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs min-w-[120px]"
            >
              <option value="ALL">All Gujarat ({districts.length})</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <button
            id="reset-scenario-btn"
            onClick={onResetScenario}
            title="Reset Scenario"
            className="p-1.5 rounded-md bg-[#faf7f2] hover:bg-[#f0ebe3] text-slate-600 transition-colors border border-[#e2e8f0]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Export */}
          {hasPermission('export_report') && (
            <button
              id="export-report-btn"
              onClick={onExportReport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
