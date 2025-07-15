import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LockScreenNotifications from './LockScreenNotifications';
import LockScreenSlider from './LockScreenSlider';
import LockScreenTimeDisplay from './LockScreenTimeDisplay';
import LockScreenBackground from './LockScreenBackground';
import LockScreenGrid from './LockScreenGrid';
import { useLockScreen } from './useLockScreen';
import { LOCK_SCREEN_CONSTANTS, LOCK_SCREEN_TYPOGRAPHY } from './constants';
import { Home } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  tutorialMessages: string[];
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, tutorialMessages }) => {
  const { handleUnlock } = useLockScreen({ onUnlock });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-50 overflow-hidden rounded-[2.2rem] flex flex-col justify-between"
        style={{
          fontFamily: LOCK_SCREEN_TYPOGRAPHY.FONT_FAMILY,
        }}
      >
        {/* Wallpaper background with dark blur overlay (now a component) */}
        <LockScreenBackground />
        {/* Status bar will be added here in next step */}
        <div className="flex-1 flex flex-col justify-center items-center pt-10 pb-4">
          {/* Time display (now a component) */}
          <LockScreenTimeDisplay />
          {/* Notifications below time */}
          <div className="mt-6 w-full flex flex-col items-center">
            <LockScreenNotifications tutorialMessages={tutorialMessages} />
          </div>
          {/* Spacer to push slider and home button lower */}
          <div className="flex-1" />
          {/* Slide to Unlock Slider much lower */}
          <div 
            className="mb-4 flex justify-center"
            style={{
              width: LOCK_SCREEN_CONSTANTS.SLIDER_WIDTH, 
              height: LOCK_SCREEN_CONSTANTS.SLIDER_HEIGHT
            }}
          >
            <LockScreenSlider onUnlock={handleUnlock} />
          </div>
          {/* Home Button at the very bottom center */}
          <div className="w-full flex justify-center mb-2">
            <button
              className="w-14 h-14 bg-black rounded-full flex items-center justify-center border-4 border-gray-800 shadow-lg"
              style={{ boxShadow: '0 2px 12px 0 rgba(0,0,0,0.25)' }}
              aria-label="Home Button"
            >
              <Home className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
        {/* Subtle grid pattern overlay for authenticity (now a component) */}
        <LockScreenGrid />
      </motion.div>
    </AnimatePresence>
  );
};

export default LockScreen; 