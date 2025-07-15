import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';

interface FolderApp {
  id: string;
  icon: string;
  label: string;
  color: string;
  imageIcon?: string; // Added for image icons
}

interface FolderProps {
  id: string;
  label: string;
  apps: FolderApp[];
  onAppPress: (appId: string) => void;
  isSelected: boolean;
}

const Folder: React.FC<FolderProps> = ({ 
  label, 
  apps, 
  onAppPress, 
  isSelected 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFolderPress = () => {
    setIsOpen(true);
  };

  const handleAppPress = (appId: string) => {
    setIsOpen(false);
    onAppPress(appId);
  };

  const handleBackdropPress = () => {
    setIsOpen(false);
  };

  // Show first 9 apps as mini icons in the folder preview
  const previewApps = apps.slice(0, 9);

  return (
    <>
      {/* Folder Icon */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleFolderPress}
        className="flex flex-col items-center space-y-1 relative"
        animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
      >
        {/* Folder Background */}
        <div className="relative w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-gray-300 shadow-inner">
          {/* Inner border for depth */}
          <div className="absolute inset-0.5 rounded-xl border border-gray-400/50"></div>
          
          {/* Folder Grid - 3x3 mini icons */}
          <div className="grid grid-cols-3 gap-1 p-2.5 w-full h-full">
            {previewApps.map((app) => {
              return (
                <div
                  key={app.id}
                  className={`w-full h-full rounded-sm flex items-center justify-center shadow-sm`}
                  style={{ minWidth: '3px', minHeight: '3px' }}
                >
                  {app.imageIcon ? (
                    <img src={app.imageIcon} alt={app.label} className="w-4 h-4 object-contain" />
                  ) : (
                    (() => {
                      const IconComponent = Icons[app.icon as keyof typeof Icons] as React.ComponentType<any>;
                      return <IconComponent className="w-1.5 h-1.5 text-white" />;
                    })()
                  )}
                </div>
              );
            })}
            {/* Fill empty slots with transparent divs */}
            {Array.from({ length: 9 - previewApps.length }).map((_, index) => (
              <div key={`empty-${index}`} className="w-full h-full" />
            ))}
          </div>

          {/* Glossy Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-60"></div>
          
          {/* Metallic highlight */}
          <div className="absolute top-0.5 left-0.5 right-0.5 h-2 rounded-t-xl bg-gradient-to-b from-white/40 to-transparent"></div>
          
          {/* Selected Ring */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 rounded-2xl ring-2 ring-white/60 ring-offset-2 ring-offset-transparent"
            />
          )}
        </div>
        
        {/* Folder Label */}
        <span className="text-white text-[10px] font-medium max-w-16 truncate leading-tight">
          {label}
        </span>
      </motion.button>

      {/* Folder Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 top-0 w-full h-full z-50 flex items-center justify-center bg-black/50 scale-[1.10]"
            style={{ borderRadius: 'inherit' }}
            onClick={handleBackdropPress}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 mx-4 max-w-md w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Folder Title */}
              <div className="text-center mb-2">
                <h3 className="text-white text-base font-normal">{label}</h3>
              </div>

              {/* App Grid - 3x3 layout */}
              <div className="grid grid-cols-3 gap-4">
                {apps.slice(0, 9).map((app) => {
                  return (
                    <motion.button
                      key={app.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAppPress(app.id)}
                      className="flex flex-col items-center space-y-2"
                    >
                      {/* App Icon */}
                      {app.imageIcon ? (
                        <div className="relative w-16 h-16 rounded-xl flex items-center justify-center border border-white/20">
                          <img src={app.imageIcon} alt={app.label} className="w-full h-full object-contain relative z-10" />
                        </div>
                      ) : (
                        <div className="relative w-16 h-16 rounded-xl shadow-lg flex items-center justify-center border border-white/20 bg-gradient-to-br from-white/20 to-transparent">
                          {/* Glossy Effect */}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-white/20 to-transparent opacity-70"></div>
                          {(() => {
                            const IconComponent = Icons[app.icon as keyof typeof Icons] as React.ComponentType<any>;
                            return <IconComponent className="w-8 h-8 text-white relative z-10" />;
                          })()}
                        </div>
                      )}
                      {/* App Label */}
                      <span className="text-white text-[10px] font-normal max-w-16 leading-tight text-center">
                        {app.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Home Button at the bottom of the folder popup */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg hover:bg-white/10 transition-colors"
                  aria-label="Home"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="17" width="10" height="2" rx="1"/></svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Folder; 