import React, { useState, useEffect } from "react";
import { TrackerData } from "../types";

interface HeaderProps {
  settings: TrackerData["settings"];
  onSettingsChange: (settings: Partial<TrackerData["settings"]>) => void;
  onSettingsToggle: (isOpen: boolean) => void;
  onResetQuests: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onSettingsChange,
  onSettingsToggle,
  onResetQuests,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateChecking, setUpdateChecking] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  useEffect(() => {
    onSettingsToggle(showSettings);
  }, [showSettings, onSettingsToggle]);

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

  const handleHotkeyChange = async (newHotkey: string) => {
    if (isElectron) {
      try {
        await window.electronAPI.updateHotkey(newHotkey);
        onSettingsChange({ hotkey: newHotkey });
      } catch (error) {
        console.error("Failed to update hotkey:", error);
      }
    } else {
      onSettingsChange({ hotkey: newHotkey });
    }
  };

  const handleSupportClick = () => {
    if (isElectron) {
      window.electronAPI.openExternal("https://ko-fi.com/ohitsjudd");
    } else {
      window.open("https://ko-fi.com/ohitsjudd", "_blank");
    }
  };

  const handleResetQuests = () => {
    onResetQuests();
    setShowResetConfirm(false);
  };

  const availableHotkeys = [
    "F9",
    "F8",
    "F7",
    "F6",
    "F5",
    "F4",
    "F3",
    "F2",
    "F1",
    "F10",
    "F11",
    "F12",
    "Ctrl+Q",
    "Ctrl+W",
    "Ctrl+E",
    "Ctrl+R",
    "Ctrl+T",
    "Alt+Q",
    "Alt+W",
    "Alt+E",
    "Alt+R",
    "Alt+T",
  ];

  return (
    <>
      <div className="header">
        <div className="title-bar">
          <div className="title">
            <span className="title-text">Quest Tracker</span>
            {/* Show version next to title in Electron */}
            {isElectron && appVersion && (
              <span
                className="app-version-inline"
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
                v{appVersion}
                {updateChecking && "🔄"}
              </span>
            )}
          </div>
          <div className="window-controls">
            {/* Support and Settings buttons for ALL versions */}
            <button
              className="control-btn support-btn"
              onClick={handleSupportClick}
              title="Support This Project"
            >
              ☕
            </button>
            <button
              className="control-btn settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙
            </button>
            {/* Electron-only window controls */}
            {isElectron && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel - Works for both web and desktop */}
      <div className={`settings-panel ${showSettings ? "open" : ""}`}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button
            className="settings-close-btn"
            onClick={() => setShowSettings(false)}
            title="Close Settings"
          >
            ×
          </button>
        </div>
        <div className="settings-content">
          {/* Only show help section in Electron - moved to top */}
          {isElectron && (
            <div className="overlay-help">
              <div className="help-text">
                <strong>Usage:</strong>
                <br />• Press {(settings as any).hotkey || "F9"} to show/hide
                the quest tracker
                <br />
                • Use Borderless Windowed mode in PoE2 for best experience
                <br />
                • Adjust opacity for visibility while gaming
                <br />• Click version number to check for updates
              </div>
            </div>
          )}

          <div className="settings-grid">
            {/* Theme and Hotkey side by side */}
            <div className="setting-row">
              <div className="setting-item setting-half">
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

              {/* Only show hotkey in Electron */}
              {isElectron && (
                <div className="setting-item setting-half">
                  <div className="setting-label">HOTKEY</div>
                  <div className="setting-control">
                    <select
                      value={(settings as any).hotkey || "F9"}
                      onChange={(e) => handleHotkeyChange(e.target.value)}
                      className="hotkey-selector"
                    >
                      {availableHotkeys.map((hotkey) => (
                        <option key={hotkey} value={hotkey}>
                          {hotkey}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Opacity and Font Size side by side */}
            <div className="setting-row">
              {/* Only show opacity in Electron */}
              {isElectron && (
                <div className="setting-item setting-half">
                  <div className="setting-label">OPACITY</div>
                  <div className="setting-control">
                    <input
                      type="range"
                      min="0.3"
                      max="1"
                      step="0.1"
                      value={settings.opacity}
                      onChange={(e) =>
                        onSettingsChange({
                          opacity: parseFloat(e.target.value),
                        })
                      }
                    />
                    <span className="setting-value">
                      {Math.round(settings.opacity * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <div
                className={`setting-item ${isElectron ? "setting-half" : ""}`}
              >
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

            {/* Show Optional Quests - Available in both versions */}
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

            {/* Reset Quests Section */}
            <div className="setting-item">
              <div className="setting-label">RESET PROGRESS</div>
              <div className="setting-control">
                {!showResetConfirm ? (
                  <button
                    className="reset-button"
                    onClick={() => setShowResetConfirm(true)}
                  >
                    Reset All Quests
                  </button>
                ) : (
                  <div className="reset-confirm">
                    <div className="reset-confirm-text">
                      Are you sure? This will uncheck all quests.
                    </div>
                    <div className="reset-confirm-buttons">
                      <button
                        className="reset-confirm-btn reset-yes"
                        onClick={handleResetQuests}
                      >
                        Yes, Reset
                      </button>
                      <button
                        className="reset-confirm-btn reset-no"
                        onClick={() => setShowResetConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="support-section">
            <button className="support-button" onClick={handleSupportClick}>
              Support This Project
            </button>
            <p className="support-text">
              Help keep this project alive and updated!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
