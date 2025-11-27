import React, { useEffect, useState } from "react";
import { PassiveTreeData, TreeStats } from "../types/passiveTree";
import "./PassiveTreePanel.css";

interface PassiveTreePanelProps {
  passiveTreeData?: PassiveTreeData;
  isVisible: boolean;
  settingsOpen: boolean;
  onTogglePanel: () => void;
  showToggleButton?: boolean;
}

/**
 * PassiveTreePanel - A button/panel component that launches a detached window
 * for viewing the passive tree from imported POB data.
 * 
 * Unlike other panels that slide up from the bottom, this opens a separate window
 * because the passive tree viewer needs more screen real estate.
 */
export const PassiveTreePanel: React.FC<PassiveTreePanelProps> = ({
  passiveTreeData,
  isVisible,
  settingsOpen,
  onTogglePanel,
  showToggleButton = true,
}) => {
  const [isTreeWindowOpen, setIsTreeWindowOpen] = useState(false);
  const isElectron = !!window.electronAPI;

  // Check if tree window is open on mount
  useEffect(() => {
    const checkWindowStatus = async () => {
      if (isElectron && window.electronAPI?.isTreeWindowOpen) {
        const isOpen = await window.electronAPI.isTreeWindowOpen();
        setIsTreeWindowOpen(isOpen);
      }
    };
    checkWindowStatus();
  }, [isElectron]);

  // Listen for tree window closed event
  useEffect(() => {
    if (!isElectron || !window.electronAPI?.onTreeWindowClosed) return;

    const unsubscribe = window.electronAPI.onTreeWindowClosed(() => {
      setIsTreeWindowOpen(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [isElectron]);

  // Calculate basic tree stats for display
  const treeStats: TreeStats | null = React.useMemo(() => {
    if (!passiveTreeData) return null;

    const stats: TreeStats = {
      totalPoints: passiveTreeData.allocatedNodes.length,
      keystones: 0, // Will be calculated when we have tree structure data
      notables: 0,
      normalNodes: passiveTreeData.allocatedNodes.length,
      masteries: passiveTreeData.masterySelections.size,
      attributePoints: {
        str: 0,
        dex: 0,
        int: 0,
      },
    };

    return stats;
  }, [passiveTreeData]);

  // Handle opening the tree window
  const handleOpenTreeWindow = async () => {
    if (!isElectron || !window.electronAPI?.openTreeWindow) {
      console.warn("Tree window functionality requires Electron");
      return;
    }

    try {
      // Convert Map to serializable format for IPC
      const serializableData = passiveTreeData ? {
        ...passiveTreeData,
        masterySelections: Array.from(passiveTreeData.masterySelections.entries()),
        jewelSockets: passiveTreeData.jewelSockets 
          ? Array.from(passiveTreeData.jewelSockets.entries()) 
          : undefined,
      } : null;

      await window.electronAPI.openTreeWindow(serializableData);
      setIsTreeWindowOpen(true);
    } catch (error) {
      console.error("Failed to open tree window:", error);
    }
  };

  // Handle closing the tree window
  const handleCloseTreeWindow = async () => {
    if (!isElectron || !window.electronAPI?.closeTreeWindow) return;

    try {
      await window.electronAPI.closeTreeWindow();
      setIsTreeWindowOpen(false);
    } catch (error) {
      console.error("Failed to close tree window:", error);
    }
  };

  // Handle toggle - opens or closes the window
  const handleToggle = async () => {
    if (isTreeWindowOpen) {
      await handleCloseTreeWindow();
    } else {
      await handleOpenTreeWindow();
    }
    onTogglePanel();
  };

  // Don't render if no tree data
  if (!passiveTreeData) {
    return null;
  }

  return (
    <>
      {/* Toggle Button - positioned at bottom with other panel buttons */}
      {showToggleButton && (
        <div className={`tree-panel-toggle ${isTreeWindowOpen ? "panel-open" : ""} ${settingsOpen ? "settings-open" : ""}`}>
          <button
            className="tree-toggle-btn"
            onClick={handleToggle}
            title={isTreeWindowOpen ? "Close Passive Tree Viewer" : "Open Passive Tree Viewer"}
          >
            <span className="toggle-icon">🌳</span>
            <span className="toggle-text">Tree</span>
            {treeStats && (
              <span className="tree-points-badge">{treeStats.totalPoints}</span>
            )}
          </button>
        </div>
      )}

      {/* Info tooltip that shows when hovering over the button */}
      {passiveTreeData && (
        <div className="tree-info-tooltip">
          <div className="tree-info-header">
            <span className="class-name">{passiveTreeData.className}</span>
            {passiveTreeData.ascendClassName !== "None" && (
              <span className="ascendancy-name">({passiveTreeData.ascendClassName})</span>
            )}
          </div>
          <div className="tree-info-stats">
            <span>Allocated Points: {passiveTreeData.allocatedNodes.length}</span>
            {passiveTreeData.masterySelections.size > 0 && (
              <span>Masteries: {passiveTreeData.masterySelections.size}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
