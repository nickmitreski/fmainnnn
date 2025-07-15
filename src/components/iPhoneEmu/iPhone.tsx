import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBar from './StatusBar';
import HomeScreen from './HomeScreen';
import Dock from './Dock';
import LockScreen from './LockScreen/LockScreen';
import MessagesApp from './MessagesApp';
import CalculatorApp from './CalculatorApp';
import ClockApp from './ClockApp';
import CalendarApp from './CalendarApp';
import PhotosApp from './PhotosApp';
import ContactsApp from './ContactsApp';
import NotesApp from './NotesApp';
import SettingsApp from './SettingsApp';
import YouTubeApp from './YouTubeApp';
import MapsApp from './MapsApp';
import WeatherApp from './WeatherApp';
import StocksApp from './StocksApp';
import AppStoreApp from './AppStoreApp';
import TestimonialsApp from './TestimonialsApp';
import ITunesApp from './iTunesApp';
import VideosApp from './VideosApp';
import PhoneApp from './PhoneApp';
import ContactUsApp from './ContactUsApp';
import ModernSiteApp from './ModernSiteApp';
import GameApp from './GameApp';
import { ViewType } from '../../types/index';

interface IPhoneProps {
  setCurrentView: (view: ViewType) => void;
}

const IPhone: React.FC<IPhoneProps> = ({ setCurrentView }) => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);

  const tutorialMessages = [
    "Welcome to the 2007 Flash Forward experience. Explore the apps and games, have some fun.",
    "When you're ready, click on the 'Modern Site' button to get to the 2025 website."
  ];

  const handleAppPress = (appId: string) => {
    setSelectedApp(appId);
    // No auto-close! App stays open until Home is pressed.
  };

  const handleHomeButton = () => {
    setSelectedApp(null);
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const renderApp = (appId: string) => {
    switch (appId) {
      case 'messages':
        return <MessagesApp onClose={() => setSelectedApp(null)} />;
      case 'calculator':
        return <CalculatorApp onClose={() => setSelectedApp(null)} />;
      case 'clock':
        return <ClockApp onClose={() => setSelectedApp(null)} />;
      case 'calendar':
        return <CalendarApp onClose={() => setSelectedApp(null)} />;
      case 'photos':
        return <PhotosApp onClose={() => setSelectedApp(null)} />;
      case 'contacts':
        return <ContactsApp onClose={() => setSelectedApp(null)} />;
      case 'notes':
        return <NotesApp onClose={() => setSelectedApp(null)} />;
      case 'settings':
        return <SettingsApp onClose={() => setSelectedApp(null)} />;
      case 'youtube':
        return <YouTubeApp onClose={() => setSelectedApp(null)} />;
      case 'maps':
        return <MapsApp onClose={() => setSelectedApp(null)} />;
      case 'weather':
        return <WeatherApp onClose={() => setSelectedApp(null)} />;
      case 'stocks':
        return <StocksApp onClose={() => setSelectedApp(null)} />;
      case 'appstore':
        return <AppStoreApp onClose={() => setSelectedApp(null)} />;
      case 'voice':
        return <TestimonialsApp onClose={() => setSelectedApp(null)} />;
      case 'itunes':
        return <ITunesApp onClose={() => setSelectedApp(null)} />;
      case 'videos':
        return <VideosApp onClose={() => setSelectedApp(null)} />;
      case 'phone':
        return <PhoneApp onClose={() => setSelectedApp(null)} />;
      case 'mail':
        return <ContactUsApp onClose={() => setSelectedApp(null)} />;
      case 'safari':
        return <ModernSiteApp onClose={() => setSelectedApp(null)} setCurrentView={setCurrentView} />;
      case 'doodle-jump':
      case '2048':
      case 'flappy-bird':
      case 'snake':
      case 'tetris':
      case 'angry-birds':
      case 'space-invaders':
      case 'breakout':
      case 'asteroids':
        return <GameApp gameId={appId} onClose={() => setSelectedApp(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-96 h-[700px] mx-auto">
      {/* Phone Frame with realistic bezels */}
      <div className="w-full h-full bg-black rounded-[3rem] p-3 shadow-2xl relative z-0"
           style={{
             boxShadow: `
               0 0 0 10px #222,
               0 0 0 12px #333,
               0 0 0 16px #444,
               0 0 0 18px #555,
               0 0 20px rgba(0, 0, 0, 0.5)
             `
           }}>
        
        {/* Camera Sensor */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 -translate-x-4 w-2 h-2 bg-gray-900 rounded-full z-20"
             style={{ boxShadow: 'inset 0 0 2px rgba(255, 255, 255, 0.1)' }}></div>
        
        {/* Speaker */}
        <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-10 h-0.5 bg-gray-700 rounded-sm z-20"></div>
        
        <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative flex flex-col">
          {/* Status Bar */}
          <StatusBar />
          
          {/* Main Content Area */}
          <div className="flex-1 relative bg-black">
            {/* HomeScreen always visible, no animation */}
            <HomeScreen 
              onAppPress={handleAppPress}
              selectedApp={selectedApp}
            />
            {/* Static dimming overlay when an app is open */}
            {selectedApp && (
              <div className="absolute inset-0 bg-black bg-opacity-30 z-10 pointer-events-none" />
            )}
            {/* App Slide-in Animation */}
            <AnimatePresence>
              {selectedApp && (
                <motion.div
                  key={`${selectedApp}-app`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute inset-0 z-20"
                >
                  {renderApp(selectedApp)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Dock */}
          <Dock onAppPress={handleAppPress} onHomePress={handleHomeButton} />
          
          {/* Lock Screen Overlay */}
          <AnimatePresence>
            {isLocked && (
              <LockScreen onUnlock={handleUnlock} tutorialMessages={tutorialMessages} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IPhone;