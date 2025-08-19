import React, { useState } from "react";
import { useTrackerData } from "../hooks/useTrackerData";
import { ActPanel } from "./ActPanel";
import { Header } from "./Header";
import { UpdateNotification } from "./UpdateNotification";
import "./QuestTracker.css";
import "./UpdateNotification.css";
import "./WebStyles.css";
import "../themes/amoled-crimson.css";
import "../themes/amoled-yellow.css";

export const QuestTracker: React.FC = () => {
  const { data, loading, toggleQuest, toggleAct, updateSettings } =
    useTrackerData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isElectron = !!window.electronAPI;

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
      }`}
      style={{ opacity: isElectron ? data.settings.opacity : 1 }}
      data-font-scale={data.settings.fontSize || 1.0}
      data-theme={(data.settings as any).theme || "amoled"}
    >
      <Header
        settings={data.settings}
        onSettingsChange={updateSettings}
        onSettingsToggle={setSettingsOpen}
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
      {isElectron && <UpdateNotification />}
    </div>
  );
};
