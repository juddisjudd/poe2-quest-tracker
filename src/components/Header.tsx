import React, { useState } from "react";
import { TrackerData } from "../types";

interface HeaderProps {
  settings: TrackerData["settings"];
  onSettingsChange: (settings: Partial<TrackerData["settings"]>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  // Check if the Electron API is available before using it
  const isElectron = !!window.electronAPI;

  const handleMinimize = async () => {
    if (isElectron) {
      await window.electronAPI.minimizeWindow();
    }
  };

  const handleClose = async () => {
    if (isElectron) {
      await window.electronAPI.closeWindow();
    }
  };

  const handleAlwaysOnTopToggle = async () => {
    const newValue = !settings.alwaysOnTop;
    onSettingsChange({ alwaysOnTop: newValue });
    if (isElectron) {
      await window.electronAPI.toggleAlwaysOnTop(newValue);
    }
  };

  return (
    <div className="header">
      <div className="title-bar">
        <div className="title">
          <span className="title-text">Quest Tracker</span>
          {/* Only show the hotkey hint in Electron */}
          {isElectron && <span className="hotkey-hint">F9</span>}
        </div>
        {/* Only show window controls in Electron */}
        {isElectron && (
          <div className="window-controls">
            <button
              className="control-btn settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙
            </button>
            <button
              className="control-btn minimize-btn"
              onClick={handleMinimize}
              title="Minimize"
            >
              −
            </button>
            <button
              className="control-btn close-btn"
              onClick={handleClose}
              title="Close"
            >
              ×
            </button>
          </div>
        )}
      </div>
      {showSettings && (
        <div className="settings-panel">
          {/* Only show the "Always on Top" setting in Electron */}
          {isElectron && (
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.alwaysOnTop}
                  onChange={handleAlwaysOnTopToggle}
                />{" "}
                Always on Top
              </label>
            </div>
          )}
          <div className="setting-item">
            <label>
              {" "}
              Opacity: {Math.round(settings.opacity * 100)}%
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.1"
                value={settings.opacity}
                onChange={(e) =>
                  onSettingsChange({ opacity: parseFloat(e.target.value) })
                }
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
