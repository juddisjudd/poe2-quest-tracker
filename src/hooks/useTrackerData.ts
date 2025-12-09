import { useState, useEffect, useCallback, useRef } from "react";
import { TrackerData, Act, GemProgression, GemLoadout, NotesData, QuestStep, ActTimer, GlobalTimer, ItemCheckData } from "../types";
import { defaultQuestData } from "../data/questData";
import { migrateGemProgression, PobLoadout, PobParseResult } from "../utils/pobParser";

const initialData: TrackerData = {
  acts: defaultQuestData,
  editMode: false,
  gemProgression: {
    socketGroups: [],
  },
  notesData: {
    userNotes: "",
    pobNotes: undefined,
  },
  settings: {
    alwaysOnTop: true,
    opacity: 0.9,
    fontSize: 1.0,
    theme: "amoled",
    hotkey: "F9",
    showGemPanel: false,
    showNotesPanel: false,
    showRegexBuilderPanel: false,
    logFilePath: undefined,
    logFileDetected: false,
    autoCompleteQuests: false,
    autoCompleteOnZoneEntry: false, // OFF by default - must opt-in
  },
};

const mergeQuestData = (
  savedData: TrackerData,
  newQuestData: Act[]
): TrackerData => {
  const mergedActs = newQuestData.map((newAct) => {
    const savedAct = savedData.acts.find((act) => act.actNumber === newAct.actNumber);
    if (!savedAct) {
      // Initialize all steps with completed: false
      return {
        ...newAct,
        steps: newAct.steps.map(step => ({ ...step, completed: false })),
        expanded: newAct.actNumber === 1, // Expand Act 1 by default
      };
    }

    const mergedSteps = newAct.steps.map((newStep) => {
      const savedStep = savedAct.steps.find(
        (step) => step.id === newStep.id
      );
      if (savedStep) {
        return {
          ...newStep,
          completed: savedStep.completed || false,
        };
      }
      return {
        ...newStep,
        completed: false,
      };
    });

    return {
      ...newAct,
      steps: mergedSteps,
      expanded: savedAct.expanded,
    };
  });

  return {
    ...savedData,
    acts: mergedActs,
  };
};

export const useTrackerData = () => {
  const [data, setData] = useState<TrackerData>(initialData);
  const [loading, setLoading] = useState(true);
  
  // Track last saved data to avoid unnecessary saves
  const lastSavedDataRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<TrackerData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        let savedData: TrackerData | null = null;

        savedData = await window.electronAPI.loadQuestData();

        const savedGemData = await window.electronAPI.loadGemData();
        if (savedGemData && savedData) {
          savedData.gemProgression = savedGemData.gemProgression;
          savedData.gemLoadouts = savedGemData.gemLoadouts;
        }

        const savedNotesData = await window.electronAPI.loadNotesData();
        if (savedNotesData && savedData) {
          savedData.notesData = savedNotesData;
        }

        const savedItemCheckData = await window.electronAPI.loadItemCheckData();
        if (savedItemCheckData && savedData) {
          savedData.itemCheckData = savedItemCheckData;
        }

        const savedPassiveTreeData = await window.electronAPI.loadPassiveTreeData();
        if (savedPassiveTreeData && savedData) {
          // Convert serialized arrays back to Maps (handle various saved formats)
          const restoredTreeData = {
            ...savedPassiveTreeData,
            masterySelections: Array.isArray(savedPassiveTreeData.masterySelections) 
              ? new Map(savedPassiveTreeData.masterySelections) 
              : new Map(),
            jewelSockets: Array.isArray(savedPassiveTreeData.jewelSockets) 
              ? new Map(savedPassiveTreeData.jewelSockets) 
              : undefined,
          };
          savedData.passiveTreeData = restoredTreeData;
        }

        if (savedData) {
          const hasOldStructure = savedData.acts.some((act: any) =>
            typeof act.actNumber === 'undefined' && typeof act.id !== 'undefined'
          );

          if (hasOldStructure) {
            const freshData: TrackerData = {
              ...initialData,
              acts: defaultQuestData,
              settings: savedData.settings,
              gemProgression: savedData.gemProgression,
              gemLoadouts: savedData.gemLoadouts,
              notesData: savedData.notesData,
              passiveTreeData: savedData.passiveTreeData,
            };
            setData(freshData);
          } else {
            const mergedData = mergeQuestData(savedData, defaultQuestData);

            const updatedData: TrackerData = {
              ...mergedData,
              settings: {
                alwaysOnTop: savedData.settings.alwaysOnTop !== false,
                opacity: savedData.settings.opacity || 0.9,
                fontSize: savedData.settings.fontSize || 1.0,
                theme: savedData.settings.theme || "amoled",
                hotkey: savedData.settings.hotkey || "F9",
                showGemPanel: savedData.settings.showGemPanel || false,
                showNotesPanel: savedData.settings.showNotesPanel || false,
                showRewardsPanel: savedData.settings.showRewardsPanel || false,
                showRegexBuilderPanel: savedData.settings.showRegexBuilderPanel || false,
                logFilePath: savedData.settings.logFilePath,
                logFileDetected: savedData.settings.logFileDetected || false,
                autoCompleteQuests: savedData.settings.autoCompleteQuests || false,
                autoCompleteOnZoneEntry: savedData.settings.autoCompleteOnZoneEntry || false,
                activeFilters: savedData.settings.activeFilters || [],
              },
              gemProgression: savedData.gemProgression
                ? migrateGemProgression(savedData.gemProgression)
                : initialData.gemProgression,
              notesData: mergedData.notesData || savedData.notesData || initialData.notesData,
              passiveTreeData: savedData.passiveTreeData,
            };
            setData(updatedData);
          }
        }
      } catch (error) {
        console.error("Failed to load quest data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Perform the actual save operation
  const performSave = useCallback(async (newData: TrackerData) => {
    try {
      // Exclude passiveTreeData from quest-data.json since it's saved separately
      const { passiveTreeData, ...dataWithoutTree } = newData;
      
      // Create a hash of the data to compare (excluding volatile fields)
      const dataToHash = {
        acts: dataWithoutTree.acts,
        gemProgression: dataWithoutTree.gemProgression,
        gemLoadouts: dataWithoutTree.gemLoadouts,
        settings: dataWithoutTree.settings,
      };
      const dataHash = JSON.stringify(dataToHash);
      
      // Skip save if data hasn't changed
      if (dataHash === lastSavedDataRef.current) {
        return;
      }
      
      await window.electronAPI.saveQuestData(dataWithoutTree as TrackerData);
      
      // Save gem data separately if it exists
      if (newData.gemProgression || newData.gemLoadouts) {
        const gemData = {
          gemProgression: newData.gemProgression,
          gemLoadouts: newData.gemLoadouts,
        };
        await window.electronAPI.saveGemData(gemData);
      }
      
      // Update the last saved hash
      lastSavedDataRef.current = dataHash;
      
    } catch (error) {
      console.error("Failed to save data:", error);
    }
  }, []);

  const saveData = useCallback(
    async (newData: TrackerData) => {
      // Update state immediately
      // If newData explicitly includes notesData, use it; otherwise preserve previous
      setData(prev => ({
        ...newData,
        notesData: 'notesData' in newData ? newData.notesData : prev.notesData,
      }));
      
      // Store pending data for debounced save
      pendingDataRef.current = newData;
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce the actual save by 500ms
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          performSave(pendingDataRef.current);
          pendingDataRef.current = null;
        }
      }, 500);
    },
    [performSave]
  );

  const toggleQuest = useCallback(
    (questId: string) => {
      const newData = {
        ...data,
        acts: data.acts.map((act) => ({
          ...act,
          steps: act.steps.map((quest) =>
            quest.id === questId
              ? { ...quest, completed: !quest.completed }
              : quest
          ),
        })),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const toggleAct = useCallback(
    (actNumber: number) => {
      const newData = {
        ...data,
        acts: data.acts.map((act) =>
          act.actNumber === actNumber ? { ...act, expanded: !act.expanded } : act
        ),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const updateSettings = useCallback(
    (settings: Partial<TrackerData["settings"]>) => {
      const newData = {
        ...data,
        settings: {
          ...data.settings,
          ...settings,
        },
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const resetAllQuests = useCallback(() => {
    const newData = {
      ...data,
      acts: data.acts.map((act) => ({
        ...act,
        steps: act.steps.map((step) => ({
          ...step,
          completed: false,
        })),
      })),
      // Also reset timers in the same atomic operation to avoid race conditions
      actTimers: [],
      globalTimer: undefined,
      currentActNumber: undefined,
    };
    saveData(newData);
  }, [data, saveData]);

  const importGemProgression = useCallback((gemProgression: GemProgression) => {
    const newData = {
      ...data,
      gemProgression: migrateGemProgression(gemProgression),
      gemLoadouts: undefined,
    };
    saveData(newData);
  }, [data, saveData]);

  const importGemLoadouts = useCallback((pobLoadouts: PobLoadout[], defaultGemProgression: GemProgression) => {
    if (pobLoadouts.length <= 1) {
      const gemProgression = pobLoadouts[0]?.gemProgression || defaultGemProgression;
      const newData = {
        ...data,
        gemProgression: migrateGemProgression(gemProgression),
        gemLoadouts: undefined,
      };
      saveData(newData);
      return;
    }

    const gemLoadouts: GemLoadout[] = pobLoadouts.map((pobLoadout, index) => ({
      id: `loadout-${index}`,
      name: pobLoadout.name,
      gemProgression: migrateGemProgression(pobLoadout.gemProgression),
    }));

    const newData = {
      ...data,
      gemProgression: gemLoadouts[0]?.gemProgression || migrateGemProgression(defaultGemProgression),
      gemLoadouts: {
        loadouts: gemLoadouts,
        activeLoadoutId: gemLoadouts[0]?.id || '',
        lastImported: new Date().toISOString(),
      },
    };
    
    saveData(newData);
  }, [data, saveData]);

  // Move these before switchLoadout since switchLoadout depends on updatePassiveTreeData
  const updatePassiveTreeData = useCallback(async (passiveTreeData: import("../types/passiveTree").PassiveTreeData) => {
    // Save passive tree data separately
    try {
      // Convert Maps to serializable format for storage
      const serializableData = {
        ...passiveTreeData,
        masterySelections: Array.from(passiveTreeData.masterySelections.entries()),
        jewelSockets: passiveTreeData.jewelSockets 
          ? Array.from(passiveTreeData.jewelSockets.entries()) 
          : undefined,
      };
      
      await window.electronAPI.savePassiveTreeData(serializableData);

      // Update local state
      setData(prev => ({
        ...prev,
        passiveTreeData,
      }));
    } catch (error) {
      console.error('Failed to save passive tree data separately:', error);
    }
  }, []);

  const clearPassiveTreeData = useCallback(async () => {
    try {
      // Save null/empty data to clear the separate file
      await window.electronAPI.savePassiveTreeData(null);

      // Update local state and also save quest data without passiveTreeData
      setData(prev => {
        const updatedData = {
          ...prev,
          passiveTreeData: undefined,
        };
        // Also update quest-data.json to remove passiveTreeData
        window.electronAPI.saveQuestData(updatedData).catch(err => 
          console.error('Failed to save quest data after clearing tree:', err)
        );
        return updatedData;
      });
    } catch (error) {
      console.error('Failed to clear passive tree data:', error);
    }
  }, []);

  // Switch active loadout
  const switchLoadout = useCallback(async (loadoutId: string) => {
    if (!data.gemLoadouts) return;

    const selectedLoadout = data.gemLoadouts.loadouts.find(l => l.id === loadoutId);
    if (!selectedLoadout) return;

    const newData = {
      ...data,
      gemProgression: selectedLoadout.gemProgression,
      gemLoadouts: {
        ...data.gemLoadouts,
        activeLoadoutId: loadoutId,
      },
      // Update passive tree data if the loadout has one
      passiveTreeData: selectedLoadout.passiveTree || data.passiveTreeData,
    };
    
    // Save the new passive tree data separately if loadout has one
    if (selectedLoadout.passiveTree) {
      await updatePassiveTreeData(selectedLoadout.passiveTree);
    }
    
    saveData(newData);
  }, [data, saveData, updatePassiveTreeData]);

  const toggleGem = useCallback((gemId: string) => {
    if (!data.gemProgression) return;

    const newSocketGroups = data.gemProgression.socketGroups.map((group) => ({
      ...group,
      mainGem: group.mainGem.id === gemId 
        ? { ...group.mainGem, acquired: !group.mainGem.acquired }
        : group.mainGem,
      supportGems: group.supportGems.map((gem) =>
        gem.id === gemId ? { ...gem, acquired: !gem.acquired } : gem
      ),
    }));

    const newData = {
      ...data,
      gemProgression: {
        ...data.gemProgression,
        socketGroups: newSocketGroups,
      },
    };
    saveData(newData);
  }, [data, saveData]);

  const updateNotesData = useCallback(async (notesData: NotesData) => {
    // Save notes separately to avoid race condition with gem data
    try {
      await window.electronAPI.saveNotesData(notesData);

      // Update local state
      setData(prev => ({
        ...prev,
        notesData,
      }));
    } catch (error) {
      console.error('Failed to save notes data separately:', error);
    }
  }, []);

  const updateItemCheckData = useCallback(async (itemCheckData: ItemCheckData) => {
    // Save item check data separately to avoid race condition
    try {
      await window.electronAPI.saveItemCheckData(itemCheckData);

      // Update local state
      setData(prev => ({
        ...prev,
        itemCheckData,
      }));
    } catch (error) {
      console.error('Failed to save item check data separately:', error);
    }
  }, []);

  const importGemsAndNotes = useCallback((gemProgression?: GemProgression, notes?: string) => {
    const newData = {
      ...data,
      ...(gemProgression && { gemProgression: migrateGemProgression(gemProgression) }),
      ...(gemProgression && { gemLoadouts: undefined }),
      ...(notes && {
        notesData: {
          userNotes: data.notesData?.userNotes || "",
          pobNotes: notes
        }
      })
    };
    
    saveData(newData);
  }, [data, saveData]);

  const importCompletePoB = useCallback(async (pobResult: PobParseResult) => {
    let newData = { ...data };

    // Handle gems and loadouts properly
    if (pobResult.hasMultipleLoadouts && pobResult.loadouts && pobResult.loadouts.length > 1) {
      // Use the existing loadout logic - include passiveTree from each loadout
      const gemLoadouts: GemLoadout[] = pobResult.loadouts.map((pobLoadout, index) => ({
        id: `loadout-${index}`,
        name: pobLoadout.name,
        gemProgression: migrateGemProgression(pobLoadout.gemProgression),
        passiveTree: pobLoadout.passiveTree, // Include passive tree for this loadout
      }));

      // Use passive tree from first loadout or the default passiveTree
      const firstLoadoutTree = gemLoadouts[0]?.passiveTree || pobResult.passiveTree;

      newData = {
        ...newData,
        gemProgression: gemLoadouts[0]?.gemProgression || migrateGemProgression(pobResult.gemProgression),
        gemLoadouts: {
          loadouts: gemLoadouts,
          activeLoadoutId: gemLoadouts[0]?.id || '',
          lastImported: new Date().toISOString(),
        },
        passiveTreeData: firstLoadoutTree, // Set initial passive tree from first loadout
      };
    } else if (pobResult.gemProgression) {
      // Single loadout - clear loadouts
      newData = {
        ...newData,
        gemProgression: migrateGemProgression(pobResult.gemProgression),
        gemLoadouts: undefined,
      };
    }

    // Handle items
    if (pobResult.items && pobResult.items.length > 0) {
      newData = {
        ...newData,
        itemCheckData: {
          pobItems: pobResult.items,
          lastImported: new Date().toISOString(),
        },
      };
    }

    // Handle passive tree data - only set if we don't already have loadout-specific trees
    // When there are multiple loadouts, the tree data is already set from first loadout above
    if (!newData.gemLoadouts && pobResult.passiveTree) {
      // Single loadout case - use the default passiveTree
      newData = {
        ...newData,
        passiveTreeData: pobResult.passiveTree,
      };
    } else if (!newData.gemLoadouts && !pobResult.passiveTree) {
      // Single loadout with no tree data - clear old data
      newData = {
        ...newData,
        passiveTreeData: undefined,
      };
    }
    // Multiple loadouts case - tree data already set from first loadout (no action needed)

    // Save gem data first
    saveData(newData);

    // Handle notes separately to ensure they're saved
    if (pobResult.notes) {
      const notesData = {
        userNotes: data.notesData?.userNotes || "",
        pobNotes: pobResult.notes
      };
      await updateNotesData(notesData);
    }

    // Handle item check data separately to ensure it's saved
    if (newData.itemCheckData) {
      await updateItemCheckData(newData.itemCheckData);
    }

    // Handle passive tree data separately to ensure it's saved or cleared
    if (newData.passiveTreeData) {
      await updatePassiveTreeData(newData.passiveTreeData);
    } else {
      // Clear the tree data file if new import has no tree data
      await clearPassiveTreeData();
    }

    console.log('✅ [HOOK] Complete POB import finished');
  }, [data, saveData, updateNotesData, updateItemCheckData, updatePassiveTreeData, clearPassiveTreeData]);

  // Campaign Guide Management
  const selectCampaignGuide = useCallback((guideId: string) => {
    const guide = data.campaignGuides?.find(g => g.id === guideId);
    if (!guide) return;

    const newData = {
      ...data,
      activeCampaignGuideId: guideId,
      acts: guide.acts.map(act => {
        // Preserve expansion state from current acts if same act ID exists
        const currentAct = data.acts.find(currentAct => currentAct.id === act.id);
        return {
          ...act,
          expanded: currentAct ? currentAct.expanded : act.expanded, // Preserve user's expansion preference
          quests: act.steps.map(quest => ({
            ...quest,
            completed: false, // Reset progress when switching guides
          })),
        };
      }),
    };
    saveData(newData);
  }, [data, saveData]);

  const createCampaignGuide = useCallback((guide: Omit<CampaignGuide, 'id'>) => {
    const newId = `custom-${Date.now()}`;
    const newGuide: CampaignGuide = {
      ...guide,
      id: newId,
    };

    const newData = {
      ...data,
      campaignGuides: [...(data.campaignGuides || []), newGuide],
      activeCampaignGuideId: newId,
      acts: newGuide.acts,
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteCampaignGuide = useCallback((guideId: string) => {
    const guide = data.campaignGuides?.find(g => g.id === guideId);
    if (!guide?.custom) return; // Can't delete built-in guides

    const remainingGuides = data.campaignGuides?.filter(g => g.id !== guideId) || [];
    const defaultGuide = remainingGuides.find(g => g.isDefault) || remainingGuides[0];

    const newData = {
      ...data,
      campaignGuides: remainingGuides,
      activeCampaignGuideId: defaultGuide?.id || 'standard-guide',
      acts: defaultGuide?.acts || [],
    };
    saveData(newData);
  }, [data, saveData]);

  const duplicateCampaignGuide = useCallback((sourceGuideId: string, newName: string) => {
    const sourceGuide = data.campaignGuides?.find(g => g.id === sourceGuideId);
    if (!sourceGuide) return;

    const newId = `custom-${Date.now()}`;
    const duplicatedGuide: CampaignGuide = {
      ...sourceGuide,
      id: newId,
      name: newName,
      custom: true,
      isDefault: false,
    };

    const newData = {
      ...data,
      campaignGuides: [...(data.campaignGuides || []), duplicatedGuide],
      activeCampaignGuideId: newId,
      acts: duplicatedGuide.acts.map(act => ({
        ...act,
        quests: act.steps.map(quest => ({
          ...quest,
          completed: false,
        })),
      })),
    };
    saveData(newData);
  }, [data, saveData]);

  // Edit Mode Functions
  const toggleEditMode = useCallback(() => {
    const newData = {
      ...data,
      editMode: !data.editMode,
    };
    saveData(newData);
  }, [data, saveData]);

  const addQuest = useCallback((actId: string, quest: Omit<QuestStep, 'id' | 'completed'>) => {
    const newId = `custom-quest-${Date.now()}`;
    const newQuest: QuestStep = {
      ...quest,
      id: newId,
      completed: false,
      custom: true,
    };

    const newData = {
      ...data,
      acts: data.acts.map(act => 
        act.actNumber === actNumber 
          ? { ...act, quests: [...act.steps, newQuest] }
          : act
      ),
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  const editQuest = useCallback((actId: string, questId: string, questUpdates: Partial<QuestStep>) => {
    const newData = {
      ...data,
      acts: data.acts.map(act => 
        act.actNumber === actNumber 
          ? {
              ...act,
              quests: act.steps.map(quest =>
                quest.id === questId
                  ? { ...quest, ...questUpdates }
                  : quest
              ),
            }
          : act
      ),
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  const deleteQuest = useCallback((actId: string, questId: string) => {
    const newData = {
      ...data,
      acts: data.acts.map(act => 
        act.actNumber === actNumber 
          ? { ...act, quests: act.steps.filter(quest => quest.id !== questId) }
          : act
      ),
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  const addAct = useCallback((act: Omit<Act, 'id'>) => {
    const newId = `custom-act-${Date.now()}`;
    const newAct: Act = {
      ...act,
      id: newId,
      custom: true,
    };

    const newData = {
      ...data,
      acts: [...data.acts, newAct],
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  const editAct = useCallback((actId: string, actUpdates: Partial<Act>) => {
    const newData = {
      ...data,
      acts: data.acts.map(act => 
        act.actNumber === actNumber ? { ...act, ...actUpdates } : act
      ),
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  const deleteAct = useCallback((actId: string) => {
    const newData = {
      ...data,
      acts: data.acts.filter(act => act.id !== actId),
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  const reorderQuest = useCallback((actId: string, questId: string, direction: 'up' | 'down') => {
    const newData = {
      ...data,
      acts: data.acts.map(act => {
        if (act.id !== actId) return act;
        
        const questIndex = act.steps.findIndex(q => q.id === questId);
        if (questIndex === -1) return act;
        
        const newIndex = direction === 'up' ? questIndex - 1 : questIndex + 1;
        if (newIndex < 0 || newIndex >= act.steps.length) return act;
        
        const newQuests = [...act.steps];
        [newQuests[questIndex], newQuests[newIndex]] = [newQuests[newIndex], newQuests[questIndex]];
        
        return { ...act, quests: newQuests };
      }),
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  const reorderAct = useCallback((actId: string, direction: 'up' | 'down') => {
    const actIndex = data.acts.findIndex(act => act.actNumber === actNumber);
    if (actIndex === -1) return;
    
    const newIndex = direction === 'up' ? actIndex - 1 : actIndex + 1;
    if (newIndex < 0 || newIndex >= data.acts.length) return;
    
    const newActs = [...data.acts];
    [newActs[actIndex], newActs[newIndex]] = [newActs[newIndex], newActs[actIndex]];
    
    const newData = {
      ...data,
      acts: newActs,
    };
    // Update current campaign guide if it's custom
    if (newData.activeCampaignGuideId && newData.campaignGuides) {
      const activeGuide = newData.campaignGuides.find(g => g.id === newData.activeCampaignGuideId);
      if (activeGuide?.custom) {
        const updatedGuides = newData.campaignGuides.map(guide =>
          guide.id === newData.activeCampaignGuideId
            ? { ...guide, acts: newData.acts }
            : guide
        );
        newData.campaignGuides = updatedGuides;
      }
    }
    saveData(newData);
  }, [data, saveData]);

  // Export/Import Functions
  const exportGuide = useCallback((guideId: string) => {
    const guide = data.campaignGuides?.find(g => g.id === guideId);
    if (!guide) return;

    const exportData = {
      guide,
      version: "1.0",
      exportedAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    if (!!window.electronAPI) {
      // Electron version - save to file
      window.electronAPI.saveFile(jsonString, `${guide.name.replace(/[^a-z0-9]/gi, '_')}_guide.json`);
    } else {
      // Web version - download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${guide.name.replace(/[^a-z0-9]/gi, '_')}_guide.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [data]);

  const importGuide = useCallback((guideData: string) => {
    try {
      const parsedData = JSON.parse(guideData);
      
      if (!parsedData.guide || !parsedData.guide.name || !parsedData.guide.acts) {
        throw new Error('Invalid guide format');
      }

      const importedGuide: CampaignGuide = {
        ...parsedData.guide,
        id: `imported-${Date.now()}`,
        custom: true,
        isDefault: false,
      };

      const newData = {
        ...data,
        campaignGuides: [...(data.campaignGuides || []), importedGuide],
      };
      saveData(newData);
      
      return true;
    } catch (error) {
      console.error('Failed to import guide:', error);
      return false;
    }
  }, [data, saveData]);

  // Timer management
  const updateActTimer = useCallback((actNumber: number, timer: ActTimer) => {
    const newData = {
      ...data,
      actTimers: data.actTimers || [],
    };

    // Find existing timer or add new one
    const timerIndex = newData.actTimers.findIndex(t => t.actNumber === actNumber);
    if (timerIndex >= 0) {
      newData.actTimers[timerIndex] = timer;
    } else {
      newData.actTimers.push(timer);
    }

    saveData(newData);
  }, [data, saveData]);

  const updateCurrentAct = useCallback((actNumber: number) => {
    const newData = {
      ...data,
      currentActNumber: actNumber,
    };
    saveData(newData);
  }, [data, saveData]);

  const resetTimers = useCallback(() => {
    const newData = {
      ...data,
      actTimers: [],
      globalTimer: undefined,
      currentActNumber: undefined,
    };
    saveData(newData);
  }, [data, saveData]);

  const updateGlobalTimer = useCallback((timer: GlobalTimer) => {
    const newData = {
      ...data,
      globalTimer: timer,
    };
    saveData(newData);
  }, [data, saveData]);

  // Atomic reset of ALL data - quests, timers, gems, notes, tree, items
  const resetAllData = useCallback(async () => {
    // Clear passive tree data from separate storage first
    await window.electronAPI.savePassiveTreeData(null);
    
    // Reset all data in one atomic operation
    const newData: TrackerData = {
      ...data,
      // Reset quest completion
      acts: data.acts.map((act) => ({
        ...act,
        steps: act.steps.map((step) => ({
          ...step,
          completed: false,
        })),
      })),
      // Reset timers
      actTimers: [],
      globalTimer: undefined,
      currentActNumber: undefined,
      // Reset gems
      gemProgression: {
        socketGroups: [],
      },
      gemLoadouts: undefined,
      // Reset notes
      notesData: {
        userNotes: "",
        pobNotes: undefined,
      },
      // Reset passive tree
      passiveTreeData: undefined,
      // Reset item check data
      itemCheckData: undefined,
    };
    
    saveData(newData);
    
    // Also clear separate data files
    await window.electronAPI.saveGemData({ gemProgression: { socketGroups: [] } });
    await window.electronAPI.saveNotesData({ userNotes: "", pobNotes: undefined });
    await window.electronAPI.saveItemCheckData(undefined);
  }, [data, saveData]);

  return {
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
    passiveTreeData: data.passiveTreeData,
    updatePassiveTreeData,
    clearPassiveTreeData,
    resetAllData,
  };
};