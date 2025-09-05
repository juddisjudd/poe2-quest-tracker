import React, { useState, useCallback } from "react";
import { useTrackerData } from "../hooks/useTrackerData";
import { useAutoComplete } from "../hooks/useAutoComplete";
import { ActPanel } from "./ActPanel";
import { Header } from "./Header";
import { UpdateNotification } from "./UpdateNotification";
import { GemProgressionPanel } from "./GemProgressionPanel";
import { RegexPanel } from "./RegexPanel";
import { NotesPanel } from "./NotesPanel";
import { ItemCheckPanel } from "./ItemCheckPanel";
import { SimpleGuideSelector } from "./SimpleGuideSelector";
import { PanelFooter } from "./PanelFooter";
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
    updateItemCheckData,
    importGemsAndNotes,
    importCompletePoB,
    // Campaign Guide functions
    selectCampaignGuide,
  } = useTrackerData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gemPanelVisible, setGemPanelVisible] = useState(false);
  const [regexPanelVisible, setRegexPanelVisible] = useState(false);
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);
  const [itemCheckPanelVisible, setItemCheckPanelVisible] = useState(false);

  const isElectron = !!window.electronAPI;

  // Auto-completion handler for quest rewards
  const handleQuestAutoComplete = useCallback((questId: string) => {
    // Find the act that contains this quest
    const actWithQuest = data.acts.find(act => 
      act.quests.some(quest => quest.id === questId)
    );
    
    if (actWithQuest) {
      toggleQuest(actWithQuest.id, questId);
    }
  }, [data.acts, toggleQuest]);

  // Use auto-completion hook
  useAutoComplete({
    trackerData: data,
    onQuestComplete: handleQuestAutoComplete,
    isElectron
  });

  // Sync panel visibility with settings
  React.useEffect(() => {
    setGemPanelVisible(data.settings.showGemPanel !== false);
    setRegexPanelVisible(data.settings.showRegexPanel !== false);
    setNotesPanelVisible(data.settings.showNotesPanel !== false);
    setItemCheckPanelVisible(data.settings.showItemCheckPanel !== false);
  }, [data.settings.showGemPanel, data.settings.showRegexPanel, data.settings.showNotesPanel, data.settings.showItemCheckPanel]);

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
      } ${notesPanelVisible ? "notes-panel-open" : ""} ${
        itemCheckPanelVisible ? "item-check-panel-open" : ""
      }`}
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
        onImportNotes={async (notes) => {
          console.log('🎯 [QUESTTRACKER] onImportNotes called with:', {
            hasNotes: !!notes,
            notesLength: notes?.length || 0,
            notesPreview: notes ? notes.substring(0, 100) + '...' : 'No notes'
          });
          
          await updateNotesData({
            userNotes: data.notesData?.userNotes || "",
            pobNotes: notes
          });
        }}
        onImportGemsAndNotes={importGemsAndNotes}
        onImportCompletePoB={importCompletePoB}
        onResetGems={() => {
          importGemProgression({
            socketGroups: [],
          });
        }}
      />
      
      {/* Simple Guide Selector */}
      <SimpleGuideSelector
        campaignGuides={data.campaignGuides || []}
        activeGuideId={data.activeCampaignGuideId || ""}
        onSelectGuide={selectCampaignGuide}
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
      {data.gemProgression && (() => {
        console.log('🎯 [QUESTTRACKER] Rendering GemProgressionPanel with:', {
          hasGemProgression: !!data.gemProgression,
          socketGroups: data.gemProgression?.socketGroups?.length || 0,
          isVisible: gemPanelVisible,
          firstGroupName: data.gemProgression?.socketGroups?.[0]?.skillName || 'none'
        });
        return (
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
          showToggleButton={false}
        />
        );
      })()}
      
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
          showToggleButton={false}
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
          showToggleButton={false}
        />
      )}

      {/* Item Check Panel */}
      <ItemCheckPanel
        itemCheckData={data.itemCheckData}
        isVisible={itemCheckPanelVisible}
        settingsOpen={settingsOpen}
        onUpdateItemData={updateItemCheckData}
        onTogglePanel={() => {
          const newVisibility = !itemCheckPanelVisible;
          setItemCheckPanelVisible(newVisibility);
          updateSettings({ showItemCheckPanel: newVisibility });
        }}
        showToggleButton={true}
      />
      
      {/* Panel Footer with toggle buttons */}
      <PanelFooter
        gemPanelVisible={gemPanelVisible}
        onToggleGemPanel={() => {
          const newVisibility = !gemPanelVisible;
          setGemPanelVisible(newVisibility);
          updateSettings({ showGemPanel: newVisibility });
        }}
        hasGemData={true}
        regexPanelVisible={regexPanelVisible}
        onToggleRegexPanel={() => {
          const newVisibility = !regexPanelVisible;
          setRegexPanelVisible(newVisibility);
          updateSettings({ showRegexPanel: newVisibility });
        }}
        hasRegexData={!!data.regexFilters}
        notesPanelVisible={notesPanelVisible}
        onToggleNotesPanel={() => {
          const newVisibility = !notesPanelVisible;
          setNotesPanelVisible(newVisibility);
          updateSettings({ showNotesPanel: newVisibility });
        }}
        hasNotesData={!!data.notesData}
        itemCheckPanelVisible={itemCheckPanelVisible}
        onToggleItemCheckPanel={() => {
          const newVisibility = !itemCheckPanelVisible;
          setItemCheckPanelVisible(newVisibility);
          updateSettings({ showItemCheckPanel: newVisibility });
        }}
        hasItemCheckData={true}
        settingsOpen={settingsOpen}
      />
      
      {isElectron && <UpdateNotification />}
    </div>
  );
};