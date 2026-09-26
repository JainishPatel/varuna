import React, { useState, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import CrisisPage from './components/CrisisPage';
import DiagnoseHub from './components/DiagnoseHub';
import ScenarioBuilder from './components/ScenarioBuilder';
import CropTransitionLab from './components/CropTransitionLab';
import StressTestLab from './components/StressTestLab';
import ScenarioStudio from './components/ScenarioStudio';
import DistrictDossier from './components/DistrictDossier';
import MethodologyTab from './components/MethodologyTab';
import DataExplorer from './components/DataExplorer';
import UserManagement from './components/UserManagement';

// Processed dataset JSONs
import groundwaterData from './data/groundwater_summary.json';
import marketPrices from './data/market_prices.json';
import cropApy from './data/crop_apy.json';
import gujaratDistrictsGeoJSON from './data/gujarat_districts.json';

// Simulation Engine
import { calculateSimulation } from './utils/simulationEngine.js';

export default function App() {
  const { currentUser, isLoading } = useAuth();

  // Navigation: page-based instead of tabs
  const [activePage, setActivePage] = useState('crisis');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const [microIrrigationAdoption, setMicroIrrigationAdoption] = useState(0);
  const [activePreset, setActivePreset] = useState('baseline');

  const districts = useMemo(() => Object.keys(groundwaterData || {}), []);

  const applyPreset = (presetKey) => {
    setActivePreset(presetKey);
    if (presetKey === 'baseline') {
      setCropAllocations(baselineAllocations);
      setSowingShift(0);
      setMicroIrrigationAdoption(0);
    } else if (presetKey === 'bajra_swap') {
      setCropAllocations({
        'Cotton': 20.0,
        'Groundnut': 25.0,
        'Wheat': 15.0,
        'Pearl Millet (Bajra)': 40.0
      });
      setSowingShift(15);
      setMicroIrrigationAdoption(20);
    } else if (presetKey === 'high_drip') {
      setCropAllocations({
        'Cotton': 35.0,
        'Groundnut': 30.0,
        'Wheat': 20.0,
        'Pearl Millet (Bajra)': 15.0
      });
      setSowingShift(10);
      setMicroIrrigationAdoption(50);
    } else if (presetKey === 'gw_rescue') {
      setCropAllocations({
        'Cotton': 10.0,
        'Groundnut': 20.0,
        'Wheat': 15.0,
        'Pearl Millet (Bajra)': 55.0
      });
      setSowingShift(20);
      setMicroIrrigationAdoption(40);
    } else if (presetKey === 'max_revenue') {
      setCropAllocations({
        'Cotton': 50.0,
        'Groundnut': 30.0,
        'Wheat': 15.0,
        'Pearl Millet (Bajra)': 5.0
      });
      setSowingShift(0);
      setMicroIrrigationAdoption(15);
    }
  };

  const resetScenario = () => {
    applyPreset('baseline');
  };

  // Run full hydro-economic & WEF nexus simulation
  const simulationResults = useMemo(() => {
    return calculateSimulation(
      cropAllocations,
      sowingShift,
      selectedDistrict,
      baselineAllocations,
      marketPrices,
      cropApy,
      groundwaterData,
      microIrrigationAdoption
    );
  }, [cropAllocations, sowingShift, selectedDistrict, microIrrigationAdoption]);

  const handleExportReport = () => {
    window.print();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__inner">
          <div className="loading-screen__spinner" />
          <p className="loading-screen__text">
            INITIALIZING VARUNA ENGINE...
          </p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <main className={`app-main ${sidebarCollapsed ? 'app-main--expanded' : ''}`}>
        {/* Global Persistent TopBar */}
        <TopBar
          activePage={activePage}
          setActivePage={setActivePage}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          groundwaterData={groundwaterData}
          activePreset={activePreset}
          applyPreset={applyPreset}
          simulationResults={simulationResults}
          onExportReport={handleExportReport}
          onResetScenario={resetScenario}
        />

        {/* Page: The Crisis */}
        {activePage === 'crisis' && (
          <CrisisPage
            groundwaterData={groundwaterData}
            onNavigateToMap={() => setActivePage('map')}
            onNavigateToCropLab={() => setActivePage('croplab')}
            onNavigateToStressTest={() => setActivePage('stresstest')}
            onSelectDistrict={(d) => setSelectedDistrict(d)}
          />
        )}

        {/* Page: Spatial Intelligence (Map) */}
        {activePage === 'map' && (
          <div className="page-container page-container--flush">
            <DiagnoseHub
              geojson={gujaratDistrictsGeoJSON}
              groundwaterData={groundwaterData}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              simulatedDistricts={simulationResults.simulatedDistricts}
              cropApy={cropApy}
              onNavigateToSimulate={() => setActivePage('simulate')}
            />
          </div>
        )}

        {/* Page: Simulation Lab */}
        {activePage === 'simulate' && (
          <div className="page-container">
            <ScenarioBuilder
              cropAllocations={cropAllocations}
              setCropAllocations={setCropAllocations}
              sowingShift={sowingShift}
              setSowingShift={setSowingShift}
              microIrrigationAdoption={microIrrigationAdoption}
              setMicroIrrigationAdoption={setMicroIrrigationAdoption}
              activePreset={activePreset}
              applyPreset={applyPreset}
              simulationResults={simulationResults}
              selectedDistrict={selectedDistrict}
              baselineAllocations={baselineAllocations}
              marketPrices={marketPrices}
              cropApy={cropApy}
              groundwaterData={groundwaterData}
              onNavigateToNexus={() => setActivePage('impact')}
            />
          </div>
        )}

        {/* Page: Crop Economics & Transition Lab */}
        {activePage === 'croplab' && (
          <div className="page-container">
            <CropTransitionLab
              groundwaterData={groundwaterData}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              marketPrices={marketPrices}
              cropApy={cropApy}
              onNavigateToSimulate={() => setActivePage('simulate')}
            />
          </div>
        )}

        {/* Page: Aquifer Stress Lab & Day Zero Simulator */}
        {activePage === 'stresstest' && (
          <div className="page-container">
            <StressTestLab
              groundwaterData={groundwaterData}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              onNavigateToSimulate={() => setActivePage('simulate')}
              onNavigateToCropLab={() => setActivePage('croplab')}
            />
          </div>
        )}

        {/* Page: Impact Analysis */}
        {activePage === 'impact' && (
          <div className="page-container">
            <ScenarioStudio
              simulationResults={simulationResults}
              selectedDistrict={selectedDistrict}
              marketPrices={marketPrices}
              cropAllocations={cropAllocations}
              sowingShift={sowingShift}
              microIrrigationAdoption={microIrrigationAdoption}
              groundwaterData={groundwaterData}
              onNavigateToDossier={() => setActivePage('dossier')}
            />
          </div>
        )}

        {/* Page: Policy Brief */}
        {activePage === 'dossier' && (
          <div className="page-container">
            <DistrictDossier
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              simulationResults={simulationResults}
              cropAllocations={cropAllocations}
              sowingShift={sowingShift}
              microIrrigationAdoption={microIrrigationAdoption}
              groundwaterData={groundwaterData}
              cropApy={cropApy}
              onExportReport={handleExportReport}
            />
          </div>
        )}

        {/* Page: Methodology & Data */}
        {activePage === 'reference' && (
          <div className="page-container">
            <ReferenceSection
              groundwaterData={groundwaterData}
              marketPrices={marketPrices}
              cropApy={cropApy}
            />
          </div>
        )}

        {/* Page: User Management */}
        {activePage === 'users' && (
          <div className="page-container">
            <UserManagement />
          </div>
        )}
      </main>
    </div>
  );
}

// Combined Methodology + Data Explorer in tabbed view
function ReferenceSection({ groundwaterData, marketPrices, cropApy }) {
  const [activeRefTab, setActiveRefTab] = useState('methodology');

  return (
    <div className="reference-section">
      <div className="reference-section__header">
        <h1 className="reference-section__title">Methodology & Data Reference</h1>
        <p className="reference-section__subtitle">
          Technical documentation of the FAO-56 Penman-Monteith engine and complete telemetry data inventory.
        </p>
        <div className="reference-section__tabs">
          <button
            onClick={() => setActiveRefTab('methodology')}
            className={`reference-section__tab ${activeRefTab === 'methodology' ? 'reference-section__tab--active' : ''}`}
          >
            Methodology & Physics
          </button>
          <button
            onClick={() => setActiveRefTab('data')}
            className={`reference-section__tab ${activeRefTab === 'data' ? 'reference-section__tab--active' : ''}`}
          >
            Data Inventory
          </button>
        </div>
      </div>

      {activeRefTab === 'methodology' && <MethodologyTab />}
      {activeRefTab === 'data' && (
        <DataExplorer
          groundwaterData={groundwaterData}
          marketPrices={marketPrices}
          cropApy={cropApy}
        />
      )}
    </div>
  );
}
