import { useEffect, useRef } from 'react';
import { TrackerData, QuestStep } from '../types';
import { parseLogLine, findMatchingQuests, isGuideSupported, findQuestsForZone, parseSceneLine } from '../utils/logParser';
import { getZoneInfo } from '../data/zoneRegistry';

interface UseAutoCompleteProps {
  trackerData: TrackerData;
  onQuestComplete: (questId: string) => void;
  isElectron: boolean;
}

export const useAutoComplete = ({
  trackerData,
  onQuestComplete,
  isElectron
}: UseAutoCompleteProps) => {
  // Use ref to store latest tracker data without triggering effect re-runs
  const trackerDataRef = useRef(trackerData);
  trackerDataRef.current = trackerData;

  useEffect(() => {
    console.log('useAutoComplete effect triggered');
    console.log('isElectron:', isElectron);
    console.log('autoCompleteQuests:', trackerData.settings.autoCompleteQuests);

    if (!isElectron || !trackerData.settings.autoCompleteQuests) {
      console.log('Auto-completion disabled: electron=' + isElectron + ', autoComplete=' + trackerData.settings.autoCompleteQuests);
      return;
    }

    console.log('Auto-completion enabled');

    let logRewardCleanup: (() => void) | undefined;
    let zoneChangedCleanup: (() => void) | undefined;
    let currentLocation: string | undefined;

    // Start log monitoring if log file path is available
    const startMonitoring = async () => {
      if (!trackerData.settings.logFilePath) {
        return;
      }

      try {
        await window.electronAPI.startLogMonitoring(trackerData.settings.logFilePath);
        console.log('Started log monitoring for auto-completion');

        // Listen for zone changes (for auto-completing zone entry/waypoint quests)
        zoneChangedCleanup = window.electronAPI.onZoneChanged((zoneData: any) => {
          // Handle both old format (string) and new format (object with zoneName and actNumber)
          const zoneName = typeof zoneData === 'string' ? zoneData : zoneData.zoneName;
          const actNumber = typeof zoneData === 'object' ? zoneData.actNumber : null;

          console.log('Zone changed to:', zoneName, actNumber ? `(Act ${actNumber})` : '');
          currentLocation = zoneName;
          handleZoneChange(zoneName, actNumber);
        });

        // Listen for log rewards (for reward-based quest completion)
        logRewardCleanup = window.electronAPI.onLogReward((rewardText: string) => {
          console.log('Received log reward:', rewardText);
          handleLogReward(rewardText);
        });

      } catch (error) {
        console.error('Failed to start log monitoring:', error);
      }
    };

    const handleZoneChange = (zoneName: string, actNumber: number | null) => {
      console.log('Handling zone change to:', zoneName, actNumber ? `(Act ${actNumber})` : '');

      // Look up zone info from registry
      const zoneInfo = getZoneInfo(zoneName);
      if (!zoneInfo) {
        console.log('Zone not found in registry:', zoneName);
        // Still check if this is an act marker even if not in zone registry
        if (actNumber !== null && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('act-change', { detail: { actNumber } }));
          console.log(`Dispatched act-change event for Act ${actNumber} (from marker)`);
        }
        return;
      }

      console.log('Zone info:', zoneInfo);

      // Dispatch act-change event when entering any zone in an act
      // This allows timers to start when entering the first zone of an act
      if (zoneInfo.actNumber && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('act-change', { detail: { actNumber: zoneInfo.actNumber } }));
        console.log(`Dispatched act-change event for Act ${zoneInfo.actNumber} (from zone: ${zoneName})`);
      }

      // Get all quests in sequential order (use ref to get latest data)
      const allQuests: QuestStep[] = [];
      for (const act of trackerDataRef.current.acts) {
        allQuests.push(...act.steps);
      }

      // Find the index of the FIRST quest in this zone
      const firstQuestInZoneIndex = allQuests.findIndex(quest => {
        return quest.zoneId === zoneInfo.id;
      });

      if (firstQuestInZoneIndex === -1) {
        console.log('No quests found for zone:', zoneName);
        return;
      }

      console.log('Found first quest in zone at index:', firstQuestInZoneIndex, allQuests[firstQuestInZoneIndex].name);

      // Auto-complete all PREVIOUS uncompleted quests (before this zone)
      let completedCount = 0;
      for (let i = 0; i < firstQuestInZoneIndex; i++) {
        const quest = allQuests[i];
        if (!quest.completed) {
          console.log('Auto-completing previous quest:', quest.id, quest.description);
          onQuestComplete(quest.id);
          completedCount++;
        }
      }

      if (completedCount > 0) {
        console.log(`Auto-completed ${completedCount} previous quest(s) before entering ${zoneName}`);
      } else {
        console.log('No previous quests to complete - already up to date');
      }
    };

    const handleLogReward = (rewardText: string) => {
      // Parse the log line with location context
      const reward = parseLogLine(rewardText, currentLocation);
      if (!reward) {
        console.log('Failed to parse reward line:', rewardText);
        return;
      }

      console.log('Parsed reward:', reward);

      // Find matching quests using location-aware logic
      const matchingQuestIds = findMatchingQuests(reward);

      if (matchingQuestIds.length === 0) {
        console.log('No matching quests found for reward:', reward.rewardText, 'in location:', reward.location);
        return;
      }

      console.log('Found matching quests:', matchingQuestIds);

      // Auto-complete the matching quests (use ref to get latest data)
      matchingQuestIds.forEach(questId => {
        // Check if quest exists and is not already completed
        const quest = findQuestInData(trackerDataRef.current, questId);
        if (quest && !quest.completed) {
          console.log('Auto-completing quest:', questId, quest.description);
          onQuestComplete(questId);
        } else if (quest?.completed) {
          console.log('Quest already completed:', questId, quest.description);
        } else {
          console.log('Quest not found in tracker data:', questId);
        }
      });
    };

    startMonitoring();

    // Cleanup function - only run when component unmounts or settings change
    return () => {
      if (logRewardCleanup) {
        logRewardCleanup();
      }
      if (zoneChangedCleanup) {
        zoneChangedCleanup();
      }

      if (isElectron) {
        window.electronAPI.stopLogMonitoring().catch(error => {
          console.error('Error stopping log monitoring:', error);
        });
      }
    };
  }, [
    trackerData.settings.autoCompleteQuests,
    trackerData.settings.logFilePath,
    isElectron
    // NOTE: Removed trackerData.acts from dependencies to prevent monitoring restart on quest changes
    // The handlers will use the latest data via closure
  ]);
};

// Helper function to find a quest in tracker data
function findQuestInData(trackerData: TrackerData, questId: string) {
  for (const act of trackerData.acts) {
    const quest = act.steps.find(q => q.id === questId);
    if (quest) {
      return quest;
    }
  }
  return null;
}