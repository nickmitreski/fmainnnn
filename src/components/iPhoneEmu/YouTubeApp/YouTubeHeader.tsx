import React from 'react';

interface YouTubeHeaderProps {
  onClose: () => void;
}

const YouTubeHeader: React.FC<YouTubeHeaderProps> = ({ onClose }) => (
  <div className="relative h-12 flex items-center justify-center bg-gradient-to-b from-[#6d83a1] to-[#b4bfce] border-b border-blue-700 shadow-inner">
    <button
      className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-gradient-to-b from-white/80 to-blue-200 border border-blue-400 text-blue-700 text-xs font-semibold shadow skeuo-header-btn"
      onClick={onClose}
    >
      Close
    </button>
    <span className="contact_name button text-white font-bold text-base tracking-tight drop-shadow-sm">YouTube</span>
  </div>
);

export default YouTubeHeader; 