import React from "react";
import { Act, ActTimer as ActTimerType } from "../types";
import { QuestItem } from "./QuestItem";
import { ActTimer } from "./ActTimer";

interface ActPanelProps {
  act: Act;
  onToggleQuest: (questId: string) => void;
  onToggleAct: () => void;
  actTimer?: ActTimerType;
  isCurrentAct?: boolean;
  onTimerUpdate?: (timer: ActTimerType) => void;
}

export const ActPanel: React.FC<ActPanelProps> = ({
  act,
  onToggleQuest,
  onToggleAct,
  actTimer,
  isCurrentAct = false,
  onTimerUpdate,
}) => {
  const completedQuests = act.steps.filter((q) => q.completed).length;
  const totalQuests = act.steps.length;
  const progressPercentage =
    totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  const isActComplete = completedQuests === totalQuests && totalQuests > 0;

  const panelClasses = `
    act-panel ${act.expanded ? "expanded" : "collapsed"} ${
    isActComplete ? "act-complete" : ""
  }
  `;


  return (
    <div className={panelClasses.trim()}>
      <div className="act-header" onClick={onToggleAct}>
        <div className="act-title">
          <span className={`expand-icon ${act.expanded ? "expanded" : ""}`}>
            ▶
          </span>
          <span className="act-name">{act.actName}</span>
        </div>
        <div className="act-header-right">
          <div className="act-progress">
            <span className="progress-text">
              {completedQuests}/{totalQuests} ({Math.round(progressPercentage)}%)
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          {onTimerUpdate && (
            <div onClick={(e) => e.stopPropagation()}>
              <ActTimer
                actNumber={act.actNumber}
                initialTimer={actTimer}
                isCurrentAct={isCurrentAct}
                onTimerUpdate={onTimerUpdate}
              />
            </div>
          )}
        </div>
      </div>
      {act.expanded && (
        <div className="quests-list">
          {act.steps.map((quest) => (
            <QuestItem
              key={quest.id}
              quest={quest}
              onToggle={() => onToggleQuest(quest.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
