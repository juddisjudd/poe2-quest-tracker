import React, { useState } from "react";
import { useTrackerData } from "../hooks/useTrackerData";
import { ActPanel } from "./ActPanel";
import { Header } from "./Header";
import { UpdateNotification } from "./UpdateNotification";
import { GemProgressionPanel } from "./GemProgressionPanel";
import { RegexPanel } from "./RegexPanel";
import { NotesPanel } from "./NotesPanel";
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
    importGemLoadouts,
    switchLoadout,
    toggleGem,
    updateRegexFilters,
    updateNotesData,
    importGemsAndNotes
  } = useTrackerData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gemPanelVisible, setGemPanelVisible] = useState(false);
  const [regexPanelVisible, setRegexPanelVisible] = useState(false);
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);

  const isElectron = !!window.electronAPI;

  // Sync panel visibility with settings
  React.useEffect(() => {
    setGemPanelVisible(data.settings.showGemPanel !== false);
    setRegexPanelVisible(data.settings.showRegexPanel !== false);
    setNotesPanelVisible(data.settings.showNotesPanel !== false);
  }, [data.settings.showGemPanel, data.settings.showRegexPanel, data.settings.showNotesPanel]);

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
      } ${gemPanelVisible ? "gem-panel-open" : ""} ${
        regexPanelVisible ? "regex-panel-open" : ""
      } ${notesPanelVisible ? "notes-panel-open" : ""}`}
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
        onImportGemLoadouts={importGemLoadouts}
        onImportNotes={(notes) => {
          updateNotesData({
            userNotes: data.notesData?.userNotes || "",
            pobNotes: notes
          });
        }}
        onImportGemsAndNotes={importGemsAndNotes}
        onResetGems={() => {
          importGemProgression({
            socketGroups: [],
          });
        }}
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
          gemLoadouts={data.gemLoadouts}
          isVisible={gemPanelVisible}
          settingsOpen={settingsOpen}
          onToggleGem={toggleGem}
          onSwitchLoadout={switchLoadout}
          onTogglePanel={() => {
            const newVisibility = !gemPanelVisible;
            setGemPanelVisible(newVisibility);
            updateSettings({ showGemPanel: newVisibility });
          }}
        />
      )}
      
      {/* Debug: log tracker data */}
      {(() => {
        console.log('QuestTracker data debug:', {
          hasGemProgression: !!data.gemProgression,
          hasGemLoadouts: !!data.gemLoadouts,
          loadoutCount: data.gemLoadouts?.loadouts?.length || 0
        });
        return null;
      })()}

      {/* Regex Panel */}
      {data.regexFilters && (
        <RegexPanel
          regexFilters={data.regexFilters}
          isVisible={regexPanelVisible}
          settingsOpen={settingsOpen}
          onUpdateFilters={updateRegexFilters}
          onTogglePanel={() => {
            const newVisibility = !regexPanelVisible;
            setRegexPanelVisible(newVisibility);
            updateSettings({ showRegexPanel: newVisibility });
          }}
        />
      )}

      {/* Notes Panel */}
      {data.notesData && (
        <NotesPanel
          notesData={data.notesData}
          isVisible={notesPanelVisible}
          settingsOpen={settingsOpen}
          onUpdateNotes={updateNotesData}
          onTogglePanel={() => {
            const newVisibility = !notesPanelVisible;
            setNotesPanelVisible(newVisibility);
            updateSettings({ showNotesPanel: newVisibility });
          }}
        />
      )}
      
      {isElectron && <UpdateNotification />}
    </div>
  );
};