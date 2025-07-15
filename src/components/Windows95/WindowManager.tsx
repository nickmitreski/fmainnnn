import React from 'react';
import Window from './Window';
import { useWindowManager } from '../../contexts/WindowManagerContext';

const WindowManager: React.FC = () => {
  const { windows, closeWindow, minimizeWindow, maximizeWindow, restoreWindow } = useWindowManager();

  return (
    <div className="window-manager">
      {windows.map((window) => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          initialPosition={window.position}
          initialSize={window.size}
          content={window.content}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
          isMinimized={window.state === 'minimized'}
          type={window.type}
          isResizable={window.styles?.isResizable}
          isAlwaysOnTop={window.styles?.alwaysOnTop}
        />
      ))}
    </div>
  );
};

export default WindowManager; 