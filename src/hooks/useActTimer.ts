import { useState, useEffect, useCallback, useRef } from 'react';
import { ActTimer } from '../types';

interface UseActTimerProps {
  actNumber: number;
  initialTimer?: ActTimer;
  onTimerUpdate: (timer: ActTimer) => void;
}

/**
 * Hook to manage a single act's timer
 * Automatically starts/stops based on act changes
 */
export const useActTimer = ({ actNumber, initialTimer, onTimerUpdate }: UseActTimerProps) => {
  const [timer, setTimer] = useState<ActTimer>(
    initialTimer || {
      actNumber,
      startTime: null,
      elapsed: 0,
      isRunning: false,
      completed: false,
    }
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer state
  const updateTimer = useCallback((updates: Partial<ActTimer>) => {
    setTimer(prev => {
      const newTimer = { ...prev, ...updates };
      onTimerUpdate(newTimer);
      return newTimer;
    });
  }, [onTimerUpdate]);

  // Start the timer
  const startTimer = useCallback(() => {
    if (timer.isRunning || timer.completed) return;

    const startTime = Date.now() - timer.elapsed;
    updateTimer({
      startTime,
      isRunning: true,
    });
  }, [timer.isRunning, timer.completed, timer.elapsed, updateTimer]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (!timer.isRunning) return;

    updateTimer({
      isRunning: false,
      startTime: null,
    });
  }, [timer.isRunning, updateTimer]);

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    updateTimer({
      startTime: null,
      elapsed: 0,
      isRunning: false,
      completed: false,
      completionTime: undefined,
    });
  }, [updateTimer]);

  // Complete the timer (mark act as finished)
  const completeTimer = useCallback(() => {
    if (timer.completed) return;

    updateTimer({
      isRunning: false,
      completed: true,
      completionTime: timer.elapsed,
      startTime: null,
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timer.completed, timer.elapsed, updateTimer]);

  // Update elapsed time every 100ms when running
  useEffect(() => {
    if (timer.isRunning && timer.startTime !== null) {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - timer.startTime!;
        setTimer(prev => {
          const newTimer = { ...prev, elapsed };
          onTimerUpdate(newTimer);
          return newTimer;
        });
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [timer.isRunning, timer.startTime, onTimerUpdate]);

  // Format time as MM:SS
  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    timer,
    formattedTime: formatTime(timer.elapsed),
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    formatTime,
  };
};
