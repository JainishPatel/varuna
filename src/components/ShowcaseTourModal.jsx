import React, { useState } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Droplets, Zap, ShieldAlert, 
  Sparkles, CheckCircle2, TrendingUp, IndianRupee, ArrowRight,
  Layers, MapPin, Compass
} from 'lucide-react';

export const TOUR_STEPS = [
  {
    step: 1,
    tag: 'THE CRISIS',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: 'Gujarat’s Aquifers Are Approaching Terminal Drawdown',
    subtitle: '18 of 32 districts are classified Critical or Over-Exploited by CGWB',
    icon: ShieldAlert,
    iconColor: 'text-rose-400',
    content: `Across North Gujarat and Saurashtra, groundwater levels are plummeting at rates up to 0.42 meters annually. 
    Analysis of 46,426 NWIC telemetry records shows that without urgent intervention, Banaskantha, Patan, and Mehsana face total tubewell failure by 2035.`,
    statLabel: 'Critical Aquifer Stress',
    statValue: '62%',
    statSub: '32 Districts Monitored',
    presetKey: 'baseline',
    suggestedTab: 'diagnose'
  },
  {
    step: 2,
    tag: 'THE CROPPING PARADOX',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'High-Water Cash Crops Drive 88% of Extractions',
    subtitle: 'Cotton requires 8,500 m³/ha vs. Pearl Millet at only 2,800 m³/ha',
    icon: Droplets,
    iconColor: 'text-amber-400',
    content: `Statewide, Cotton occupies over 40% of irrigated acreage. While market prices incentivize farmers to cultivate cash crops, flood irrigation wastes over 55% of applied water. 
    Simply telling farmers to stop planting cash crops leads to widespread agrarian economic distress.`,
    statLabel: 'Water Demand Ratio',
    statValue: '3.04x',
    statSub: 'Cotton vs. Bajra',
    presetKey: 'baseline',
    suggestedTab: 'simulate'
  },
  {
    step: 3,
    tag: 'THE MULTI-LEVER SOLUTION',
    tagColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    title: 'Varuna’s Tri-Lever Hydro-Economic Optimization',
    subtitle: 'Crop Swaps + Sowing Shift + Micro-Irrigation Drip Penetration',
    icon: Compass,
    iconColor: 'text-sky-400',
    content: `Varuna demonstrates that water security does not require sacrificing agricultural GDP. 
    By combining a 20% shift to drought-hardy Pearl Millet, a +15 day monsoon sowing alignment, and 40% drip irrigation adoption, net water demand falls by over 28% without crashing yields.`,
    statLabel: 'Conserved Water',
    statValue: '1,180+ MCM',
    statSub: 'Annual Aquifer Recharge',
    presetKey: 'bajra_swap',
    suggestedTab: 'simulate'
  },
  {
    step: 4,
    tag: 'THE WEF NEXUS',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Cross-Sector Co-Benefits: Power, Carbon & Farmer Income',
    subtitle: 'Conserving groundwater directly relieves Gujarat’s electric grid',
    icon: Zap,
    iconColor: 'text-emerald-400',
    content: `Lifting water from 25m depths consumes massive electrical power. 
    Varuna’s optimal scenario saves 390 GWh of agricultural electricity annually, relieving ₹250+ Crores of state power subsidies and eliminating 320,000 tons of grid CO₂ emissions. 
    A targeted state "Bhavantar" transition bonus keeps farmer income 100% whole.`,
    statLabel: 'Grid Power Relief',
    statValue: '390 GWh/yr',
    statSub: '₹250 Cr Subsidy Saved',
    presetKey: 'gw_rescue',
    suggestedTab: 'nexus'
  },
  {
    step: 5,
    tag: 'ACTIONABLE POLICY',
    tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    title: 'From Theoretical Physics to Official District Dossiers',
    subtitle: 'One-click government-ready briefing document for District Collectors',
    icon: CheckCircle2,
    iconColor: 'text-indigo-400',
    content: `Varuna bridges academic research and administrative governance. 
    Every district can immediately generate a tailored Executive Intervention Dossier containing historical hydrographs, required micro-irrigation equipment targets, and the required state transition budget.`,
    statLabel: 'Ready for Action',
    statValue: '32 Districts',
    statSub: 'Official PDF Dossier',
    presetKey: 'gw_rescue',
    suggestedTab: 'dossier'
  }
];

export default function ShowcaseTourModal({ isOpen, onClose, onApplyPreset, onNavigateTab }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStepIndex];
  const Icon = current.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleApplyAndJump = () => {
    if (onApplyPreset && current.presetKey) {
      onApplyPreset(current.presetKey);
    }
    if (onNavigateTab && current.suggestedTab) {
      onNavigateTab(current.suggestedTab);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 tour-overlay animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#09131e] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-soft-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyan-400">
              VARUNA EXECUTIVE SHOWCASE TOUR
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Step {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-white/10 h-1">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-1 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2.5">
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${current.tagColor}`}>
              {current.tag}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shrink-0">
              <Icon className={`w-8 h-8 ${current.iconColor}`} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {current.title}
              </h2>
              <p className="text-xs text-cyan-300/80 font-medium mt-1">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Narrative text */}
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal bg-black/30 p-4 rounded-xl border border-white/5">
            {current.content}
          </p>

          {/* Key Metric Spotlight */}
          <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {current.statLabel}
              </div>
              <div className="text-2xl md:text-3xl font-black text-white mt-0.5">
                {current.statValue}
              </div>
            </div>
            <div className="flex flex-col justify-end text-right">
              <span className="text-xs font-semibold text-emerald-400">
                {current.statSub}
              </span>
              <span className="text-[10px] text-slate-400">
                Validated hydro-economic model
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5">
          <button
            onClick={handleApplyAndJump}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply & View in App
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                isFirst 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isLast ? 'Complete Showcase' : 'Next Step'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
