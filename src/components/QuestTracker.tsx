import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTrackerData } from "../hooks/useTrackerData";
import { useAutoComplete } from "../hooks/useAutoComplete";
import { useGameProcessMonitor } from "../hooks/useGameProcessMonitor";
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
  } = useTrackerData();

  console.log('QuestTracker render:', { loading, actsCount: data.acts.length, firstAct: data.acts[0] });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gemPanelVisible, setGemPanelVisible] = useState(false);
  const [notesPanelVisible, setNotesPanelVisible] = useState(false);
  const [rewardsPanelVisible, setRewardsPanelVisible] = useState(false);
  const [regexBuilderVisible, setRegexBuilderVisible] = useState(false);
  const [itemCheckVisible, setItemCheckVisible] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [timersPausedByProcess, setTimersPausedByProcess] = useState(false);

  const isElectron = !!window.electronAPI;

  // Monitor game process to auto-pause timers when game is not running
  const { isGameRunning } = useGameProcessMonitor({
    enabled: isElectron && (data.settings.autoCompleteQuests || false), // Only monitor if auto-complete is enabled
    onGameClosed: () => {
      console.log('🎮 Game closed - auto-pausing timers');
      setTimersPausedByProcess(true);
      // Pause global timer
      if (data.globalTimer?.isRunning) {
        updateGlobalTimer({
          ...data.globalTimer,
          isRunning: false,
        });
      }
      // Pause all act timers
      data.actTimers?.forEach(timer => {
        if (timer.isRunning) {
          updateActTimer({
            ...timer,
            isRunning: false,
          });
        }
      });
    },
    onGameResumed: () => {
      console.log('🎮 Game resumed - you can manually resume timers if needed');
      setTimersPausedByProcess(false);
      // Note: We don't auto-resume timers, user should manually resume if they want
    },
  });

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

  // Filter acts based on active filters
  const filteredActs = useMemo(() => {
    if (activeFilters.length === 0) {
      return data.acts;
    }

    return data.acts.map(act => ({
      ...act,
      steps: act.steps.filter(quest => {
        if (!quest.tags || quest.tags.length === 0) {
          return true; // Show quests without tags when filtering
        }
        // Hide quest if it has ANY of the active filter tags
        return !quest.tags.some(tag => activeFilters.includes(tag));
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

  // Sync panel visibility with settings
  React.useEffect(() => {
    setGemPanelVisible(data.settings.showGemPanel !== false);
    setNotesPanelVisible(data.settings.showNotesPanel !== false);
    setRewardsPanelVisible(data.settings.showRewardsPanel === true); // Only show if explicitly set to true
    setRegexBuilderVisible(data.settings.showRegexBuilderPanel === true); // Only show if explicitly set to true
    setItemCheckVisible(data.settings.showItemCheckPanel === true); // Only show if explicitly set to true
  }, [data.settings.showGemPanel, data.settings.showNotesPanel, data.settings.showRewardsPanel, data.settings.showRegexBuilderPanel, data.settings.showItemCheckPanel]);

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
            />
          );
        })}
      </div>

      {/* Filter Chips with collapse toggle */}
      <div className="filter-section">
        <button
          className="filter-toggle-btn"
          onClick={() => setFiltersCollapsed(!filtersCollapsed)}
          title={filtersCollapsed ? "Show filters" : "Hide filters"}
        >
          <span className={`filter-toggle-icon ${filtersCollapsed ? 'collapsed' : ''}`}>▼</span>
          <span className="filter-toggle-text">Filters</span>
          {activeFilters.length > 0 && (
            <span className="filter-active-count">({activeFilters.length})</span>
          )}
        </button>
        {!filtersCollapsed && (
          <FilterChips
            activeFilters={activeFilters}
            onFilterToggle={handleFilterToggle}
            questCounts={questCounts}
          />
        )}
      </div>

      {/* Global Timer */}
      <GlobalTimer
        initialTimer={data.globalTimer}
        onTimerUpdate={(timer: GlobalTimerType) => updateGlobalTimer(timer)}
        currentActNumber={data.currentActNumber}
      />

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

      {/* Permanent Rewards Panel */}
      {rewardsPanelVisible && (
        <PermanentRewardsPanel
          acts={data.acts}
          onClose={() => {
            setRewardsPanelVisible(false);
            updateSettings({ showRewardsPanel: false });
          }}
          onQuestToggle={toggleQuest}
        />
      )}

      {/* Regex Builder Panel */}
      <RegexBuilderPanel
        isVisible={regexBuilderVisible}
        settingsOpen={settingsOpen}
        onTogglePanel={() => {
          const newVisibility = !regexBuilderVisible;
          setRegexBuilderVisible(newVisibility);
          updateSettings({ showRegexBuilderPanel: newVisibility });
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
            const newVisibility = !itemCheckVisible;
            setItemCheckVisible(newVisibility);
            updateSettings({ showItemCheckPanel: newVisibility });
          }}
        />
      )}

      {/* Panel Footer with toggle buttons */}
      <PanelFooter
        gemPanelVisible={gemPanelVisible}
        onToggleGemPanel={() => {
          const newVisibility = !gemPanelVisible;
          setGemPanelVisible(newVisibility);
          updateSettings({ showGemPanel: newVisibility });
        }}
        hasGemData={true}
        notesPanelVisible={notesPanelVisible}
        onToggleNotesPanel={() => {
          const newVisibility = !notesPanelVisible;
          setNotesPanelVisible(newVisibility);
          updateSettings({ showNotesPanel: newVisibility });
        }}
        hasNotesData={!!data.notesData}
        rewardsPanelVisible={rewardsPanelVisible}
        onToggleRewardsPanel={() => {
          const newVisibility = !rewardsPanelVisible;
          setRewardsPanelVisible(newVisibility);
          updateSettings({ showRewardsPanel: newVisibility });
        }}
        hasRewardsData={true}
        regexBuilderVisible={regexBuilderVisible}
        onToggleRegexBuilder={() => {
          const newVisibility = !regexBuilderVisible;
          setRegexBuilderVisible(newVisibility);
          updateSettings({ showRegexBuilderPanel: newVisibility });
        }}
        itemCheckVisible={itemCheckVisible}
        onToggleItemCheck={() => {
          const newVisibility = !itemCheckVisible;
          setItemCheckVisible(newVisibility);
          updateSettings({ showItemCheckPanel: newVisibility });
        }}
        hasItemCheckData={!!data.itemCheckData}
        settingsOpen={settingsOpen}
      />
      
      {isElectron && <UpdateNotification />}
    </div>
  );
};