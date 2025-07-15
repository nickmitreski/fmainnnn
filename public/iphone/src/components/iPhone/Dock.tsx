import React from 'react';
import { motion } from 'framer-motion';
import AppIcon from './AppIcon';
import { Home } from 'lucide-react';

interface DockProps {
  onAppPress: (appId: string) => void;
  onHomePress: () => void;
}

const Dock: React.FC<DockProps> = ({ onAppPress, onHomePress }) => {
  const dockApps = [
    { id: 'phone', icon: 'Phone', label: 'Phone', color: 'bg-green-600' },
    { id: 'mail', icon: 'Mail', label: 'Contact Us', color: 'bg-blue-500' },
    { id: 'safari', icon: 'Globe', label: 'Modern Site', color: 'bg-blue-600' },
    { id: 'videos', icon: 'Video', label: 'Videos', color: 'bg-indigo-600' },
  ];

  return (
    <div className="p-4 bg-black">
      <div className="flex justify-between items-center">
        {/* Dock Apps */}
        <div className="flex space-x-6">
          {dockApps.map((app) => (
            <div key={app.id} className="scale-90">
              <AppIcon
                {...app}
                onPress={() => onAppPress(app.id)}
                isSelected={false}
              />
            </div>
          ))}
        </div>
        
        {/* Home Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onHomePress}
          className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600 ml-4"
        >
          <Home className="w-6 h-6 text-white" />
        </motion.button>
      </div>
    </div>
  );
};

export default Dock;