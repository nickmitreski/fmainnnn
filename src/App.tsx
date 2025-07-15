import { useState, useEffect } from 'react';
import Windows95Desktop from './components/Windows95/Desktop';
import ModernSite from './components/ModernSite';
import AdminPage from './components/AdminPage';
import { Frame } from './components/ChoiceAnimation/Frame';
import { ViewType } from './types/index';
import './styles/global.css';
import { posthog } from './lib/posthog';
import { WindowManagerProvider } from './contexts/WindowManagerContext';
import IPhone from './components/iPhoneEmu';

// Custom hook to detect mobile view
function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
}

function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const isMobile = useIsMobile();

  // Track view changes with PostHog
  useEffect(() => {
    posthog.capture('view_changed', { view: currentView });
  }, [currentView]);

  return (
    <div className="app-container">
      {currentView === 'landing' && <Frame onYearSelect={(year) => {
        posthog.capture('year_selected', { year });
        setCurrentView(year);
      }} />}
      {currentView === '1996' && (
        isMobile ? (
          <IPhone setCurrentView={setCurrentView} />
        ) : (
          <WindowManagerProvider>
            <Windows95Desktop onBack={() => setCurrentView('2025')} setCurrentView={setCurrentView} />
          </WindowManagerProvider>
        )
      )}
      {currentView === '2025' && <ModernSite onBack={() => setCurrentView('landing')} setCurrentView={setCurrentView} />}
      {currentView === 'admin' && <AdminPage />}
    </div>
  );
}

export default App;