import React from "react";
import { Act } from "../types";
import { QuestItem } from "./QuestItem";

interface ActPanelProps {
  act: Act;
  onToggleQuest: (questId: string) => void;
  onToggleAct: () => void;
}

export const ActPanel: React.FC<ActPanelProps> = ({
  act,
  onToggleQuest,
  onToggleAct,
}) => {
  const completedQuests = act.quests.filter((q) => q.completed).length;
  const totalQuests = act.quests.length;
  const progressPercentage =
    totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
  const isTemporaryCruel = act.name.includes("Cruel");

  return (
    <div
      className={`act-panel ${act.expanded ? "expanded" : "collapsed"}`}
      data-temporary={isTemporaryCruel}
    >
      <div className="act-header" onClick={onToggleAct}>
        <div className="act-title">
          <span className={`expand-icon ${act.expanded ? "expanded" : ""}`}>
            ▶
          </span>
          <span className="act-name">{act.name}</span>
        </div>
        <div className="act-progress">
          <span className="progress-text">
            {completedQuests}/{totalQuests}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {act.expanded && (
        <div className="quests-list">
          {act.quests.map((quest) => (
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
