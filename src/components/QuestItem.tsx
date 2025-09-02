import React from "react";
import { QuestStep } from "../types";

interface QuestItemProps {
  quest: QuestStep;
  onToggle: () => void;
}

const parseQuestText = (text: string) => {
  // Parse **[location]** as location styling
  text = text.replace(/\*\*\[([^\]]+)\]\*\*/g, '<span class="quest-location">[$1]</span>');
  
  // Parse **boss/quest item** as boss/item styling
  text = text.replace(/\*\*([^*\[\]]+)\*\*/g, '<span class="quest-boss">$1</span>');
  
  // Parse ***tip*** as tip styling
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<span class="quest-tip">$1</span>');
  
  return text;
};

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
        <div 
          className="quest-name"
          dangerouslySetInnerHTML={{ __html: parseQuestText(quest.name) }}
        />
        {quest.description && (
          <div 
            className="quest-description"
            dangerouslySetInnerHTML={{ __html: parseQuestText(quest.description) }}
          />
        )}
        {quest.reward && (
          <div className="quest-reward">
            <span className="reward-label">Reward:</span> {quest.reward}
          </div>
        )}
        {quest.warning && (
          <div className="quest-warning">
            <span className="warning-icon">⚠️</span> <strong>WARNING:</strong> {quest.warning}
          </div>
        )}
      </div>
      {quest.optional && <div className="optional-badge">Optional</div>}
    </div>
  );
};
