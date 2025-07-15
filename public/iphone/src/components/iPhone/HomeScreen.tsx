import React from 'react';
import { motion } from 'framer-motion';
import AppIcon from './AppIcon';

interface HomeScreenProps {
  onAppPress: (appId: string) => void;
  selectedApp: string | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onAppPress, 
  selectedApp 
}) => {
  const allApps = [
    { id: 'messages', icon: 'MessageCircle', label: 'Messages', color: 'bg-green-500' },
    { id: 'calendar', icon: 'Calendar', label: 'Calendar', color: 'bg-red-500' },
    { id: 'photos', icon: 'Camera', label: 'Photos', color: 'bg-blue-500' },
    { id: 'clock', icon: 'Clock', label: 'Clock', color: 'bg-black' },
    { id: 'calculator', icon: 'Calculator', label: 'Calculator', color: 'bg-gray-700' },
    { id: 'notes', icon: 'FileText', label: 'Notes', color: 'bg-yellow-500' },
    { id: 'settings', icon: 'Settings', label: 'Settings', color: 'bg-gray-500' },
    { id: 'contacts', icon: 'Users', label: 'Contacts', color: 'bg-orange-500' },
    { id: 'youtube', icon: 'Play', label: 'YouTube', color: 'bg-red-500' },
    { id: 'maps', icon: 'MapPin', label: 'Maps', color: 'bg-red-600' },
    { id: 'weather', icon: 'Cloud', label: 'Weather', color: 'bg-blue-400' },
    { id: 'stocks', icon: 'TrendingUp', label: 'Stocks', color: 'bg-black' },
    { id: 'appstore', icon: 'Download', label: 'App Store', color: 'bg-blue-500' },
    { id: 'voice', icon: 'Mic', label: 'Voice Memos', color: 'bg-gray-700' },
    { id: 'itunes', icon: 'Music2', label: 'iTunes', color: 'bg-purple-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="relative h-full p-4 pt-6 bg-black"
    >
      {/* App Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {allApps.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <AppIcon
              {...app}
              onPress={() => onAppPress(app.id)}
              isSelected={selectedApp === app.id}
            />
          </motion.div>
        ))}
      </div>

      {/* Page Indicator */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default HomeScreen;