import React, { useState, useEffect } from 'react';

const StatusBar: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 bg-black/40 text-white text-xs font-bold relative z-10">
      {/* Signal Strength */}
      <div className="flex items-center space-x-1">
        <div className="flex gap-0.5">
          <div className="w-0.5 h-1.5 bg-white rounded-sm"></div>
          <div className="w-0.5 h-2 bg-white rounded-sm"></div>
          <div className="w-0.5 h-2.5 bg-white rounded-sm"></div>
          <div className="w-0.5 h-3 bg-white rounded-sm"></div>
        </div>
        <span className="text-xs ml-1">Carrier</span>
      </div>
      
      {/* Time */}
      <div className="text-center font-bold text-xs">
        {formatTime(time)}
      </div>
      
      {/* WiFi and Battery */}
      <div className="flex items-center space-x-1">
        <div className="text-xs">📶</div>
        <div className="relative w-4 h-2 border border-white rounded-sm">
          <div className="absolute top-0.5 left-0.5 w-3 h-1 bg-green-400 rounded-sm"></div>
          <div className="absolute top-0 right-0 w-0.5 h-2 bg-white rounded-r-sm"></div>
        </div>
        <span className="text-xs">100%</span>
      </div>
    </div>
  );
};

export default StatusBar;