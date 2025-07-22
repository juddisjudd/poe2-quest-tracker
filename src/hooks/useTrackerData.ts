import { useState, useEffect, useCallback } from "react";
import { TrackerData } from "../types";
import { defaultQuestData } from "../data/questData";

const initialData: TrackerData = {
  acts: defaultQuestData,
  settings: {
    alwaysOnTop: true,
    opacity: 0.9,
    fontSize: 1.0,
    theme: "amoled",
  },
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
          const updatedData: TrackerData = {
            ...savedData,
            settings: {
              ...savedData.settings,
              fontSize: savedData.settings.fontSize || 1.0,
              theme: savedData.settings.theme || "amoled",
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

  return {
    data,
    loading,
    toggleQuest,
    toggleAct,
    updateSettings,
  };
};
