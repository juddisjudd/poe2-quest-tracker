import React from "react";
import { QuestStep } from "../types";

interface QuestItemProps {
  quest: QuestStep;
  onToggle: () => void;
}

export const QuestItem: React.FC<QuestItemProps> = ({ quest, onToggle }) => {
  return (
    <div
      className={`quest-item ${quest.completed ? "completed" : ""} ${
        quest.optional ? "optional" : ""
      }`}
      onClick={onToggle}
    >
      <div className="quest-checkbox">
        <div className={`checkbox ${quest.completed ? "checked" : ""}`}>
          {quest.completed && <span className="checkmark">✓</span>}
        </div>
      </div>
      <div className="quest-content">
        <div className="quest-name">{quest.name}</div>
        {quest.description && (
          <div className="quest-description">{quest.description}</div>
        )}
      </div>
      {quest.optional && <div className="optional-badge">Optional</div>}
    </div>
  );
};
