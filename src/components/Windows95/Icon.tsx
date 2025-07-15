import React, { memo } from 'react';

interface IconProps {
  name: string;
  icon: string;
  x: number;
  y: number;
  onOpen: () => void;
  singleClick?: boolean;
}

const Icon: React.FC<IconProps> = ({ name, icon, x, y, onOpen, singleClick }) => {
  const handleOpen = () => {
    console.log('[DEBUG] Icon onOpen fired for:', name);
    onOpen();
  };
  return (
    <div 
      className="win95-desktop-icon" 
      style={{ left: `${x}px`, top: `${y}px` }}
      {...(singleClick ? { onClick: handleOpen } : { onDoubleClick: handleOpen })}
    >
      <img src={icon} alt={name} className="win95-desktop-icon-img" />
      <div className="win95-desktop-icon-text">{name}</div>
    </div>
  );
};

export default memo(Icon);