import { useState, useEffect, useCallback } from "react";
import { TrackerData } from "../types";
import { defaultQuestData } from "../data/questData";

const initialData: TrackerData = {
  acts: defaultQuestData,
  settings: {
    alwaysOnTop: true,
    opacity: 0.9,
  },
};

export const useTrackerData = () => {
  const [data, setData] = useState<TrackerData>(initialData);
  const [loading, setLoading] = useState(true);

  // Check if the Electron API is available
  const isElectron = !!window.electronAPI;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Only try to load data from Electron if the API exists
        if (isElectron) {
          const savedData = await window.electronAPI.loadQuestData();
          if (savedData) {
            setData(savedData);
          }
        }
      } catch (error) {
        console.error("Failed to load quest data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isElectron]); // Rerun if the environment changes (though it won't)

  const saveData = useCallback(
    async (newData: TrackerData) => {
      try {
        // Only try to save data in Electron
        if (isElectron) {
          await window.electronAPI.saveQuestData(newData);
        }
        setData(newData);
      } catch (error) {
        console.error("Failed to save quest data:", error);
      }
    },
    [isElectron] // Depend on the Electron environment status
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
        settings: { ...data.settings, ...settings },
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
