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
  const [updateChecking, setUpdateChecking] = useState(false);
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

  const handleCheckForUpdates = async () => {
    if (isElectron && !updateChecking) {
      setUpdateChecking(true);
      try {
        await window.electronAPI.checkForUpdates();
        setTimeout(() => setUpdateChecking(false), 2000);
      } catch (error) {
        console.error("Failed to check for updates:", error);
        setUpdateChecking(false);
      }
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
            {appVersion && (
              <span
                className="app-version"
                onClick={handleCheckForUpdates}
                style={{
                  cursor: updateChecking ? "wait" : "pointer",
                  opacity: updateChecking ? 0.6 : 1,
                }}
                title={
                  updateChecking
                    ? "Checking for updates..."
                    : "Click to check for updates"
                }
              >
                v{appVersion} {updateChecking && "🔄"}
              </span>
            )}
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

            <div className="setting-item">
              <div className="setting-label">SHOW OPTIONAL</div>
              <div className="setting-control">
                <label className="setting-checkbox">
                  <input
                    type="checkbox"
                    checked={settings.showOptional !== false}
                    onChange={(e) =>
                      onSettingsChange({ showOptional: e.target.checked })
                    }
                  />
                  Show Optional Quests
                </label>
              </div>
            </div>
          </div>

          {isElectron && (
            <div className="overlay-help">
              <div className="help-text">
                <strong>Usage:</strong>
                <br />
                • Press F9 to show/hide the quest tracker
                <br />
                • Use Borderless Windowed mode in PoE2 for best experience
                <br />• Adjust opacity for visibility while gaming
                <br />• Click version number to check for updates
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
