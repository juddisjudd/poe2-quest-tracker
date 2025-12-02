import React, { useEffect, useRef } from 'react';
import { useActTimer } from '../hooks/useActTimer';
import { ActTimer as ActTimerType } from '../types';
import './ActTimer.css';

interface ActTimerProps {
  actNumber: number;
  initialTimer?: ActTimerType;
  isCurrentAct: boolean;
  onTimerUpdate: (timer: ActTimerType) => void;
  autoStart?: boolean;
}

export const ActTimer: React.FC<ActTimerProps> = ({
  actNumber,
  initialTimer,
  isCurrentAct,
  onTimerUpdate,
  autoStart = true,
}) => {
  const {
    timer,
    formattedTime,
    startTimer,
    pauseTimer,
    resetTimer,
  } = useActTimer({
    actNumber,
    initialTimer,
    onTimerUpdate,
  });

  const isInitialMount = useRef(true);
  const previousIsCurrentAct = useRef(isCurrentAct);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousIsCurrentAct.current = isCurrentAct;
      return;
    }

    if (!autoStart) {
      previousIsCurrentAct.current = isCurrentAct;
      return;
    }

    if (isCurrentAct && !previousIsCurrentAct.current && !timer.isRunning && !timer.completed) {
      console.log(`Auto-starting timer for Act ${actNumber} (zone change detected)`);
      startTimer();
    } else if (!isCurrentAct && timer.isRunning) {
      console.log(`Pausing timer for Act ${actNumber} (left act)`);
      pauseTimer();
    }

    previousIsCurrentAct.current = isCurrentAct;
  }, [autoStart, isCurrentAct, timer.isRunning, timer.completed, actNumber, startTimer, pauseTimer]);

  if (timer.completed) {
    return (
      <div className="act-timer completed">
        <span className="timer-display">{formattedTime}</span>
      </div>
    );
  }

  return (
    <div className={`act-timer ${isCurrentAct ? 'active' : ''} ${timer.isRunning ? 'running' : ''}`}>
      <span className="timer-display">{formattedTime}</span>
      <div className="timer-controls">
        {timer.isRunning ? (
          <button
            className="timer-btn pause"
            onClick={pauseTimer}
            title="Pause timer"
          >
            ⏸
          </button>
        ) : (
          <button
            className="timer-btn start"
            onClick={startTimer}
            title="Start timer"
          >
            ▶
          </button>
        )}
        <button
          className="timer-btn reset"
          onClick={resetTimer}
          title="Reset timer"
        >
          ↻
        </button>
      </div>
    </div>
  );
};
