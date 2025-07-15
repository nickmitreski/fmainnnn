import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PhoneHeader from './PhoneHeader';

interface PhoneAppProps {
  onClose: () => void;
}

const PhoneApp: React.FC<PhoneAppProps> = ({ onClose }) => {
  const [isCalling, setIsCalling] = useState(false);

  const handleCall = () => {
    if (!isCalling) {
      setIsCalling(true);
      // Mock call simulation - will be replaced with Twilio webhook
      setTimeout(() => {
        alert('📞 Mock call initiated!\n\n(Twilio webhook integration coming soon!)');
      }, 1000);
    } else {
      // Hang up
      setIsCalling(false);
      alert('📵 Call ended');
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.7, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full h-full bg-black flex flex-col"
    >
      <PhoneHeader onClose={onClose} />
      
      {/* Phone Content */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center px-8">
        
        {/* Call Status Display */}
        <div className="mb-12">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl border-4 transition-all duration-300 ${
            isCalling 
              ? 'bg-green-100 border-green-300 animate-pulse' 
              : 'bg-gray-100 border-gray-300'
          }`}>
            {isCalling ? '📞' : '📱'}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-8">
          <h2 className="text-gray-800 text-xl font-semibold mb-2">
            {isCalling ? 'Calling...' : 'Ready to Call'}
          </h2>
          <p className="text-gray-600 text-sm">
            {isCalling ? 'Touch to hang up' : 'Touch to make a call'}
          </p>
        </div>

        {/* Call/Hang Up Button */}
        <button
          onClick={handleCall}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-200 shadow-lg ${
            isCalling
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isCalling ? '📵' : '📞'}
        </button>

        {/* Call Description */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            {isCalling ? 'Tap to end call' : 'Tap to start call'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PhoneApp; 