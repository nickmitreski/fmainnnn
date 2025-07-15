import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StatusBar from './StatusBar';
import HomeScreen from './HomeScreen';
import Dock from './Dock';
import Maps from './Maps';
import YouTube from './YouTube';

const IPhone: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleAppPress = (appId: string) => {
    setSelectedApp(appId);
  };

  const handleHomeButton = () => {
    setSelectedApp(null);
  };

  const handleClosePopup = () => {
    setSelectedApp(null);
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
            <HomeScreen 
              onAppPress={handleAppPress}
              selectedApp={selectedApp}
            />
            
            {/* App Screen Overlays */}
            {selectedApp === 'maps' && (
              <div className="absolute top-5 left-0 w-full h-full bg-gradient-to-b from-gray-100 to-gray-200 z-30">
                <div className="relative w-full h-full">
                  <Maps />
                  <button 
                    onClick={handleClosePopup} 
                    className="absolute top-2 right-2 bg-white/90 rounded-full px-3 py-1 text-black font-bold text-sm shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            
            {selectedApp === 'youtube' && (
              <div className="absolute top-5 left-0 w-full h-full bg-white z-30">
                <div className="relative w-full h-full">
                  <YouTube />
                  <button 
                    onClick={handleClosePopup} 
                    className="absolute top-2 right-2 bg-white/90 rounded-full px-3 py-1 text-black font-bold text-sm shadow-lg z-40"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Dock */}
          <Dock onAppPress={handleAppPress} onHomePress={handleHomeButton} />
        </div>
      </div>
    </div>
  );
};

export default IPhone;