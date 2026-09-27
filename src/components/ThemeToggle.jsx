import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ variant = 'topbar', collapsed = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  const titleText = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`sidebar__collapse-btn theme-toggle theme-toggle--sidebar ${className}`}
        title={titleText}
        aria-label={titleText}
      >
        <span className="theme-toggle__icon-wrap flex items-center justify-center w-4 h-4 shrink-0 transition-transform duration-300">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 hover:text-indigo-600 transition-colors" />
          )}
        </span>
        {!collapsed && (
          <span className="truncate">
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl bg-white/80 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 active:scale-95 flex items-center justify-center ${className}`}
        title={titleText}
        aria-label={titleText}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 animate-fadeIn" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 animate-fadeIn" />
        )}
      </button>
    );
  }

  // Default 'topbar' variant: matches .varuna-topbar__btn
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`varuna-topbar__btn varuna-topbar__btn--ghost theme-toggle theme-toggle--topbar group relative overflow-hidden transition-all duration-200 ${className}`}
      title={titleText}
      aria-label={titleText}
    >
      <span className="relative flex items-center justify-center w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12">
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/20" />
        )}
      </span>
      <span className="hidden sm:inline font-bold">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
