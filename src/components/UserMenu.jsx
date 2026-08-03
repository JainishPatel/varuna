import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ChevronDown, Shield } from 'lucide-react';
import { ROLES } from '../config/rbacConfig';

export default function UserMenu() {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const roleConfig = ROLES[currentUser.role] || ROLES.viewer;

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition-all duration-200"
      >
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
          style={{ backgroundColor: roleConfig.color }}
        >
          {currentUser.username[0].toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col items-start">
          <span className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.displayName}</span>
          <span className="text-[9px] font-bold leading-tight" style={{ color: roleConfig.color }}>{roleConfig.shortLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-[999] animate-fadeInUp overflow-hidden">
          {/* User Info */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: roleConfig.color }}
              >
                {currentUser.username[0].toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{currentUser.displayName}</div>
                <div className="text-[10px] text-slate-500 font-mono">@{currentUser.username}</div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3" style={{ color: roleConfig.color }} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ color: roleConfig.color, backgroundColor: roleConfig.bgColor, border: `1px solid ${roleConfig.borderColor}` }}
              >
                {roleConfig.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              id="logout-btn"
              onClick={() => { logout(); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
