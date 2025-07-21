import React from "react";
import { useTrackerData } from "../hooks/useTrackerData";
import { ActPanel } from "./ActPanel";
import { Header } from "./Header";
import { UpdateNotification } from "./UpdateNotification";
import "./QuestTracker.css";
import "./UpdateNotification.css";

export const QuestTracker: React.FC = () => {
  const { data, loading, toggleQuest, toggleAct, updateSettings } =
    useTrackerData();

  if (loading) {
    return (
      <div className="quest-tracker loading">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="quest-tracker"
      style={{ opacity: data.settings.opacity }}
    >
      <Header settings={data.settings} onSettingsChange={updateSettings} />
      <div className="acts-container">
        {data.acts.map((act) => (
          <ActPanel
            key={act.id}
            act={act}
            onToggleQuest={(questId) => toggleQuest(act.id, questId)}
            onToggleAct={() => toggleAct(act.id)}
          />
        ))}
      </div>
      {/* Add the update notification component here */}
      <UpdateNotification />
    </div>
  );
};
