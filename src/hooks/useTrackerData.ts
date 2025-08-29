import { useState, useEffect, useCallback } from "react";
import { TrackerData, Act, GemProgression, GemLoadout, RegexFilters, NotesData } from "../types";
import { defaultQuestData } from "../data/questData";
import { migrateGemProgression, PobLoadout } from "../utils/pobParser";

const initialData: TrackerData = {
  acts: defaultQuestData,
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
          const updatedData: TrackerData = {
            ...mergedData,
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
    const newData = {
      ...data,
      notesData,
    };
    saveData(newData);
  }, [data, saveData]);

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
  };
};