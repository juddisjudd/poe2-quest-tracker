import { useEffect } from 'react';
import { TrackerData } from '../types';
import { parseLogLine, findMatchingQuests, isGuideSupported } from '../utils/logParser';

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
  useEffect(() => {
    console.log('useAutoComplete effect triggered');
    console.log('isElectron:', isElectron);
    console.log('autoCompleteQuests:', trackerData.settings.autoCompleteQuests);
    console.log('activeGuideId:', trackerData.activeCampaignGuideId);
    
    if (!isElectron || !trackerData.settings.autoCompleteQuests) {
      console.log('Auto-completion disabled: electron=' + isElectron + ', autoComplete=' + trackerData.settings.autoCompleteQuests);
      return;
    }

    // Only enable for supported guides
    const activeGuideId = trackerData.activeCampaignGuideId || 'standard-guide';
    if (!isGuideSupported(activeGuideId)) {
      console.log('Auto-completion not supported for guide:', activeGuideId);
      return;
    }
    
    console.log('Auto-completion enabled for guide:', activeGuideId);

    let logRewardCleanup: (() => void) | undefined;

    // Start log monitoring if log file path is available
    const startMonitoring = async () => {
      if (!trackerData.settings.logFilePath) {
        return;
      }

      try {
        await window.electronAPI.startLogMonitoring(trackerData.settings.logFilePath);
        console.log('Started log monitoring for auto-completion');

        // Listen for log rewards
        logRewardCleanup = window.electronAPI.onLogReward((rewardText: string) => {
          console.log('Received log reward:', rewardText);
          handleLogReward(rewardText);
        });

      } catch (error) {
        console.error('Failed to start log monitoring:', error);
      }
    };

    const handleLogReward = (rewardText: string) => {
      // Parse the log line
      const reward = parseLogLine(rewardText);
      if (!reward) {
        return;
      }

      console.log('Parsed reward:', reward);

      // Find matching quests
      const matchingQuestIds = findMatchingQuests(reward);
      
      if (matchingQuestIds.length === 0) {
        return;
      }

      console.log('Found matching quests:', matchingQuestIds);

      // Auto-complete the matching quests
      matchingQuestIds.forEach(questId => {
        // Check if quest exists and is not already completed
        const quest = findQuestInData(trackerData, questId);
        if (quest && !quest.completed) {
          console.log('Auto-completing quest:', questId, quest.name);
          onQuestComplete(questId);
        }
      });
    };

    startMonitoring();

    // Cleanup function
    return () => {
      if (logRewardCleanup) {
        logRewardCleanup();
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
    trackerData.activeCampaignGuideId,
    isElectron,
    onQuestComplete
  ]);
};

// Helper function to find a quest in tracker data
function findQuestInData(trackerData: TrackerData, questId: string) {
  for (const act of trackerData.acts) {
    const quest = act.quests.find(q => q.id === questId);
    if (quest) {
      return quest;
    }
  }
  return null;
}