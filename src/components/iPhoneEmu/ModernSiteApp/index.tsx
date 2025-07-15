import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ModernSiteHeader from './ModernSiteHeader';
import { getSessionDuration, getClickCount } from '../../../lib/analytics';
import { ViewType } from '../../../types/index';

interface ModernSiteAppProps {
  onClose: () => void;
  setCurrentView: (view: ViewType) => void;
}

const ModernSiteApp: React.FC<ModernSiteAppProps> = ({ onClose, setCurrentView }) => {
  const [sessionDuration, setSessionDuration] = useState(getSessionDuration());
  const [clickCount, setClickCount] = useState(getClickCount());

  // Update session duration and click count every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(getSessionDuration());
      setClickCount(getClickCount());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to format seconds as hh:mm:ss
  function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Add a small offset for demo effect
  const displaySessionDuration = sessionDuration + 7; // e.g. +7 seconds
  const displayClickCount = clickCount + 3;

  const handleContinueToModernSite = () => {
    setCurrentView('2025');
  };

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.7, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-full h-full bg-black flex flex-col"
    >
      <ModernSiteHeader onClose={onClose} />
      
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          {/* Flash Forward Value Proposition */}
          <div className="mb-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-800 mb-3">Why Flash Forward Sites Perform Better</div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  We design sites that naturally keep visitors engaged longer and encourage more interactions. 
                  Here's the proven impact of better engagement on business results:
                </div>
              </div>
            </div>
          </div>

          {/* Current Site Performance Display */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-gray-200">
              <div className="text-center mb-3">
                <div className="text-sm font-semibold text-gray-700 mb-2">This Site's Live Performance</div>
                <div className="text-xs text-gray-500">See how our design keeps you engaged</div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatDuration(displaySessionDuration)}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Your Session Time</div>
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {displayClickCount}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Your Interactions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Impact Stats */}
          <div className="space-y-4 mb-6">
            {/* Time Impact Section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Impact of Longer Session Times</h3>
                <p className="text-xs text-blue-600 mt-1">When visitors stay 2-3+ minutes on sites we build</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">2.4x</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Higher Conversion Rate</div>
                    <div className="text-xs text-gray-500">Visitors who stay 2+ minutes convert 2.4x more than quick visitors</div>
                  </div>
                  <div className="text-center border-l border-r border-gray-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">73%</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Better Brand Recall</div>
                    <div className="text-xs text-gray-500">Longer sessions create 73% better brand memory and recognition</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">87%</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Return Rate</div>
                    <div className="text-xs text-gray-500">Visitors who spend 3+ minutes return 87% more often</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Impact Section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="px-4 py-3 bg-purple-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wide">Impact of More User Interactions</h3>
                <p className="text-xs text-purple-600 mt-1">When visitors click/interact 3-4+ times on our sites</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">5.2x</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Conversion Rate</div>
                    <div className="text-xs text-gray-500">Users who interact 4+ times convert 5.2x more than passive visitors</div>
                  </div>
                  <div className="text-center border-l border-r border-gray-200">
                    <div className="text-2xl font-bold text-purple-600 mb-1">91%</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Engagement Quality</div>
                    <div className="text-xs text-gray-500">Sites with 3+ interactions show 91% higher engagement quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">3.8x</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Share Rate</div>
                    <div className="text-xs text-gray-500">Highly interactive visitors share content 3.8x more frequently</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEO & Business Impact */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">SEO & Business Impact</h3>
                <p className="text-xs text-green-600 mt-1">How engagement improvements boost search rankings and traffic</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">45%</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">SEO Ranking Boost</div>
                    <div className="text-xs text-gray-500">Google rewards sites with 2+ minute sessions with 45% better rankings</div>
                  </div>
                  <div className="text-center border-l border-r border-gray-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">67%</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Lower Bounce Rate</div>
                    <div className="text-xs text-gray-500">Interactive sites achieve 67% lower bounce rates than static ones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">2.1x</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Organic Traffic Growth</div>
                    <div className="text-xs text-gray-500">Engaged sites see 2.1x more organic traffic growth over time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Continue Button */}
          <div className="px-2">
            <button
              onClick={handleContinueToModernSite}
              className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-150 shadow-sm"
              style={{
                background: 'linear-gradient(180deg, #007AFF 0%, #0056CC 100%)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)'
              }}
            >
              Continue to Modern Site
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernSiteApp; 