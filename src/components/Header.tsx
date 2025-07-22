import React, { useState, useEffect } from "react";
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
  const [appVersion, setAppVersion] = useState<string>("");

  const isElectron = !!window.electronAPI;

  useEffect(() => {
    const loadVersion = async () => {
      if (isElectron) {
        try {
          const version = await window.electronAPI.getAppVersion();
          setAppVersion(version);
        } catch (error) {
          console.error("Failed to get app version:", error);
        }
      }
    };

    loadVersion();
  }, [isElectron]);

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
        </div>
        {/* Only show window controls in Electron */}
        {isElectron && (
          <div className="window-controls">
            {/* Show version if available */}
            {appVersion && <span className="app-version">v{appVersion}</span>}
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
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-label">THEME</div>
              <div className="setting-control">
                <select
                  value={(settings as any).theme || "amoled"}
                  onChange={(e) =>
                    onSettingsChange({
                      theme: e.target.value as
                        | "amoled"
                        | "amoled-crimson"
                        | "amoled-yellow",
                    })
                  }
                  className="theme-selector"
                >
                  <option value="amoled">AMOLED</option>
                  <option value="amoled-crimson">AMOLED CRIMSON</option>
                  <option value="amoled-yellow">AMOLED YELLOW</option>
                </select>
              </div>
            </div>

            {/* Only show the "Always on Top" setting in Electron */}
            {isElectron && (
              <div className="setting-item">
                <div className="setting-label">WINDOW BEHAVIOR</div>
                <div className="setting-control">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={settings.alwaysOnTop}
                      onChange={handleAlwaysOnTopToggle}
                    />
                    ALWAYS ON TOP
                  </label>
                </div>
              </div>
            )}

            <div className="setting-item">
              <div className="setting-label">OPACITY</div>
              <div className="setting-control">
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
                <span className="setting-value">
                  {Math.round(settings.opacity * 100)}%
                </span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-label">FONT SIZE</div>
              <div className="setting-control">
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.1"
                  value={settings.fontSize || 1.0}
                  onChange={(e) =>
                    onSettingsChange({ fontSize: parseFloat(e.target.value) })
                  }
                />
                <span className="setting-value">
                  {Math.round((settings.fontSize || 1.0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
