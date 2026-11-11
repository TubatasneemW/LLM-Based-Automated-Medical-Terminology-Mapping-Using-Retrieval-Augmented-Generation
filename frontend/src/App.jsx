import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AnimatedBackground from './components/AnimatedBackground';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import MappingWorkspace from './pages/MappingWorkspace';
import Explainability from './pages/Explainability';
import Pipeline from './pages/Pipeline';
import History from './pages/History';
import Evaluation from './pages/Evaluation';

const PAGES = {
  landing: Landing,
  dashboard: Dashboard,
  workspace: MappingWorkspace,
  explainability: Explainability,
  pipeline: Pipeline,
  history: History,
  evaluation: Evaluation,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = (page, mappingData = null) => {
    if (mappingData) {
      setSelectedMapping(mappingData);
    }
    setCurrentPage(page);
  };

  const PageComponent = PAGES[currentPage] || Landing;

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden"
      style={{ backgroundColor: '#080D18' }}
    >
      <AnimatedBackground />

      <Navbar onToggleSidebar={() => setSidebarCollapsed((c) => !c)} />

      <div className="flex pt-16">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => navigate(p)}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />

        <main
          className="flex-1 min-h-screen transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? '64px' : '240px' }}
        >
          <div className="relative z-10 p-6">
            <PageComponent
              onNavigate={navigate}
              mapping={selectedMapping}
              selectedMapping={selectedMapping}
              onMappingResult={(m) => {
                setSelectedMapping(m);
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
