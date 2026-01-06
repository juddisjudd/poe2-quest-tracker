import React, { useState, useEffect } from "react";
import { TrackerData, QuestTag } from "../types";
import { parsePathOfBuildingCodeWithNotes } from "../utils/pobParser";
import { FilterChips } from "./FilterChips";
import type { ElectronAPI } from "../main/preload";
import { FaDiscord } from "react-icons/fa";
import { SiKofi } from "react-icons/si";
import { useI18n } from "../utils/i18n";
import { QUEST_TAG_KEYS } from "../utils/tagLabels";

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
  onResetTimers?: () => void;
  onResetAllData?: () => Promise<void>;
  activeFilters?: QuestTag[];
  onFilterToggle?: (tag: QuestTag) => void;
  questCounts?: Record<QuestTag, number>;
}

type SettingsTab = "appearance" | "import" | "detection" | "filters";

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
  onResetTimers,
  onResetAllData,
  activeFilters = [],
  onFilterToggle,
  questCounts = {} as Record<QuestTag, number>,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateChecking, setUpdateChecking] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [pobCode, setPobCode] = useState("");
  const [pobImporting, setPobImporting] = useState(false);
  const [availableLoadouts, setAvailableLoadouts] = useState<any[]>([]);
  const [selectedLoadout, setSelectedLoadout] = useState<number>(-1);
  const [logFileDetecting, setLogFileDetecting] = useState(false);
  const [logFileMessage, setLogFileMessage] = useState("");
  const [logMessageType, setLogMessageType] = useState<"success" | "error" | "">("");
  const [importButtonState, setImportButtonState] = useState<"normal" | "success" | "error">("normal");
  const [importSummary, setImportSummary] = useState<string>("");
  const { t, language } = useI18n();

  const isElectron = !!window.electronAPI;
  const listSeparator = t("common.listSeparator");

  const getTagLabel = (tag: QuestTag) => t(QUEST_TAG_KEYS[tag]);

  const formatCount = (key: string, count: number) =>
    t(key, { count, plural: count === 1 ? "" : "s" });

  const formatImportSummary = (options: {
    loadouts?: number;
    gemGroups?: number;
    items?: number;
    hasTree?: boolean;
  }) => {
    const parts: string[] = [];
    if (typeof options.loadouts === "number") {
      parts.push(formatCount("settings.pob.summary.loadout", options.loadouts));
    }
    if (typeof options.gemGroups === "number") {
      parts.push(formatCount("settings.pob.summary.gemGroup", options.gemGroups));
    }
    if (typeof options.items === "number" && options.items > 0) {
      parts.push(formatCount("settings.pob.summary.item", options.items));
    }
    if (options.hasTree) {
      parts.push(t("settings.pob.summary.tree"));
    }
    return parts.join(listSeparator);
  };

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

  const handleDiscordClick = () => {
    if (isElectron) {
      window.electronAPI.openExternal("https://discord.exilecompass.com");
    } else {
      window.open("https://discord.exilecompass.com", "_blank");
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
        // If we have complete POB import, use it to get all data including items
        if (onImportCompletePoB) {
          onImportCompletePoB(result);
        } else {
          // Fallback to separate imports
          onImportGemLoadouts(result.loadouts, result.gemProgression);

          // Also import notes if present
          if (result.notes && onImportNotes) {
            onImportNotes(result.notes);
          }
        }

        // Generate import summary
        const gemCount = result.loadouts.reduce((acc: number, loadout: any) =>
          acc + (loadout.gemProgression?.socketGroups?.length || 0), 0);
        const summary = formatImportSummary({
          loadouts: result.loadouts.length,
          gemGroups: gemCount,
          items: result.items?.length,
          hasTree: !!result.passiveTree
        });
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

      // Prioritize complete POB import to include all data (gems, notes, items)
      if (onImportCompletePoB) {
        onImportCompletePoB(result);
      } else if (onImportGemsAndNotes) {
        onImportGemsAndNotes(gemProgression, notes);
      } else {
        onImportGems(gemProgression);
        if (notes && onImportNotes) {
          onImportNotes(notes);
        }
      }

      // Generate import summary
      const gemCount = result.gemProgression?.socketGroups?.length || 0;
      const hasTree = !!result.passiveTree;
      const summary = formatImportSummary({
        gemGroups: gemCount,
        items: result.items?.length,
        hasTree
      });
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

  const handleMasterReset = async () => {
    // Use the atomic reset function if available
    if (onResetAllData) {
      await onResetAllData();
    } else {
      // Fallback to individual resets (kept for backwards compatibility)
      onResetQuests();
      if (onResetGems) {
        onResetGems();
      }
    }
    
    setShowResetSuccess(true);
    setTimeout(() => setShowResetSuccess(false), 3000);
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

  const handleDetectLogFile = async () => {
    if (!isElectron) return;
    
    setLogFileDetecting(true);
    setLogFileMessage("");
    setLogMessageType("");
    
    try {
      const logFilePath = await window.electronAPI.detectPoeLogFile();
      
      if (logFilePath) {
        onSettingsChange({ 
          logFilePath: logFilePath,
          logFileDetected: true 
        });
        setLogFileMessage(t("settings.log.message.found", { path: logFilePath }));
        setLogMessageType("success");
      } else {
        onSettingsChange({ 
          logFileDetected: false 
        });
        setLogFileMessage(t("settings.log.message.notFound"));
        setLogMessageType("error");
      }
      
      setTimeout(() => setLogFileMessage(""), 5000);
    } catch (error) {
      console.error("Failed to detect log file:", error);
      setLogFileMessage(t("settings.log.message.detectFail"));
      setLogMessageType("error");
      setTimeout(() => setLogFileMessage(""), 5000);
    } finally {
      setLogFileDetecting(false);
    }
  };

  const handleSelectLogFile = async () => {
    if (!isElectron) return;
    
    setLogFileDetecting(true);
    setLogFileMessage("");
    setLogMessageType("");
    
    try {
      const logFilePath = await (window.electronAPI as ElectronAPI).selectLogFile();
      
      if (logFilePath) {
        onSettingsChange({ 
          logFilePath: logFilePath,
          logFileDetected: true 
        });
        setLogFileMessage(t("settings.log.message.selected", { path: logFilePath }));
        setLogMessageType("success");
      } else {
        setLogFileMessage(t("settings.log.message.none"));
        setLogMessageType("error");
      }
      
      setTimeout(() => setLogFileMessage(""), 5000);
    } catch (error) {
      console.error("Failed to select log file:", error);
      setLogFileMessage(t("settings.log.message.detectFail"));
      setLogMessageType("error");
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
            <span className="title-text">{t("app.title")}</span>
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
                    ? t("app.version.checking")
                    : t("app.version.checkHint")
                }
              >
                v{appVersion}
                {updateChecking && ` ${t("app.version.checkingShort")}`}
              </span>
            )}
          </div>
          <div className="window-controls">
            {/* Support, Edit, and Settings buttons for ALL versions */}
            <button
              className="control-btn discord-btn"
              onClick={handleDiscordClick}
              title={t("app.controls.discord")}
            >
              <FaDiscord />
            </button>
            <button
              className="control-btn support-btn"
              onClick={handleSupportClick}
              title={t("support.button")}
            >
              <SiKofi />
            </button>
            <button
              className="control-btn language-btn"
              onClick={() => onSettingsChange({ language: language === "zh" ? "en" : "zh" })}
              title={t("app.language.switch")}
            >
              {language === "zh" ? "中文" : "EN"}
            </button>
            <button
              className="control-btn settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title={t("settings.title")}
            >
              S
            </button>
            {/* Electron-only window controls */}
            {isElectron && (
              <>
                <button
                  className="control-btn minimize-btn"
                  onClick={handleMinimize}
                  title={t("app.controls.minimize")}
                >
                  _
                </button>
                <button
                  className="control-btn close-btn"
                  onClick={handleClose}
                  title={t("app.controls.close")}
                >
                  X
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel - Works for both web and desktop */}
      <div className={`settings-panel ${showSettings ? "open" : ""}`}>
        <div className="settings-header">
          <h3>{t("settings.title")}</h3>
          <button
            className="control-btn close-btn"
            onClick={() => setShowSettings(false)}
            title={t("settings.close")}
          >
            X
          </button>
        </div>
        <div className="settings-content">
          {/* Only show help section in Electron - moved to top */}
          {/* Settings Tabs */}
          <div className="settings-tabs">
            <button
              className={`settings-tab ${activeTab === "appearance" ? "active" : ""}`}
              onClick={() => setActiveTab("appearance")}
            >
              {t("settings.tabs.appearance")}
            </button>
            <button
              className={`settings-tab ${activeTab === "import" ? "active" : ""}`}
              onClick={() => setActiveTab("import")}
            >
              {t("settings.tabs.import")}
            </button>
            {isElectron && (
              <button
                className={`settings-tab ${activeTab === "detection" ? "active" : ""}`}
                onClick={() => setActiveTab("detection")}
              >
                {t("settings.tabs.detection")}
              </button>
            )}
            <button
              className={`settings-tab ${activeTab === "filters" ? "active" : ""}`}
              onClick={() => setActiveTab("filters")}
            >
              {t("settings.tabs.filters")}
            </button>
          </div>

          <div className="settings-grid">
            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <>
                {/* Opacity and Font Size side by side */}
                <div className="setting-row">
                  {/* Only show opacity in Electron */}
                  {isElectron && (
                    <div className="setting-item setting-half">
                      <div className="setting-label">{t("settings.opacity")}</div>
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

                  <div className={`setting-item ${isElectron ? "setting-half" : ""}`}>
                    <div className="setting-label">{t("settings.fontSize")}</div>
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

                {/* Hotkey - only in Electron */}
                {isElectron && (
                  <div className="setting-item">
                    <div className="setting-label">{t("settings.hotkey")}</div>
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
              </>
            )}

            {/* Import/Export Tab */}
            {activeTab === "import" && (
              <>
                {/* Path of Building Import */}
                <div className="setting-item">
                  <div className="setting-control">
                    <div className="pob-import-section">
                      <textarea
                        className="pob-input"
                        placeholder={t("settings.pob.placeholder")}
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
                          {pobImporting
                            ? t("settings.pob.importing")
                            : importButtonState === "success"
                              ? t("settings.pob.success")
                              : importButtonState === "error"
                                ? t("settings.pob.error")
                                : t("settings.pob.import")}
                        </button>
                      </div>

                      {/* Success messages */}
                      {importSummary && (
                        <div className="pob-import-summary">
                          {t("settings.pob.imported", { summary: importSummary })}
                        </div>
                      )}

                      {/* Loadout Selection - shown when multiple loadouts are detected */}
                      {availableLoadouts.length > 0 && (
                        <div className="loadout-selection">
                          <div className="loadout-label">{t("settings.pob.loadout.select")}</div>
                          <div className="loadout-controls">
                            <select
                              className="loadout-selector"
                              value={selectedLoadout}
                              onChange={(e) => setSelectedLoadout(parseInt(e.target.value))}
                            >
                              <option value={-1}>{t("settings.pob.loadout.choose")}</option>
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
                              {t("settings.pob.loadout.import")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Master Reset */}
                <div className="setting-item">
                  <div className="setting-label">{t("settings.reset.title")}</div>
                  <div className="setting-control">
                    <div className="reset-control-row">
                      <button
                        className="reset-button compact"
                        onClick={handleMasterReset}
                      >
                        {t("settings.reset.button")}
                      </button>
                      {showResetSuccess && (
                        <span className="reset-success-message">
                          {t("settings.reset.success")}
                        </span>
                      )}
                    </div>
                    <div className="log-help-text">
                      {t("settings.reset.help")}
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
                  <div className="setting-label">{t("settings.log.title")}</div>
                  <div className="setting-control">
                    <div className="log-detection-section">
                      <div className="log-status-row">
                        <div className="log-status">
                          {settings.logFileDetected ? (
                            <span className="log-status-detected">
                              {t("settings.log.detected")}
                            </span>
                          ) : (
                            <span className="log-status-not-detected">
                              {t("settings.log.notDetected")}
                            </span>
                          )}
                        </div>
                        <div className="log-buttons">
                          <button
                            className="log-detect-btn"
                            onClick={handleDetectLogFile}
                            disabled={logFileDetecting}
                            title={t("settings.log.autoDetectTitle")}
                          >
                            {logFileDetecting
                              ? t("settings.log.detecting")
                              : t("settings.log.autoDetect")}
                          </button>
                          <button
                            className="log-select-btn"
                            onClick={handleSelectLogFile}
                            disabled={logFileDetecting}
                            title={t("settings.log.browseTitle")}
                          >
                            {t("settings.log.browse")}
                          </button>
                        </div>
                      </div>
                      {settings.logFilePath && (
                        <div className="log-path">
                          <strong>{t("settings.log.path")}</strong> {settings.logFilePath}
                        </div>
                      )}
                      {logFileMessage && (
                        <div className={`log-message ${logMessageType === "success" ? "success" : "error"}`}>
                          {logFileMessage}
                        </div>
                      )}
                      <div className="log-help-text">
                        {t("settings.log.help")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-Complete Options */}
                {settings.logFilePath && (
                  <>
                    <div className="setting-item">
                      <div className="setting-control">
                        <label className="setting-checkbox">
                          <input
                            type="checkbox"
                            checked={settings.autoCompleteQuests || false}
                            onChange={(e) => onSettingsChange({ autoCompleteQuests: e.target.checked })}
                          />
                          <span style={{ fontSize: "0.85em" }}>{t("settings.autoComplete.rewards")}</span>
                        </label>
                        <div className="log-help-text" style={{ marginTop: "4px", marginLeft: "22px", fontSize: "0.75em" }}>
                          {t("settings.autoComplete.rewardsHelp")}
                        </div>
                      </div>
                    </div>

                    <div className="setting-item">
                      <div className="setting-control">
                        <label className="setting-checkbox">
                          <input
                            type="checkbox"
                            checked={settings.autoCompleteOnZoneEntry || false}
                            onChange={(e) => onSettingsChange({ autoCompleteOnZoneEntry: e.target.checked })}
                          />
                          <span style={{ fontSize: "0.85em" }}>{t("settings.autoComplete.zone")}</span>
                        </label>
                        <div className="log-help-text" style={{ marginTop: "4px", marginLeft: "22px", fontSize: "0.75em" }}>
                          {t("settings.autoComplete.zoneHelp")}
                        </div>
                      </div>
                    </div>

                    {/* Shared best-effort disclaimer */}
                    <div className="beta-warning" style={{ marginTop: "8px" }}>
                      <span className="warning-icon">!</span>
                      <span className="warning-text">
                        {t("settings.autoComplete.disclaimer")}
                      </span>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Filters & Timers Tab */}
            {activeTab === "filters" && (
              <>
                {/* Quest Filters */}
                <div className="setting-item">
                  <div className="setting-label">{t("settings.filters.title")}</div>
                  <div className="setting-control" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0" }}>
                    {onFilterToggle && (
                      <FilterChips
                        activeFilters={activeFilters}
                        onFilterToggle={onFilterToggle}
                        questCounts={questCounts}
                      />
                    )}
                    <div className="log-help-text" style={{ marginTop: "12px" }}>
                      {activeFilters.length > 0
                        ? t("settings.filters.helpActive", { tags: activeFilters.map(getTagLabel).join(listSeparator) })
                        : t("settings.filters.helpDefault")}
                    </div>
                  </div>
                </div>

                {/* Timer Settings */}
                <div className="setting-item">
                  <div className="setting-label">{t("settings.timers.title")}</div>
                  <div className="setting-control" style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
                    <div style={{ width: "100%" }}>
                      <label className="setting-checkbox" style={{ justifyContent: "flex-start" }}>
                        <input
                          type="checkbox"
                          checked={settings.autoActTimers !== false}
                          onChange={(e) => onSettingsChange({ autoActTimers: e.target.checked })}
                        />
                        <span>{t("settings.timers.actAuto")}</span>
                      </label>
                      <div className="log-help-text" style={{ marginTop: "4px" }}>
                        {t("settings.timers.actAutoHelp")}
                      </div>
                    </div>
                    <div style={{ width: "100%" }}>
                      <label className="setting-checkbox" style={{ justifyContent: "flex-start" }}>
                        <input
                          type="checkbox"
                          checked={settings.autoGlobalTimer !== false}
                          onChange={(e) => onSettingsChange({ autoGlobalTimer: e.target.checked })}
                        />
                        <span>{t("settings.timers.globalAuto")}</span>
                      </label>
                      <div className="log-help-text" style={{ marginTop: "4px" }}>
                        {t("settings.timers.globalAutoHelp")}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="support-section">
            <button className="support-button" onClick={handleSupportClick}>
              <SiKofi style={{ marginRight: '8px' }} />
              {t("support.button")}
            </button>
            <p className="support-text">
              {t("support.text")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

