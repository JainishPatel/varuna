import React, { useState, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import ScenarioBuilder from './components/ScenarioBuilder';
import SpatialMap from './components/SpatialMap';
import AnalyticsPanel from './components/AnalyticsPanel';
import DistrictRankings from './components/DistrictRankings';
import MethodologyTab from './components/MethodologyTab';
import ExecutiveReport from './components/ExecutiveReport';
import DataExplorer from './components/DataExplorer';
import UserManagement from './components/UserManagement';

// Import processed dataset JSONs
import groundwaterData from './data/groundwater_summary.json';
import marketPrices from './data/market_prices.json';
import cropApy from './data/crop_apy.json';
import gujaratDistrictsGeoJSON from './data/gujarat_districts.json';

// Import Engine
import { calculateSimulation } from './utils/simulationEngine.js';

export default function App() {
  const { currentUser, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('scenario');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  
  // Baseline crop allocation percentages (%)
  const baselineAllocations = {
    'Cotton': 40.0,
    'Groundnut': 25.0,
    'Wheat': 20.0,
    'Pearl Millet (Bajra)': 15.0
  };

  const [cropAllocations, setCropAllocations] = useState(baselineAllocations);
  const [sowingShift, setSowingShift] = useState(0);
  const [activePreset, setActivePreset] = useState('baseline');

  const districts = useMemo(() => Object.keys(groundwaterData || {}), []);

  const applyPreset = (presetKey) => {
    setActivePreset(presetKey);
    if (presetKey === 'baseline') {
      setCropAllocations(baselineAllocations);
      setSowingShift(0);
    } else if (presetKey === 'bajra_swap') {
      setCropAllocations({
        'Cotton': 20.0,
        'Groundnut': 25.0,
        'Wheat': 15.0,
        'Pearl Millet (Bajra)': 40.0
      });
      setSowingShift(15);
    } else if (presetKey === 'gw_rescue') {
      setCropAllocations({
        'Cotton': 10.0,
        'Groundnut': 20.0,
        'Wheat': 15.0,
        'Pearl Millet (Bajra)': 55.0
      });
      setSowingShift(20);
    } else if (presetKey === 'max_revenue') {
      setCropAllocations({
        'Cotton': 50.0,
        'Groundnut': 30.0,
        'Wheat': 15.0,
        'Pearl Millet (Bajra)': 5.0
      });
      setSowingShift(0);
    }
  };

  const resetScenario = () => {
    applyPreset('baseline');
  };

  const handleSelectDistrictFromRankings = (districtName) => {
    setSelectedDistrict(districtName);
    setActiveTab('scenario');
  };

  const simulationResults = useMemo(() => {
    return calculateSimulation(
      cropAllocations,
      sowingShift,
      selectedDistrict,
      baselineAllocations,
      marketPrices,
      cropApy,
      groundwaterData
    );
  }, [cropAllocations, sowingShift, selectedDistrict]);

  const handleExportReport = () => {
    window.print();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fdfbf7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Loading Varuna Engine...</p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#fdfbf7] text-slate-800 font-sans overflow-hidden">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}
        districts={districts}
        onResetScenario={resetScenario}
        onExportReport={handleExportReport}
      />

      {/* Main Content — fills remaining height */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'scenario' && (
          <div className="p-4 lg:p-6 animate-fadeInUp">
            <ScenarioBuilder
              cropAllocations={cropAllocations}
              setCropAllocations={setCropAllocations}
              sowingShift={sowingShift}
              setSowingShift={setSowingShift}
              activePreset={activePreset}
              applyPreset={applyPreset}
              simulationResults={simulationResults}
              selectedDistrict={selectedDistrict}
              baselineAllocations={baselineAllocations}
              marketPrices={marketPrices}
              cropApy={cropApy}
              groundwaterData={groundwaterData}
            />
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-full">
            <SpatialMap
              geojson={gujaratDistrictsGeoJSON}
              groundwaterData={groundwaterData}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              simulatedDistricts={simulationResults.simulatedDistricts}
              cropApy={cropApy}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4 lg:p-6 animate-fadeInUp">
            <AnalyticsPanel
              simulationResults={simulationResults}
              selectedDistrict={selectedDistrict}
              marketPrices={marketPrices}
              cropAllocations={cropAllocations}
              sowingShift={sowingShift}
              groundwaterData={groundwaterData}
            />
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="p-4 lg:p-6 animate-fadeInUp">
            <DistrictRankings onSelectDistrict={handleSelectDistrictFromRankings} />
          </div>
        )}

        {activeTab === 'methodology' && (
          <div className="p-4 lg:p-6 animate-fadeInUp">
            <MethodologyTab />
          </div>
        )}

        {activeTab === 'report' && (
          <div className="p-4 lg:p-6 animate-fadeInUp">
            <ExecutiveReport onExportReport={handleExportReport} />
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="p-4 lg:p-6 animate-fadeInUp">
            <DataExplorer
              groundwaterData={groundwaterData}
              marketPrices={marketPrices}
              cropApy={cropApy}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-4 lg:p-6 animate-fadeInUp">
            <UserManagement />
          </div>
        )}
      </main>
    </div>
  );
}
