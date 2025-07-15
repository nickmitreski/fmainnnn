import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import Taskbar from './Taskbar';
import DesktopContextMenu from './DesktopContextMenu';
import TutorialPopup from './TutorialPopup';
import { WindowsContextProvider } from '../../contexts/WindowsContext';
import { AppData, initialAppData, AppContentProps } from '../../data/appData.tsx';
import { Windows95DesktopProps } from '../../types/index';
import useSound from 'use-sound';
import '../../styles/windows95.css';
import { WindowType } from '../../types/window';
import { posthog } from '../../lib/posthog';
import { useWindowManager } from '../../contexts/WindowManagerContext';
import WindowManager from './WindowManager';
import { useUniqueWindowPosition } from '../../hooks/useWindowPosition';

interface ContextMenuPosition {
  x: number;
  y: number;
}

const Desktop: React.FC<Windows95DesktopProps> = ({ onBack, setCurrentView }) => {
  const { createWindow } = useWindowManager();
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const generateUniquePosition = useUniqueWindowPosition();
  const [appData] = useState<AppData>(initialAppData);
  
  const [playStartup] = useSound('/sounds/windows95-startup.mp3', { volume: 0.5 });

  useEffect(() => {
    // Play startup sound when component mounts
    playStartup();
    
    // Track page view with PostHog
    posthog.capture('page_view', { page: 'windows95_desktop' });
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [playStartup]);

  const tutorialSteps = [
    {
      message: "Welcome to 1996! This is a Windows 95 desktop experience.",
      position: { x: 60, y: 60 }
    },
    {
      message: "Feel free to explore the site! Double-click on icons to open them and have some fun.",
      position: { x: 60, y: 220 }
    },
    {
      message: "The Flash Forward folder contains our digital agency services. Take a look inside. Click on 'Update' if you want to update the website to a 2025 one!",
      position: { x: 180, y: 500 }
    }
  ];

  const handleTutorialClose = () => {
    posthog.capture('tutorial_step_completed', { step: currentTutorialStep + 1 });
    setCurrentTutorialStep(prev => prev + 1);
  };

  const clampPositionToViewport = (x: number, y: number, width: number, height: number) => {
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - 28 - height; // 28px for taskbar
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  };

  const handleOpenApp = (appId: string, content?: React.ReactNode, title?: string, positionOverride?: { x: number; y: number }, sizeOverride?: { width: number; height: number }) => {
    if (appId === 'winamp' && !content) {
      console.warn('[DEFENSIVE] Prevented blank Winamp window creation.');
      return;
    }
    if (appId === 'winamp' && (!appData[appId] || appData[appId].contentType !== 'component' || !appData[appId].component)) {
      return;
    }
    posthog.capture('app_opened', { app_id: appId });

    // Use the correct size for this app
    const appDefaultSize = appData[appId]?.defaultSize || { width: 400, height: 300 };
    const size = sizeOverride || appDefaultSize;

    let finalPosition: { x: number; y: number };

    // Always prioritize positionOverride from the component
    if (positionOverride) {
      finalPosition = positionOverride;
    } else if (appData[appId]?.windowPosition) {
      // Fall back to appData windowPosition if no override provided
      finalPosition = { ...appData[appId].windowPosition };
    } else {
      // Use unique positioning for apps opened from desktop icons
      finalPosition = generateUniquePosition();
    }
    
    // Clamp so window is always fully visible
    finalPosition = clampPositionToViewport(finalPosition.x, finalPosition.y, size.width, size.height);

    // Set alwaysOnTop true for all folders (appId ends with 'Folder')
    const isFolder = appId.endsWith('Folder');
    const alwaysOnTop = isFolder ? true : (appData[appId]?.isAlwaysOnTop || false);

    // Special handling for ModernStatsPopup (statsPage)
    if (appId === 'statsPage') {
      createWindow({
        id: appId,
        title: title || appData[appId]?.name || appId,
        content: appData[appId].contentType === 'component'
          ? React.createElement(
              appData[appId].component as React.ComponentType<any>,
              {
                onOpenApp: handleOpenApp,
                onContinueToModernSite: () => setCurrentView('2025'),
              }
            )
          : undefined,
        position: finalPosition,
        size,
        type: appData[appId]?.type as WindowType || (isFolder ? 'folder' : 'application'),
        styles: {
          isResizable: appData[appId]?.isResizable !== undefined ? appData[appId]?.isResizable : true,
          alwaysOnTop,
        },
      });
    } else if (content !== undefined && title !== undefined) {
      createWindow({
        id: appId,
        title: title,
        content: content,
        position: finalPosition,
        size,
        type: appData[appId]?.type as WindowType || (isFolder ? 'folder' : 'application'),
        styles: {
          isResizable: appData[appId]?.isResizable !== undefined ? appData[appId]?.isResizable : true,
          alwaysOnTop,
        },
      });
    } else if (appData[appId]) {
      // Prevent blank Winamp window
      if (appId === 'winamp') return;
      createWindow({
        id: appId,
        title: title || appData[appId]?.name || appId,
        content: appData[appId].contentType === 'component' ? React.createElement(appData[appId].component as React.ComponentType<AppContentProps>, { onOpenApp: handleOpenApp }) : undefined,
        position: finalPosition,
        size,
        type: appData[appId]?.type as WindowType || (isFolder ? 'folder' : 'application'),
        styles: {
          isResizable: appData[appId]?.isResizable !== undefined ? appData[appId]?.isResizable : true,
          alwaysOnTop,
        },
      });
    } else {
      console.error(`Data for app ${appId} not found.`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Only show context menu if clicking directly on the desktop
    if (e.target === e.currentTarget) {
      setContextMenu({ x: e.clientX, y: e.clientY });
      
      // Track context menu opening with PostHog
      posthog.capture('desktop_context_menu_opened');
    }
  };

  const handleArrangeIcons = () => {
    // Implement icon arrangement logic
    posthog.capture('desktop_icons_arranged');
  };

  const handleRefresh = () => {
    // Implement refresh logic
    posthog.capture('desktop_refreshed');
  };

  const handleNewFolder = () => {
    // Implement new folder creation logic
    posthog.capture('new_folder_created');
  };

  // Adjust icon positions for mobile
  const getAdjustedIconPosition = (originalPosition: { x: number; y: number }) => {
    if (!isMobile) return originalPosition;
    
    // Scale down positions for mobile, but keep vertical spacing compact
    const scaleFactorX = 0.7;
    const scaleFactorY = 1.0; // No extra vertical spacing for mobile
    return {
      x: originalPosition.x * scaleFactorX,
      y: originalPosition.y * scaleFactorY
    };
  };

  // Define desktop icons and their positions
  const desktopIcons = [
    // First column
    { id: 'myComputer', position: { x: 20, y: 20 } },
    { id: 'myDocuments', position: { x: 20, y: 120 } },
    { id: 'recycleBin', position: { x: 20, y: 220 } },
    { id: 'calculator', position: { x: 20, y: 320 } },
    { id: 'internetExplorer', position: { x: 20, y: 420 } },
    { id: 'msPaint', position: { x: 20, y: 520 } },
    { id: 'winamp', position: { x: 20, y: 620 } },
    
    // Second column
    { id: 'mediaFolder', position: { x: 130, y: 20 } },
    { id: 'gamesFolder', position: { x: 130, y: 120 } },
    { id: 'aiStuffFolder', position: { x: 130, y: 220 } },
    { id: 'tv', position: { x: 130, y: 320 } },
    { id: 'notepad', position: { x: 130, y: 420 } },
    { id: 'flashForwardFolder', position: { x: 130, y: 520 } }
  ];

  return (
    <WindowsContextProvider onBack={onBack}>
      <div 
        className="win95"
        onContextMenu={handleContextMenu}
        onClick={() => setContextMenu(null)}
      >
        {currentTutorialStep < tutorialSteps.length && (
          <TutorialPopup
            message={tutorialSteps[currentTutorialStep].message}
            onClose={handleTutorialClose}
            position={isMobile ? 
              { x: window.innerWidth / 2 - 150, y: window.innerHeight / 3 } : 
              tutorialSteps[currentTutorialStep].position}
          />
        )}
        {/* Render desktop icons */}
        {desktopIcons.map(({ id, position }) => {
          const app = appData[id];
          if (!app) {
            console.error(`App ${id} not found in appData`);
            return null;
          }
          
          return (
            <Icon 
              key={id}
              name={app.name}
              icon={app.icon}
              x={isMobile ? 
                getAdjustedIconPosition(position).x : 
                position.x}
              y={isMobile ? 
                getAdjustedIconPosition(position).y : 
                position.y}
              onOpen={() => handleOpenApp(id, app.contentType === 'component' ? React.createElement(app.component as React.ComponentType<AppContentProps>, { onOpenApp: handleOpenApp }) : undefined, app.name)}
              singleClick={isMobile}
            />
          );
        })}
        {/* Render all windows using WindowManager */}
        <WindowManager />
        <Taskbar onBack={onBack} />
        {contextMenu && (
          <DesktopContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onArrange={handleArrangeIcons}
            onRefresh={handleRefresh}
            onNewFolder={handleNewFolder}
          />
        )}
      </div>
    </WindowsContextProvider>
  );
};

export default Desktop;