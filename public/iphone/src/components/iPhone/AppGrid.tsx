import React from 'react';
import { motion } from 'framer-motion';
import AppIcon from './AppIcon';

interface AppGridProps {
  onAppPress: (appId: string) => void;
  selectedApp: string | null;
}

const AppGrid: React.FC<AppGridProps> = ({ onAppPress, selectedApp }) => {
  const allApps = [
    { id: 'safari', icon: 'Globe', label: 'Safari', color: 'bg-blue-600' },
    { id: 'mail', icon: 'Mail', label: 'Mail', color: 'bg-blue-500' },
    { id: 'phone', icon: 'Phone', label: 'Phone', color: 'bg-green-600' },
    { id: 'ipod', icon: 'Music', label: 'iPod', color: 'bg-purple-600' },
    { id: 'maps', icon: 'MapPin', label: 'Maps', color: 'bg-red-600' },
    { id: 'weather', icon: 'Cloud', label: 'Weather', color: 'bg-blue-400' },
    { id: 'stocks', icon: 'TrendingUp', label: 'Stocks', color: 'bg-black' },
    { id: 'youtube', icon: 'Play', label: 'YouTube', color: 'bg-red-500' },
    { id: 'itunes', icon: 'Music2', label: 'iTunes', color: 'bg-purple-500' },
    { id: 'appstore', icon: 'Download', label: 'App Store', color: 'bg-blue-500' },
    { id: 'camera', icon: 'Camera', label: 'Camera', color: 'bg-gray-600' },
    { id: 'voice', icon: 'Mic', label: 'Voice Memos', color: 'bg-gray-700' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="h-full p-4 pt-6"
    >
      <div className="grid grid-cols-4 gap-4">
        {allApps.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AppIcon
              {...app}
              onPress={() => onAppPress(app.id)}
              isSelected={selectedApp === app.id}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AppGrid;