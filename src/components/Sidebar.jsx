import React, { useState } from 'react';
import {
  Droplet, AlertTriangle, Map as MapIcon, Sliders, BarChart3,
  FileText, BookOpen, ChevronLeft, ChevronRight, LogOut,
  Waves, Zap, Database, Users, Settings, PanelLeftClose, PanelLeft,
  Sprout, Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { key: 'crisis',     label: 'The Crisis',          icon: AlertTriangle, group: 'narrative', badge: 'Overview', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { key: 'map',        label: 'Spatial Intelligence', icon: MapIcon,       group: 'narrative', badge: 'GIS', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'simulate',   label: 'Simulation Lab',       icon: Sliders,       group: 'analysis', badge: 'Model', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'mlstudio',   label: 'ML Intelligence Lab',  icon: Brain,         group: 'analysis', badge: 'AI/ML', badgeColor: 'bg-violet-50 text-violet-700 border-violet-200' },
  { key: 'croplab',    label: 'Crop Economics Lab',   icon: Sprout,        group: 'analysis', badge: 'DBT', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'stresstest', label: 'Aquifer Stress Lab',   icon: Zap,           group: 'analysis', badge: 'Shock', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'impact',     label: 'Impact Analysis',      icon: BarChart3,     group: 'analysis', badge: 'Nexus', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'dossier',    label: 'Policy Brief',         icon: FileText,      group: 'output',   badge: 'PDF', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'reference',  label: 'Methodology & Data',   icon: BookOpen,      group: 'output' },
];

const GROUP_LABELS = {
  narrative: 'Explore',
  analysis: 'Analyze & Simulate',
  output: 'Report & Data',
};

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed }) {
  const { currentUser, logout, hasPermission } = useAuth();

  const adminItem = hasPermission('manage_users')
    ? { key: 'users', label: 'User Management', icon: Users, group: 'admin', badge: 'Admin', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' }
    : null;

  const allItems = adminItem ? [...NAV_ITEMS, adminItem] : NAV_ITEMS;

  // Group items
  const groups = {};
  allItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Droplet className="sidebar__logo-icon" />
        </div>
        {!collapsed && (
          <div className="sidebar__brand-text">
            <span className="sidebar__brand-name">Varuna</span>
            <span className="sidebar__brand-sub">Hydro-Economic Intelligence</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {Object.entries(groups).map(([groupKey, items]) => (
          <div key={groupKey} className="sidebar__group">
            {!collapsed && (
              <div className="sidebar__group-label">
                {GROUP_LABELS[groupKey] || groupKey}
              </div>
            )}
            {items.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActivePage(item.key)}
                  className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className={`sidebar__icon-box ${isActive ? 'sidebar__icon-box--active' : ''}`}>
                    <Icon className="sidebar__item-icon" />
                  </div>
                  {!collapsed && (
                    <div className="sidebar__item-content">
                      <span className="sidebar__item-label">{item.label}</span>
                      {item.badge && !isActive && (
                        <span className={`sidebar__item-badge ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                  {isActive && <div className="sidebar__active-indicator" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar__footer">
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar__collapse-btn"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* User info */}
        {currentUser && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {(currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{currentUser.displayName || currentUser.username}</span>
                <span className="sidebar__user-role">{currentUser.role}</span>
              </div>
            )}
            <button onClick={logout} className="sidebar__logout" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
