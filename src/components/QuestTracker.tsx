import React, { useState } from "react";
import { useTrackerData } from "../hooks/useTrackerData";
import { ActPanel } from "./ActPanel";
import { Header } from "./Header";
import { UpdateNotification } from "./UpdateNotification";
import { GemProgressionPanel } from "./GemProgressionPanel";
import "./QuestTracker.css";
import "./UpdateNotification.css";
import "./WebStyles.css";
import "../themes/amoled-crimson.css";
import "../themes/amoled-yellow.css";

export const QuestTracker: React.FC = () => {
  const { 
    data, 
    loading, 
    toggleQuest, 
    toggleAct, 
    updateSettings, 
    resetAllQuests,
    importGemProgression,
    toggleGem
  } = useTrackerData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gemPanelVisible, setGemPanelVisible] = useState(false);

  const isElectron = !!window.electronAPI;

  // Sync gem panel visibility with settings
  React.useEffect(() => {
    setGemPanelVisible(data.settings.showGemPanel !== false);
  }, [data.settings.showGemPanel]);

  if (loading) {
    return (
      <div className={`quest-tracker loading ${!isElectron ? "web-mode" : ""}`}>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`quest-tracker ${!isElectron ? "web-mode" : ""} ${
        settingsOpen ? "settings-open" : ""
      } ${gemPanelVisible ? "gem-panel-open" : ""}`}
      style={{ opacity: isElectron ? data.settings.opacity : 1 }}
      data-font-scale={data.settings.fontSize || 1.0}
      data-theme={(data.settings as any).theme || "amoled"}
    >
      <Header
        settings={data.settings}
        onSettingsChange={updateSettings}
        onSettingsToggle={setSettingsOpen}
        onResetQuests={resetAllQuests}
        onImportGems={importGemProgression}
      />
      <div className="acts-container">
        {data.acts.map((act) => (
          <ActPanel
            key={act.id}
            act={act}
            showOptional={data.settings.showOptional !== false}
            onToggleQuest={(questId) => toggleQuest(act.id, questId)}
            onToggleAct={() => toggleAct(act.id)}
          />
        ))}
      </div>
      
      {/* Gem Progression Panel */}
      {data.gemProgression && (
        <GemProgressionPanel
          gemProgression={data.gemProgression}
          isVisible={gemPanelVisible}
          settingsOpen={settingsOpen}
          onToggleGem={toggleGem}
          onTogglePanel={() => {
            const newVisibility = !gemPanelVisible;
            setGemPanelVisible(newVisibility);
            updateSettings({ showGemPanel: newVisibility });
          }}
        />
      )}
      
      {isElectron && <UpdateNotification />}
    </div>
  );
};