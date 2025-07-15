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
    { id: 'phone', icon: 'Phone', label: 'Phone', imageIcon: '/icons/iPhone_OS_Icons/Phone.png', color: '' },
    { id: 'mail', icon: 'Mail', label: 'Contact Us', imageIcon: '/icons/iPhone_OS_Icons/Mail.png', color: '' },
    { id: 'safari', icon: 'Safari', label: 'Modern Site', imageIcon: '/icons/iPhone_OS_Icons/Safari.png', color: '' },
    { id: 'videos', icon: 'iPod', label: 'Videos', imageIcon: '/icons/iPhone_OS_Icons/iPod.png', color: '' }, // No Videos icon, using iPod as placeholder
  ];

  return (
    <div className="relative w-full flex flex-col items-center" style={{ background: 'transparent' }}>
      {/* Glass Shelf Dock - raised and with more pronounced shadow */}
      <div className="relative w-[90%] max-w-[340px] h-16 rounded-3xl bg-white/30 backdrop-blur-md flex items-center justify-center shadow-2xl" style={{
        marginBottom: '12px',
        marginTop: '8px',
        boxShadow: '0 10px 32px 0 rgba(0,0,0,0.35), 0 1.5px 0 0 rgba(255,255,255,0.18) inset'
      }}>
        {/* Shine Gradient */}
        <div className="absolute left-0 top-0 w-full h-1/2 rounded-t-3xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 100%)', pointerEvents: 'none' }} />
        {/* Dock Apps */}
        <div className="relative w-full flex justify-around items-end z-10">
          {dockApps.map((app) => (
            <div key={app.id} className="flex flex-col items-center">
              <div className="drop-shadow-lg">
                <AppIcon
                  {...app}
                  onPress={() => onAppPress(app.id)}
                  isSelected={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Home Button centered below dock with space */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onHomePress}
        className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600 shadow-md"
        style={{ zIndex: 20, marginTop: '6px', marginBottom: '2px' }}
      >
        <Home className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
};

export default Dock;