import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Droplet, Lock, User, AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck, Database, Layers, Activity, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="portal-login-page">
      {/* Left Panel: State Platform Overview & Statistics */}
      <div className="portal-login-left hidden lg:flex">
        <div>
          {/* Institution Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Varuna</h1>
              <p className="text-xs text-slate-400">Gujarat Crop-Water Planning & Simulation Engine</p>
            </div>
          </div>

          <div className="space-y-6 max-w-lg">
            <div>
              <h2 className="text-2xl font-extrabold text-white leading-tight">
                Sustainable Crop Planning & Groundwater Intelligence Platform
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Integrated decision-support system connecting FAO-56 Penman-Monteith ET₀ physics with real APMC Mandi commodity rates and Central Groundwater Board (CGWB) telemetry networks across all 32 districts of Gujarat.
              </p>
            </div>

            {/* Live Data Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  Telemetry Wells
                </div>
                <div className="text-xl font-bold text-white">46,426</div>
                <div className="text-[10px] text-slate-400 mt-0.5">NWIC quarterly loggers (1991–2025)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Districts Covered
                </div>
                <div className="text-xl font-bold text-white">32 Districts</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Choropleth spatial polygon joins</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Agronomic Engine
                </div>
                <div className="text-xl font-bold text-white">FAO-56 PM</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Penman-Monteith crop ETc math</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  ML Recommendation
                </div>
                <div className="text-xl font-bold text-white">Random Forest</div>
                <div className="text-[10px] text-slate-400 mt-0.5">91% accuracy crop classifier</div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-2 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Simulate crop substitution trade-offs (Cotton → Pearl Millet)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Monsoon sowing shift curve alignment (±30 days ET0 offset)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Role-Based Access Control (Admin, Analyst, Field Officer)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-8 border-t border-white/10 flex items-center justify-between">
          <span>Gujarat State Water & Agricultural Resource Dept.</span>
          <span>v2.4 Production</span>
        </div>
      </div>

      {/* Right Panel: Clean Secure Authentication */}
      <div className="portal-login-right">
        <div className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}>
          {/* Mobile Header */}
          <div className="flex lg:hidden items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Varuna</h1>
              <p className="text-[10px] text-slate-500">Gujarat Crop-Water Engine</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In to Dashboard</h2>
            <p className="text-xs text-slate-500 mt-1">Enter your institution user credentials to access district simulation models</p>
          </div>

          {/* Quick Demo Roles Tabs */}
          <div className="mb-6 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2 mb-1.5">Quick Demo Accounts</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin123')}
                className="py-2 px-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all text-xs flex flex-col gap-0.5 shadow-sm"
              >
                <div className="font-bold text-rose-700">Administrator</div>
                <div className="text-[10px] text-slate-500 font-mono">admin</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('analyst', 'analyst123')}
                className="py-2 px-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all text-xs flex flex-col gap-0.5 shadow-sm"
              >
                <div className="font-bold text-blue-700">Data Analyst</div>
                <div className="text-[10px] text-slate-500 font-mono">analyst</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('viewer', 'viewer123')}
                className="py-2 px-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all text-xs flex flex-col gap-0.5 shadow-sm"
              >
                <div className="font-bold text-emerald-700">Field Officer</div>
                <div className="text-[10px] text-slate-500 font-mono">viewer</div>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Platform
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-6">
            Authorized personnel only. Access monitored in accordance with state data security policy.
          </p>
        </div>
      </div>
    </div>
  );
}
