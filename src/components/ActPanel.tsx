import React from "react";
import { Act } from "../types";
import { QuestItem } from "./QuestItem";

interface ActPanelProps {
  act: Act;
  showOptional: boolean;
  onToggleQuest: (questId: string) => void;
  onToggleAct: () => void;
}

export const ActPanel: React.FC<ActPanelProps> = ({
  act,
  showOptional,
  onToggleQuest,
  onToggleAct,
}) => {
  const visibleQuests = showOptional
    ? act.quests
    : act.quests.filter((quest) => !quest.optional);

  const completedQuests = visibleQuests.filter((q) => q.completed).length;
  const totalQuests = visibleQuests.length;
  const progressPercentage =
    totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;

  const isTemporaryCruel = act.name.includes("Cruel");

  const isActComplete = completedQuests === totalQuests && totalQuests > 0;

  const panelClasses = `
    act-panel
    ${act.expanded ? "expanded" : "collapsed"}
    ${isActComplete ? "act-complete" : ""}
  `;

  return (
    <div className={panelClasses.trim()} data-temporary={isTemporaryCruel}>
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
          {visibleQuests.map((quest) => (
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
