import { useState, useEffect, useCallback, useRef } from 'react';

interface UseGameProcessMonitorProps {
  enabled: boolean;
  onGameClosed?: () => void;
  onGameResumed?: () => void;
  pollInterval?: number; // milliseconds
}

/**
 * Hook to monitor if the POE2 game process is running
 * Automatically detects when the game closes/crashes and when it resumes
 * Uses IPC to check game process in main thread
 */
export const useGameProcessMonitor = ({
  enabled,
  onGameClosed,
  onGameResumed,
  pollInterval = 10000, // Check every 10 seconds (native process checking, no WMI overhead)
}: UseGameProcessMonitorProps) => {
  const [isGameRunning, setIsGameRunning] = useState<boolean | null>(null); // null = unknown
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previouslyRunning = useRef<boolean | null>(null);

  const checkGameProcess = useCallback(async () => {
    if (!window.electronAPI?.checkGameProcess) {
      console.warn('checkGameProcess not available - running in web mode?');
      return;
    }

    try {
      const running = await window.electronAPI.checkGameProcess();

      setIsGameRunning(running);
      setLastCheckTime(new Date());

      // Detect state changes
      if (previouslyRunning.current !== null) {
        if (!running && previouslyRunning.current) {
          // Game just closed
          console.log('🎮 Game process stopped - pausing timers');
          onGameClosed?.();
        } else if (running && !previouslyRunning.current) {
          // Game just started
          console.log('🎮 Game process detected - resuming timers');
          onGameResumed?.();
        }
      }

      previouslyRunning.current = running;
    } catch (error) {
      console.error('Error checking game process:', error);
      // Don't change state on error - maintain last known state
    }
  }, [onGameClosed, onGameResumed]);

  // Start/stop monitoring based on enabled prop
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check immediately
    checkGameProcess();

    // Then check periodically
    intervalRef.current = setInterval(checkGameProcess, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollInterval, checkGameProcess]);

  return {
    isGameRunning,
    lastCheckTime,
    checkGameProcess,
  };
};
