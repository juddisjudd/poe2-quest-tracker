import { useState, useEffect, useCallback } from "react";
import { TrackerData, Act, GemProgression, GemLoadout, RegexFilters, NotesData, CampaignGuide, QuestStep } from "../types";
import { defaultQuestData, availableCampaignGuides, defaultCampaignGuide } from "../data/questData";
import { migrateGemProgression, PobLoadout } from "../utils/pobParser";

const initialData: TrackerData = {
  acts: defaultQuestData,
  campaignGuides: availableCampaignGuides,
  activeCampaignGuideId: defaultCampaignGuide.id,
  editMode: false,
  gemProgression: {
    socketGroups: [],
  },
  regexFilters: {
    vendor: {
      weapons: "",
      body: "",
      offhandShields: "",
      belt: "",
      boots: "",
      gloves: "",
      ring: "",
      amulet: "",
    },
    waystones: "",
    tablets: "",
    relics: "",
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
    showOptional: true,
    hotkey: "F9",
    showGemPanel: false,
    showRegexPanel: false,
    showNotesPanel: false,
    logFilePath: undefined,
    logFileDetected: false,
  },
};

const mergeQuestData = (
  savedData: TrackerData,
  newQuestData: Act[]
): TrackerData => {
  const mergedActs = newQuestData.map((newAct) => {
    const savedAct = savedData.acts.find((act) => act.id === newAct.id);
    if (!savedAct) {
      return newAct;
    }

    const mergedQuests = newAct.quests.map((newQuest) => {
      const savedQuest = savedAct.quests.find(
        (quest) => quest.id === newQuest.id
      );
      if (savedQuest) {
        return {
          ...newQuest,
          completed: savedQuest.completed,
        };
      }
      return newQuest;
    });

    return {
      ...newAct,
      quests: mergedQuests,
      expanded: savedAct.expanded,
    };
  });

  const filteredMergedActs = mergedActs.filter((act) => {
    return !act.id.includes("-cruel") || newQuestData.some(newAct => newAct.id === act.id);
  });

  return {
    ...savedData,
    acts: filteredMergedActs,
  };
};

export const useTrackerData = () => {
  const [data, setData] = useState<TrackerData>(initialData);
  const [loading, setLoading] = useState(true);

  const isElectron = !!window.electronAPI;

  useEffect(() => {
    const loadData = async () => {
      try {
        let savedData: TrackerData | null = null;

        if (isElectron) {
          savedData = await window.electronAPI.loadQuestData();
        } else {
          const localStorageData = localStorage.getItem(
            "poe2-quest-tracker-data"
          );
          if (localStorageData) {
            try {
              savedData = JSON.parse(localStorageData) as TrackerData;
            } catch (parseError) {
              console.error("Failed to parse localStorage data:", parseError);
              savedData = null;
            }
          }
        }

        if (savedData) {
          const mergedData = mergeQuestData(savedData, defaultQuestData);
          
          // Ensure built-in guides are always available and merge with any custom guides
          const mergedGuides = [
            ...availableCampaignGuides, // Always include built-in guides
            ...(savedData.campaignGuides || []).filter(guide => guide.custom) // Add custom guides
          ];
          
          const updatedData: TrackerData = {
            ...mergedData,
            campaignGuides: mergedGuides,
            activeCampaignGuideId: savedData.activeCampaignGuideId || defaultCampaignGuide.id,
            settings: {
              ...savedData.settings,
              fontSize: savedData.settings.fontSize || 1.0,
              theme: savedData.settings.theme || "amoled",
              showOptional: savedData.settings.showOptional !== false,
              hotkey: savedData.settings.hotkey || "F9",
              showGemPanel: savedData.settings.showGemPanel || false,
              showRegexPanel: savedData.settings.showRegexPanel || false,
              showNotesPanel: savedData.settings.showNotesPanel || false,
              logFilePath: savedData.settings.logFilePath,
              logFileDetected: savedData.settings.logFileDetected || false,
            },
            gemProgression: savedData.gemProgression 
              ? migrateGemProgression(savedData.gemProgression)
              : undefined,
            regexFilters: savedData.regexFilters || initialData.regexFilters,
            notesData: savedData.notesData || initialData.notesData,
          };
          setData(updatedData);
        }
      } catch (error) {
        console.error("Failed to load quest data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isElectron]);

  const saveData = useCallback(
    async (newData: TrackerData) => {
      try {
        if (isElectron) {
          await window.electronAPI.saveQuestData(newData);
        } else {
          localStorage.setItem(
            "poe2-quest-tracker-data",
            JSON.stringify(newData)
          );
        }
        setData(newData);
      } catch (error) {
        console.error("Failed to save quest data:", error);
        if (isElectron) {
          try {
            localStorage.setItem(
              "poe2-quest-tracker-data",
              JSON.stringify(newData)
            );
          } catch (localError) {
            console.error("localStorage backup also failed:", localError);
          }
        }
      }
    },
    [isElectron]
  );

  const toggleQuest = useCallback(
    (actId: string, questId: string) => {
      const newData = {
        ...data,
        acts: data.acts.map((act) =>
          act.id === actId
            ? {
                ...act,
                quests: act.quests.map((quest) =>
                  quest.id === questId
                    ? { ...quest, completed: !quest.completed }
                    : quest
                ),
              }
            : act
        ),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const toggleAct = useCallback(
    (actId: string) => {
      const newData = {
        ...data,
        acts: data.acts.map((act) =>
          act.id === actId ? { ...act, expanded: !act.expanded } : act
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
        quests: act.quests.map((quest) => ({
          ...quest,
          completed: false,
        })),
      })),
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

  // Switch active loadout
  const switchLoadout = useCallback((loadoutId: string) => {
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
    };
    saveData(newData);
  }, [data, saveData]);

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

  const updateRegexFilters = useCallback((regexFilters: RegexFilters) => {
    const newData = {
      ...data,
      regexFilters,
    };
    saveData(newData);
  }, [data, saveData]);

  const updateNotesData = useCallback((notesData: NotesData) => {
    console.log('🎯 [HOOK] updateNotesData called with:', {
      hasUserNotes: !!notesData.userNotes,
      userNotesLength: notesData.userNotes?.length || 0,
      hasPobNotes: !!notesData.pobNotes,
      pobNotesLength: notesData.pobNotes?.length || 0,
      pobNotesPreview: notesData.pobNotes ? notesData.pobNotes.substring(0, 100) + '...' : 'No POB notes'
    });
    
    const newData = {
      ...data,
      notesData,
    };
    
    console.log('💾 [HOOK] Saving notes data:', {
      hasNotesData: !!newData.notesData,
      userNotes: newData.notesData?.userNotes?.length || 0,
      pobNotes: newData.notesData?.pobNotes?.length || 0
    });
    
    saveData(newData);
  }, [data, saveData]);

  const importGemsAndNotes = useCallback((gemProgression?: GemProgression, notes?: string) => {
    console.log('🎯 [HOOK] importGemsAndNotes called with:', {
      hasGemProgression: !!gemProgression,
      socketGroups: gemProgression?.socketGroups?.length || 0,
      hasNotes: !!notes,
      notesLength: notes?.length || 0,
      notesPreview: notes ? notes.substring(0, 100) + '...' : 'No notes'
    });
    
    console.log('🔍 [HOOK] Current data.notesData:', {
      hasNotesData: !!data.notesData,
      userNotes: data.notesData?.userNotes?.length || 0,
      pobNotes: data.notesData?.pobNotes?.length || 0
    });
    
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
    
    console.log('💾 [HOOK] New data notesData:', {
      hasNotesData: !!newData.notesData,
      userNotes: newData.notesData?.userNotes?.length || 0,
      pobNotes: newData.notesData?.pobNotes?.length || 0,
      notesWillBeAdded: !!notes
    });
    
    saveData(newData);
  }, [data, saveData]);

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
          quests: act.quests.map(quest => ({
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
        quests: act.quests.map(quest => ({
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
        act.id === actId 
          ? { ...act, quests: [...act.quests, newQuest] }
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
        act.id === actId 
          ? {
              ...act,
              quests: act.quests.map(quest =>
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
        act.id === actId 
          ? { ...act, quests: act.quests.filter(quest => quest.id !== questId) }
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
        act.id === actId ? { ...act, ...actUpdates } : act
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
        
        const questIndex = act.quests.findIndex(q => q.id === questId);
        if (questIndex === -1) return act;
        
        const newIndex = direction === 'up' ? questIndex - 1 : questIndex + 1;
        if (newIndex < 0 || newIndex >= act.quests.length) return act;
        
        const newQuests = [...act.quests];
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
    const actIndex = data.acts.findIndex(act => act.id === actId);
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
    updateRegexFilters,
    updateNotesData,
    importGemsAndNotes,
    // Campaign Guide Management (simplified)
    selectCampaignGuide,
  };
};