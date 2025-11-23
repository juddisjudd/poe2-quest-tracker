import React from "react";
import { QuestStep } from "../types";
import { highlightQuestTextHTML } from "../utils/highlightText";
import {
  ArrowRightIcon,
  DrawingPinIcon,
  HomeIcon,
  ChatBubbleIcon,
  ExclamationTriangleIcon,
  CrossCircledIcon,
  MixIcon,
  StarFilledIcon,
  InfoCircledIcon,
  LightningBoltIcon,
  CubeIcon,
} from "@radix-ui/react-icons";

interface QuestItemProps {
  quest: QuestStep;
  onToggle: () => void;
}

const STEP_TYPE_ICONS: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  navigation: { icon: ArrowRightIcon, color: '#E0E0E0' },
  waypoint: { icon: DrawingPinIcon, color: '#00D4FF' },
  town: { icon: HomeIcon, color: '#FEC076' },
  npc_quest: { icon: ChatBubbleIcon, color: '#FFB84D' },
  quest: { icon: ExclamationTriangleIcon, color: '#FFEB3B' },
  kill_boss: { icon: CrossCircledIcon, color: '#FF5252' },
  trial: { icon: MixIcon, color: '#4ADE80' },
  passive: { icon: StarFilledIcon, color: '#4ADE80' },
  optional: { icon: InfoCircledIcon, color: '#9E9E9E' }
};

const parseQuestText = (text: string) => {
  text = text.replace(/\*\*\[([^\]]+)\]\*\*/g, '<span class="quest-location">[$1]</span>');
  text = text.replace(/\*\*([^*\[\]]+)\*\*/g, '<span class="quest-boss">$1</span>');
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<span class="quest-tip">$1</span>');
  text = highlightQuestTextHTML(text);
  return text;
};

export const QuestItem: React.FC<QuestItemProps> = ({ quest, onToggle }) => {
  const stepType = STEP_TYPE_ICONS[quest.type] || STEP_TYPE_ICONS.navigation;
  const isOptional = quest.type === 'optional';
  const IconComponent = stepType.icon;

  return (
    <div
      className={`quest-item ${quest.completed ? "completed" : ""} ${
        isOptional ? "optional" : ""
      }`}
      onClick={onToggle}
    >
      <div className="quest-checkbox">
        <div className={`checkbox ${quest.completed ? "checked" : ""}`}>
          {quest.completed && <span className="checkmark">✓</span>}
        </div>
      </div>
      <div
        className="step-icon-wrap"
        style={{
          background: `${stepType.color}22`,
          borderColor: `${stepType.color}44`
        }}
      >
        <IconComponent className="step-icon" style={{ color: stepType.color }} />
      </div>
      <div className="quest-content">
        <div
          className="quest-name"
          dangerouslySetInnerHTML={{ __html: parseQuestText(quest.description) }}
        />
        {quest.hint && (
          <div className="quest-hint">
            <LightningBoltIcon className="hint-icon" /> {quest.hint}
          </div>
        )}
        {quest.reward && (
          <div className="quest-reward">
            <CubeIcon className="reward-icon" /> {quest.reward}
          </div>
        )}
        {quest.layoutTip && (
          <div className="quest-layout-tip">
            <span className="layout-tip-badge">...</span> {quest.layoutTip}
          </div>
        )}
      </div>
      {isOptional && <div className="optional-badge">Optional</div>}
    </div>
  );
};
