import { useState, useEffect, useCallback } from "react";
import { TrackerData, Act } from "../types";
import { defaultQuestData } from "../data/questData";

const initialData: TrackerData = {
  acts: defaultQuestData,
  settings: {
    alwaysOnTop: true,
    opacity: 0.9,
    fontSize: 1.0,
    theme: "amoled",
    showOptional: true,
    hotkey: "F9",
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

  // Filter out any deprecated Cruel mode acts from saved data
  const filteredMergedActs = mergedActs.filter((act) => {
    // Remove old cruel acts that are no longer in the new quest data
    return (
      !act.id.includes("-cruel") ||
      newQuestData.some((newAct) => newAct.id === act.id)
    );
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
            },
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
            console.log("Saved to localStorage as backup");
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

  return {
    data,
    loading,
    toggleQuest,
    toggleAct,
    updateSettings,
    resetAllQuests,
  };
};
