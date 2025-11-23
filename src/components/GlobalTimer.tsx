import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GlobalTimer as GlobalTimerType } from '../types';
import './GlobalTimer.css';

interface GlobalTimerProps {
  initialTimer?: GlobalTimerType;
  onTimerUpdate: (timer: GlobalTimerType) => void;
  currentActNumber?: number;
}

export const GlobalTimer: React.FC<GlobalTimerProps> = ({
  initialTimer,
  onTimerUpdate,
  currentActNumber,
}) => {
  const [timer, setTimer] = useState<GlobalTimerType>(
    initialTimer || {
      startTime: null,
      elapsed: 0,
      isRunning: false,
      isPaused: false,
    }
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const updateTimer = useCallback((updates: Partial<GlobalTimerType>) => {
    setTimer(prev => {
      const newTimer = { ...prev, ...updates };
      onTimerUpdate(newTimer);
      return newTimer;
    });
  }, [onTimerUpdate]);

  const startTimer = useCallback(() => {
    if (timer.isRunning && !timer.isPaused) return;

    const startTime = Date.now() - timer.elapsed;
    updateTimer({
      startTime,
      isRunning: true,
      isPaused: false,
    });
  }, [timer.isRunning, timer.isPaused, timer.elapsed, updateTimer]);

  const pauseTimer = useCallback(() => {
    if (!timer.isRunning || timer.isPaused) return;

    updateTimer({
      isPaused: true,
    });
  }, [timer.isRunning, timer.isPaused, updateTimer]);

  const resumeTimer = useCallback(() => {
    if (!timer.isRunning || !timer.isPaused) return;

    const startTime = Date.now() - timer.elapsed;
    updateTimer({
      startTime,
      isPaused: false,
    });
  }, [timer.isRunning, timer.isPaused, timer.elapsed, updateTimer]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    updateTimer({
      startTime: null,
      elapsed: 0,
      isRunning: false,
      isPaused: false,
    });
  }, [updateTimer]);

  useEffect(() => {
    if (currentActNumber === 1 && !timer.isRunning && timer.elapsed === 0) {
      console.log('Auto-starting global speedrun timer (Act 1 detected)');
      startTimer();
    }
  }, [currentActNumber, timer.isRunning, timer.elapsed, startTimer]);

  useEffect(() => {
    if (timer.isRunning && !timer.isPaused && timer.startTime !== null) {
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
  }, [timer.isRunning, timer.isPaused, timer.startTime, onTimerUpdate]);

  return (
    <div className={`global-timer ${timer.isRunning && !timer.isPaused ? 'running' : ''} ${timer.isPaused ? 'paused' : ''}`}>
      <div className="global-timer-label">Total Time</div>
      <div className="global-timer-display">{formatTime(timer.elapsed)}</div>
      <div className="global-timer-controls">
        {!timer.isRunning ? (
          <button
            className="global-timer-btn start"
            onClick={startTimer}
            title="Start speedrun timer"
          >
            ▶
          </button>
        ) : timer.isPaused ? (
          <button
            className="global-timer-btn resume"
            onClick={resumeTimer}
            title="Resume timer"
          >
            ▶
          </button>
        ) : (
          <button
            className="global-timer-btn pause"
            onClick={pauseTimer}
            title="Pause timer"
          >
            ⏸
          </button>
        )}
        <button
          className="global-timer-btn reset"
          onClick={resetTimer}
          title="Reset timer"
        >
          ↻
        </button>
      </div>
    </div>
  );
};
