import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTrackerData } from "../hooks/useTrackerData";
import { useAutoComplete } from "../hooks/useAutoComplete";
import { ActPanel } from "./ActPanel";
import { Header } from "./Header";
import { UpdateNotification } from "./UpdateNotification";
import { GemProgressionPanel } from "./GemProgressionPanel";
import { NotesPanel } from "./NotesPanel";
import { FilterChips } from "./FilterChips";
import { PanelFooter } from "./PanelFooter";
import { PermanentRewardsPanel } from "./PermanentRewardsPanel";
import { GlobalTimer } from "./GlobalTimer";
import { RegexBuilderPanel } from "./RegexBuilderPanel";
import { ItemCheckPanel } from "./ItemCheckPanel";
import { QuestTag, ActTimer as ActTimerType, GlobalTimer as GlobalTimerType } from "../types";
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
    updateNotesData,
    importGemsAndNotes,
    importCompletePoB,
    updateActTimer,
    updateCurrentAct,
    resetTimers,
    updateGlobalTimer,
    clearPassiveTreeData,
    resetAllData,
  } = useTrackerData();

  console.log('QuestTracker render:', { loading, actsCount: data.acts.length, firstAct: data.acts[0] });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [treePanelVisible, setTreePanelVisible] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Derive panel visibility directly from settings (no duplicate state)
  const gemPanelVisible = data.settings.showGemPanel !== false;
  const notesPanelVisible = data.settings.showNotesPanel !== false;
  const rewardsPanelVisible = data.settings.showRewardsPanel === true;
  const regexBuilderVisible = data.settings.showRegexBuilderPanel === true;
  const itemCheckVisible = data.settings.showItemCheckPanel === true;

  const isElectron = !!window.electronAPI;

  // Auto-completion handler for quest rewards
  const handleQuestAutoComplete = useCallback((questId: string) => {
    // Find the act that contains this quest
    const actWithQuest = data.acts.find(act => 
      act.steps.some(quest => quest.id === questId)
    );
    
    if (actWithQuest) {
      toggleQuest(questId);
    }
  }, [data.acts, toggleQuest]);

  // Use auto-completion hook
  useAutoComplete({
    trackerData: data,
    onQuestComplete: handleQuestAutoComplete,
    isElectron
  });

  // Listen for tree window closed event from main process
  useEffect(() => {
    if (!isElectron || !window.electronAPI?.onTreeWindowClosed) return;

    const unsubscribe = window.electronAPI.onTreeWindowClosed(() => {
      console.log('🌳 Tree window closed externally');
      setTreePanelVisible(false);
      updateSettings({ showTreePanel: false });
    });

    return () => {
      unsubscribe?.();
    };
  }, [isElectron, updateSettings]);

  // Listen for act changes from log file
  useEffect(() => {
    const handleActChange = (event: any) => {
      const actNumber = event.detail?.actNumber;
      if (actNumber && typeof actNumber === 'number') {
        console.log(`Act changed to Act ${actNumber}`);
        updateCurrentAct(actNumber);
      }
    };

    window.addEventListener('act-change', handleActChange);
    return () => {
      window.removeEventListener('act-change', handleActChange);
    };
  }, [updateCurrentAct]);

  // Filter handling
  const activeFilters = data.settings.activeFilters || [];

  const handleFilterToggle = useCallback((tag: QuestTag) => {
    const newFilters = activeFilters.includes(tag)
      ? activeFilters.filter(t => t !== tag)
      : [...activeFilters, tag];

    updateSettings({ activeFilters: newFilters });
  }, [activeFilters, updateSettings]);

  // Calculate quest counts for each tag
  const questCounts = useMemo(() => {
    const counts: Record<QuestTag, number> = {
      "Spirit": 0,
      "Resistance": 0,
      "Life": 0,
      "Mana": 0,
      "Gem": 0,
      "Passive Skill": 0,
      "Boss": 0,
      "Trial": 0,
      "Waypoint": 0,
      "Ritual": 0,
      "Breach": 0,
      "Expedition": 0,
      "Delirium": 0,
      "Essence": 0,
      "Optional": 0,
    };

    data.acts.forEach(act => {
      act.steps.forEach(quest => {
        if (quest.tags) {
          quest.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
          });
        }
      });
    });

    return counts;
  }, [data.acts]);

  // Filter acts based on active filters (show-only mode)
  const filteredActs = useMemo(() => {
    // No filters selected = show all quests
    if (activeFilters.length === 0) {
      return data.acts;
    }

    // Show only quests that have ANY of the selected filter tags
    return data.acts.map(act => ({
      ...act,
      steps: act.steps.filter(quest => {
        if (!quest.tags || quest.tags.length === 0) {
          return false; // Hide quests without tags when filtering
        }
        // Show quest if it has ANY of the selected filter tags
        return quest.tags.some(tag => activeFilters.includes(tag));
      })
    })).filter(act => act.steps.length > 0); // Hide acts with no remaining quests
  }, [data.acts, activeFilters]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const allQuests = data.acts.flatMap(act => act.steps);
    const completedCount = allQuests.filter(q => q.completed).length;
    const totalCount = allQuests.length;
    const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return {
      completed: completedCount,
      total: totalCount,
      percentage: Math.round(percentage)
    };
  }, [data.acts]);

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
        notesPanelVisible ? "notes-panel-open" : ""
      } ${itemCheckVisible ? "item-check-panel-open" : ""}`}
      style={{ opacity: isElectron ? data.settings.opacity : 1 }}
      data-font-scale={data.settings.fontSize || 1.0}
      data-theme={(data.settings as any).theme || "amoled"}
    >
      <Header
        settings={data.settings}
        onSettingsChange={updateSettings}
        onSettingsToggle={setSettingsOpen}
        onResetQuests={resetAllQuests}
        onResetTimers={resetTimers}
        onResetAllData={async () => {
          // Close tree panel if open before reset
          setTreePanelVisible(false);
          await resetAllData();
        }}
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
        onResetGems={async () => {
          // Reset passive tree data FIRST to clear from memory
          await clearPassiveTreeData();
          // Close tree panel if open
          setTreePanelVisible(false);
          // Reset gems
          importGemProgression({
            socketGroups: [],
          });
          // Reset notes
          updateNotesData({
            userNotes: "",
            pobNotes: undefined,
          });
          // Reset items (via importCompletePoB with empty data)
          // passiveTree is explicitly undefined so it won't pick up old data
          importCompletePoB({
            gemProgression: { socketGroups: [] },
            notes: "",
            items: [],
            loadouts: [],
            hasMultipleLoadouts: false,
            passiveTree: undefined,
          });
        }}
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        questCounts={questCounts}
      />

      {/* Global Timer */}
      <GlobalTimer
        initialTimer={data.globalTimer}
        onTimerUpdate={(timer: GlobalTimerType) => updateGlobalTimer(timer)}
        currentActNumber={data.currentActNumber}
        autoStart={data.settings.autoGlobalTimer !== false}
      />

      {/* Overall Progress */}
      <div className="overall-progress-container">
        <div className="overall-progress-header">
          <span className="overall-progress-label">Overall Progress</span>
          <span className="overall-progress-text">
            {overallProgress.completed}/{overallProgress.total} ({overallProgress.percentage}%)
          </span>
        </div>
        <div className="overall-progress-bar">
          <div
            className="overall-progress-fill"
            style={{ width: `${overallProgress.percentage}%` }}
          />
        </div>
      </div>

      <div className="acts-container">
        {filteredActs.map((act) => {
          const actTimer = data.actTimers?.find(t => t.actNumber === act.actNumber);
          const isCurrentAct = data.currentActNumber === act.actNumber;

          return (
            <ActPanel
              key={act.actNumber}
              act={act}
              onToggleQuest={(questId) => toggleQuest(questId)}
              onToggleAct={() => toggleAct(act.actNumber)}
              actTimer={actTimer}
              isCurrentAct={isCurrentAct}
              onTimerUpdate={(timer: ActTimerType) => updateActTimer(act.actNumber, timer)}
              autoStartTimer={data.settings.autoActTimers !== false}
            />
          );
        })}
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
            updateSettings({ showGemPanel: !gemPanelVisible });
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

      {/* Notes Panel */}
      {data.notesData && (
        <NotesPanel
          notesData={data.notesData}
          isVisible={notesPanelVisible}
          settingsOpen={settingsOpen}
          onUpdateNotes={updateNotesData}
          onTogglePanel={() => {
            updateSettings({ showNotesPanel: !notesPanelVisible });
          }}
          showToggleButton={false}
        />
      )}

      {/* Permanent Rewards Panel */}
      {rewardsPanelVisible && (
        <PermanentRewardsPanel
          acts={data.acts}
          onClose={() => {
            updateSettings({ showRewardsPanel: false });
          }}
          onQuestToggle={(actId, questId) => toggleQuest(questId)}
        />
      )}

      {/* Regex Builder Panel */}
      <RegexBuilderPanel
        isVisible={regexBuilderVisible}
        settingsOpen={settingsOpen}
        onTogglePanel={() => {
          updateSettings({ showRegexBuilderPanel: !regexBuilderVisible });
        }}
        showToggleButton={false}
      />

      {/* Item Check Panel */}
      {data.itemCheckData && (
        <ItemCheckPanel
          pobItems={data.itemCheckData.pobItems || []}
          isVisible={itemCheckVisible}
          settingsOpen={settingsOpen}
          onTogglePanel={() => {
            updateSettings({ showItemCheckPanel: !itemCheckVisible });
          }}
        />
      )}

      {/* Panel Footer with toggle buttons */}
      <PanelFooter
        gemPanelVisible={gemPanelVisible}
        onToggleGemPanel={() => {
          updateSettings({ showGemPanel: !gemPanelVisible });
        }}
        hasGemData={true}
        notesPanelVisible={notesPanelVisible}
        onToggleNotesPanel={() => {
          updateSettings({ showNotesPanel: !notesPanelVisible });
        }}
        hasNotesData={!!data.notesData}
        treePanelVisible={treePanelVisible}
        onToggleTreePanel={async () => {
          const newVisibility = !treePanelVisible;
          setTreePanelVisible(newVisibility);
          updateSettings({ showTreePanel: newVisibility });
          
          // Handle tree window open/close in Electron
          if (isElectron && window.electronAPI) {
            if (newVisibility) {
              if (data.passiveTreeData) {
                // Convert Maps to serializable format for IPC
                const serializableData = {
                  ...data.passiveTreeData,
                  masterySelections: Array.from(data.passiveTreeData.masterySelections.entries()),
                  jewelSockets: data.passiveTreeData.jewelSockets 
                    ? Array.from(data.passiveTreeData.jewelSockets.entries()) 
                    : undefined,
                };
                await window.electronAPI.openTreeWindow?.(serializableData);
              } else {
                // Show toast instead of opening empty window
                setToastMessage('No passive tree data. Import a POB build first.');
                setTreePanelVisible(false);
                return;
              }
            } else {
              await window.electronAPI.closeTreeWindow?.();
            }
          }
        }}
        rewardsPanelVisible={rewardsPanelVisible}
        onToggleRewardsPanel={() => {
          updateSettings({ showRewardsPanel: !rewardsPanelVisible });
        }}
        hasRewardsData={true}
        regexBuilderVisible={regexBuilderVisible}
        onToggleRegexBuilder={() => {
          updateSettings({ showRegexBuilderPanel: !regexBuilderVisible });
        }}
        itemCheckVisible={itemCheckVisible}
        onToggleItemCheck={() => {
          updateSettings({ showItemCheckPanel: !itemCheckVisible });
        }}
        hasItemCheckData={!!data.itemCheckData}
        settingsOpen={settingsOpen}
      />
      
      {isElectron && <UpdateNotification />}
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span className="toast-message">{toastMessage}</span>
          <button className="toast-close" onClick={() => setToastMessage(null)}>×</button>
        </div>
      )}
    </div>
  );
};