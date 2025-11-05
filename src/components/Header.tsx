import React, { useState, useEffect } from "react";
import { TrackerData } from "../types";
import { parsePathOfBuildingCodeWithNotes } from "../utils/pobParser";
import type { ElectronAPI } from "../main/preload";

interface HeaderProps {
  settings: TrackerData["settings"];
  onSettingsChange: (settings: Partial<TrackerData["settings"]>) => void;
  onSettingsToggle: (isOpen: boolean) => void;
  onResetQuests: () => void;
  onImportGems: (gemProgression: any) => void;
  onImportGemLoadouts?: (pobLoadouts: any[], defaultGemProgression: any) => void;
  onImportNotes?: (notes: string) => void;
  onImportGemsAndNotes?: (gemProgression?: any, notes?: string) => void;
  onImportCompletePoB?: (pobResult: any) => void;
  onResetGems?: () => void;
}

type SettingsTab = "appearance" | "import" | "detection" | "controls";

export const Header: React.FC<HeaderProps> = ({
  settings,
  onSettingsChange,
  onSettingsToggle,
  onResetQuests,
  onImportGems,
  onImportGemLoadouts,
  onImportNotes,
  onImportGemsAndNotes,
  onImportCompletePoB,
  onResetGems,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateChecking, setUpdateChecking] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [pobCode, setPobCode] = useState("");
  const [pobImporting, setPobImporting] = useState(false);
  const [overlayReinforcing, setOverlayReinforcing] = useState(false);
  const [availableLoadouts, setAvailableLoadouts] = useState<any[]>([]);
  const [selectedLoadout, setSelectedLoadout] = useState<number>(-1);
  const [logFileDetecting, setLogFileDetecting] = useState(false);
  const [logFileMessage, setLogFileMessage] = useState("");
  const [importButtonState, setImportButtonState] = useState<"normal" | "success" | "error">("normal");
  const [showResetGemsSuccess, setShowResetGemsSuccess] = useState(false);
  const [importSummary, setImportSummary] = useState<string>("");

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

  const handleImportPoBCode = async () => {
    if (!pobCode.trim()) {
      setImportButtonState("error");
      setTimeout(() => setImportButtonState("normal"), 2000);
      return;
    }

    setPobImporting(true);
    setImportButtonState("normal");

    try {
      const result = await parsePathOfBuildingCodeWithNotes(pobCode);
      
      if (result.hasMultipleLoadouts && result.loadouts && result.loadouts.length > 1 && onImportGemLoadouts) {
        console.log('📤 [HEADER] Multiple loadouts path - importing:', {
          loadouts: result.loadouts.length,
          hasNotes: !!result.notes,
          notesLength: result.notes?.length || 0,
          hasItems: !!result.items,
          itemsCount: result.items?.length || 0
        });

        // If we have complete POB import, use it to get all data including items
        if (onImportCompletePoB) {
          console.log('📤 [HEADER] Using complete POB import for multiple loadouts');
          onImportCompletePoB(result);
        } else {
          // Fallback to separate imports
          onImportGemLoadouts(result.loadouts, result.gemProgression);

          // Also import notes if present
          if (result.notes && onImportNotes) {
            console.log('📤 [HEADER] Also importing notes in multiple loadouts path');
            onImportNotes(result.notes);
          } else {
            console.log('⚠️ [HEADER] Not importing notes - notes:', !!result.notes, 'onImportNotes:', !!onImportNotes);
          }
        }

        // Generate import summary
        const gemCount = result.loadouts.reduce((acc: number, loadout: any) =>
          acc + (loadout.gemProgression?.socketGroups?.length || 0), 0);
        const summary = `${result.loadouts.length} loadout${result.loadouts.length > 1 ? 's' : ''}, ${gemCount} gem group${gemCount !== 1 ? 's' : ''}${result.items ? `, ${result.items.length} item${result.items.length !== 1 ? 's' : ''}` : ''}`;
        setImportSummary(summary);
        setTimeout(() => setImportSummary(""), 5000);

        setPobCode("");
        setAvailableLoadouts([]);

        setImportButtonState("success");
        setTimeout(() => setImportButtonState("normal"), 2000);
        return;
      }
      
      const gemProgression = result.gemProgression;
      const notes = result.notes;
      
      console.log('🎯 [HEADER] POB Import result received:', {
        hasNotes: !!notes,
        notesLength: notes?.length || 0,
        notesContent: notes ? notes.substring(0, 100) + '...' : 'No notes',
        hasItems: !!result.items,
        itemsCount: result.items?.length || 0,
        hasOnImportCompletePoB: !!onImportCompletePoB,
        hasOnImportGemsAndNotes: !!onImportGemsAndNotes,
        hasOnImportNotes: !!onImportNotes
      });

      // Prioritize complete POB import to include all data (gems, notes, items)
      if (onImportCompletePoB) {
        console.log('📤 [HEADER] Calling onImportCompletePoB with full result:', {
          hasGemProgression: !!result.gemProgression,
          hasNotes: !!result.notes,
          hasItems: !!result.items,
          itemsCount: result.items?.length || 0
        });
        onImportCompletePoB(result);
      } else if (onImportGemsAndNotes) {
        console.log('📤 [HEADER] Calling onImportGemsAndNotes with:', {
          hasGemProgression: !!gemProgression,
          hasNotes: !!notes,
          notesLength: notes?.length || 0
        });
        onImportGemsAndNotes(gemProgression, notes);
      } else {
        console.log('📤 [HEADER] Calling separate import functions');
        onImportGems(gemProgression);
        if (notes && onImportNotes) {
          console.log('📤 [HEADER] Calling onImportNotes');
          onImportNotes(notes);
        } else {
          console.log('⚠️ [HEADER] Not calling onImportNotes - notes:', !!notes, 'onImportNotes:', !!onImportNotes);
        }
      }

      // Generate import summary
      const gemCount = result.gemProgression?.socketGroups?.length || 0;
      const summary = `1 loadout, ${gemCount} gem group${gemCount !== 1 ? 's' : ''}${result.items ? `, ${result.items.length} item${result.items.length !== 1 ? 's' : ''}` : ''}`;
      setImportSummary(summary);
      setTimeout(() => setImportSummary(""), 5000);

      setPobCode("");
      setAvailableLoadouts([]);

      setImportButtonState("success");
      setTimeout(() => setImportButtonState("normal"), 2000);
    } catch (error) {
      console.error("Import failed:", error);
      setImportButtonState("error");
      setTimeout(() => setImportButtonState("normal"), 2000);
    } finally {
      setPobImporting(false);
    }
  };

  const handleResetQuests = () => {
    onResetQuests();
    setShowResetSuccess(true);
    setTimeout(() => setShowResetSuccess(false), 3000);
  };

  const handleResetGems = () => {
    if (onResetGems) {
      onResetGems();
      setShowResetGemsSuccess(true);
      setTimeout(() => setShowResetGemsSuccess(false), 3000);
    }
  };

  const handleImportSelectedLoadout = () => {
    if (selectedLoadout < 0 || selectedLoadout >= availableLoadouts.length) {
      return;
    }

    const loadout = availableLoadouts[selectedLoadout];
    const gemProgression = loadout.gemProgression;

    if (onImportGemsAndNotes) {
      onImportGemsAndNotes(gemProgression, undefined);
    } else {
      onImportGems(gemProgression);
    }

    setPobCode("");
    setAvailableLoadouts([]);
    setSelectedLoadout(-1);
  };

  const handleReinforceOverlay = async () => {
    if (!isElectron) return;
    
    setOverlayReinforcing(true);
    try {
      await (window.electronAPI as any).reinforceOverlay();
      console.log("Overlay settings reinforced successfully");
    } catch (error) {
      console.error("Failed to reinforce overlay:", error);
    } finally {
      setOverlayReinforcing(false);
    }
  };

  const handleDetectLogFile = async () => {
    if (!isElectron) return;
    
    setLogFileDetecting(true);
    setLogFileMessage("");
    
    try {
      const logFilePath = await window.electronAPI.detectPoeLogFile();
      
      if (logFilePath) {
        onSettingsChange({ 
          logFilePath: logFilePath,
          logFileDetected: true 
        });
        setLogFileMessage(`✓ Log file found: ${logFilePath}`);
      } else {
        onSettingsChange({ 
          logFileDetected: false 
        });
        setLogFileMessage("❌ Path of Exile 2 not running or log file not found. Start the game and try again.");
      }
      
      setTimeout(() => setLogFileMessage(""), 5000);
    } catch (error) {
      console.error("Failed to detect log file:", error);
      setLogFileMessage("❌ Failed to detect log file");
      setTimeout(() => setLogFileMessage(""), 5000);
    } finally {
      setLogFileDetecting(false);
    }
  };

  const handleSelectLogFile = async () => {
    if (!isElectron) return;
    
    setLogFileDetecting(true);
    setLogFileMessage("");
    
    try {
      const logFilePath = await (window.electronAPI as ElectronAPI).selectLogFile();
      
      if (logFilePath) {
        onSettingsChange({ 
          logFilePath: logFilePath,
          logFileDetected: true 
        });
        setLogFileMessage(`✓ Log file selected: ${logFilePath}`);
      } else {
        setLogFileMessage("❌ No file selected");
      }
      
      setTimeout(() => setLogFileMessage(""), 5000);
    } catch (error) {
      console.error("Failed to select log file:", error);
      setLogFileMessage("❌ Failed to select log file");
      setTimeout(() => setLogFileMessage(""), 5000);
    } finally {
      setLogFileDetecting(false);
    }
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
            <div className="app-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
            <span className="title-text">Exile Compass</span>
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
            {/* Support, Edit, and Settings buttons for ALL versions */}
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
            className="control-btn close-btn"
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
                <strong>Important:</strong>
                <br />
                • Use Borderless Windowed mode in PoE2 for best experience
                <br />• Click version number to check for updates
                <br />• If overlay isn't staying on top, try the fix button →
              </div>
              <button
                className="overlay-fix-btn"
                onClick={handleReinforceOverlay}
                disabled={overlayReinforcing}
                title="Reinforce overlay settings to stay on top"
              >
                {overlayReinforcing ? "Fixing..." : "Fix Overlay"}
              </button>
            </div>
          )}

          {/* Settings Tabs */}
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === "appearance" ? "active" : ""}`}
              onClick={() => setActiveTab("appearance")}
            >
              Appearance
            </button>
            <button
              className={`settings-tab ${activeTab === "import" ? "active" : ""}`}
              onClick={() => setActiveTab("import")}
            >
              Import/Export
            </button>
            {isElectron && (
              <>
                <button
                  className={`settings-tab ${activeTab === "detection" ? "active" : ""}`}
                  onClick={() => setActiveTab("detection")}
                >
                  Auto-Detection
                </button>
                <button
                  className={`settings-tab ${activeTab === "controls" ? "active" : ""}`}
                  onClick={() => setActiveTab("controls")}
                >
                  Controls
                </button>
              </>
            )}
          </div>

          <div className="settings-grid">
            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <>
            {/* Theme */}
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
                        onSettingsChange({ opacity: parseFloat(e.target.value) })
                      }
                    />
                    <span className="setting-value">
                      {Math.round(settings.opacity * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <div className={`setting-item ${isElectron ? 'setting-half' : ''}`}>
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
              </>
            )}

            {/* Import/Export Tab */}
            {activeTab === "import" && (
              <>
            {/* Reset Progress */}
            <div className="setting-item">
              <div className="setting-label">RESET PROGRESS</div>
              <div className="setting-control">
                <div className="reset-control-row">
                  <button
                    className="reset-button compact"
                    onClick={handleResetQuests}
                  >
                    Reset All
                  </button>
                  {showResetSuccess && (
                    <span className="reset-success-message">
                      ✓ Reset Successful
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Path of Building Import */}
            <div className="setting-item">
              <div className="setting-control">
                <div className="pob-import-section">
                  <textarea
                    className="pob-input"
                    placeholder="Paste your Path of Building code or pobb.in link here..."
                    value={pobCode}
                    onChange={(e) => setPobCode(e.target.value)}
                    rows={3}
                  />
                  <div className="pob-buttons">
                    <button
                      className={`pob-import-btn ${importButtonState === "success" ? "success" : ""} ${importButtonState === "error" ? "error" : ""}`}
                      onClick={handleImportPoBCode}
                      disabled={pobImporting}
                    >
                      {pobImporting ? "Importing..." :
                       importButtonState === "success" ? "✓ Success" :
                       importButtonState === "error" ? "✗ Error" : "Import PoB"}
                    </button>
                    <button
                      className="pob-reset-btn"
                      onClick={handleResetGems}
                    >
                      Reset Import
                    </button>
                  </div>

                  {/* Success messages */}
                  {showResetGemsSuccess && (
                    <div className="pob-success-message">
                      ✓ Import Data Reset (Gems, Notes, Items)
                    </div>
                  )}
                  {importSummary && (
                    <div className="pob-import-summary">
                      ✓ Imported: {importSummary}
                    </div>
                  )}
                  
                  {/* Loadout Selection - shown when multiple loadouts are detected */}
                  {availableLoadouts.length > 0 && (
                    <div className="loadout-selection">
                      <div className="loadout-label">Select Loadout:</div>
                      <div className="loadout-controls">
                        <select
                          className="loadout-selector"
                          value={selectedLoadout}
                          onChange={(e) => setSelectedLoadout(parseInt(e.target.value))}
                        >
                          <option value={-1}>-- Choose a loadout --</option>
                          {availableLoadouts.map((loadout, index) => (
                            <option key={index} value={index}>
                              {loadout.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="loadout-import-btn"
                          onClick={handleImportSelectedLoadout}
                          disabled={selectedLoadout < 0}
                        >
                          Import Selected
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
              </>
            )}

            {/* Auto-Detection Tab */}
            {isElectron && activeTab === "detection" && (
              <>
            {/* Log File Detection */}
              <div className="setting-item">
                <div className="setting-label">LOG FILE DETECTION</div>
                <div className="setting-control">
                  <div className="log-detection-section">
                    <div className="log-status-row">
                      <div className="log-status">
                        {settings.logFileDetected ? (
                          <span className="log-status-detected">
                            ✓ Log file detected
                          </span>
                        ) : (
                          <span className="log-status-not-detected">
                            ❌ Log file not detected yet
                          </span>
                        )}
                      </div>
                      <div className="log-buttons">
                        <button
                          className="log-detect-btn"
                          onClick={handleDetectLogFile}
                          disabled={logFileDetecting}
                          title="Auto-detect Path of Exile 2 log file location"
                        >
                          {logFileDetecting ? "Detecting..." : "Auto Detect"}
                        </button>
                        <button
                          className="log-select-btn"
                          onClick={handleSelectLogFile}
                          disabled={logFileDetecting}
                          title="Manually select Path of Exile 2 log file (Client.txt)"
                        >
                          Browse...
                        </button>
                      </div>
                    </div>
                    {settings.logFilePath && (
                      <div className="log-path">
                        <strong>Path:</strong> {settings.logFilePath}
                      </div>
                    )}
                    {logFileMessage && (
                      <div className={`log-message ${logFileMessage.includes('✓') ? 'success' : 'error'}`}>
                        {logFileMessage}
                      </div>
                    )}
                    <div className="log-help-text">
                      Start Path of Exile 2 and click "Auto Detect" to find the Client.txt log file automatically, or use "Browse..." to select it manually.
                    </div>
                  </div>
                </div>
              </div>

            {/* Auto-Complete Quests via Rewards */}
            {settings.logFilePath && (
              <div className="setting-item">
                <div className="setting-control">
                  <label className="setting-checkbox">
                    <input
                      type="checkbox"
                      checked={settings.autoCompleteQuests || false}
                      onChange={(e) => onSettingsChange({ autoCompleteQuests: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85em' }}>AUTO-DETECT REWARDS</span>
                  </label>
                  <div className="beta-warning">
                    <span className="warning-icon">ℹ️</span>
                    <span className="warning-text">
                      Monitors Client.txt for quest rewards (Spirit, Resistance, Life, Passive Points, etc.) and automatically marks matching quests as complete when you enter new zones.
                    </span>
                  </div>
                </div>
              </div>
            )}
              </>
            )}

            {/* Controls Tab */}
            {isElectron && activeTab === "controls" && (
              <>
            {/* Hotkey */}
            <div className="setting-item">
              <div className="setting-label">SHOW/HIDE HOTKEY</div>
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
              </>
            )}
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