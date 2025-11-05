import React, { useMemo } from "react";
import { Act, QuestStep, QuestTag } from "../types";
import "./PermanentRewardsPanel.css";

interface PermanentRewardsPanelProps {
  acts: Act[];
  onClose: () => void;
  onQuestToggle: (actId: string, questId: string) => void;
}

interface RewardQuest {
  quest: QuestStep;
  actId: string;
  actName: string;
}

export const PermanentRewardsPanel: React.FC<PermanentRewardsPanelProps> = ({
  acts,
  onClose,
  onQuestToggle,
}) => {
  // Filter quests by reward type
  const rewardsByType = useMemo(() => {
    const rewards: Record<string, RewardQuest[]> = {
      Spirit: [],
      Resistance: [],
      Life: [],
      Mana: [],
      "Passive Skill": [],
      Other: [],
    };

    acts.forEach((act) => {
      act.steps.forEach((quest) => {
        if (!quest.tags || quest.tags.length === 0) return;

        const actInfo = { quest, actId: act.id, actName: act.actName };

        if (quest.tags.includes("Spirit")) {
          rewards.Spirit.push(actInfo);
        } else if (quest.tags.includes("Resistance")) {
          rewards.Resistance.push(actInfo);
        } else if (quest.tags.includes("Life")) {
          rewards.Life.push(actInfo);
        } else if (quest.tags.includes("Mana")) {
          rewards.Mana.push(actInfo);
        } else if (quest.tags.includes("Passive Skill")) {
          rewards["Passive Skill"].push(actInfo);
        } else if (quest.reward) {
          // Has a reward but doesn't match specific categories
          rewards.Other.push(actInfo);
        }
      });
    });

    return rewards;
  }, [acts]);

  // Calculate totals
  const totals = useMemo(() => {
    let spirit = 0;
    let coldRes = 0;
    let fireRes = 0;
    let lightningRes = 0;
    let life = 0;
    let passivePoints = 0;

    acts.forEach((act) => {
      act.steps.forEach((quest) => {
        if (!quest.completed || !quest.reward) return;

        const reward = quest.reward.toLowerCase();

        // Spirit
        const spiritMatch = reward.match(/\+(\d+)\s+(?:to\s+)?spirit/i);
        if (spiritMatch) {
          spirit += parseInt(spiritMatch[1], 10);
        }

        // Resistances
        const coldMatch = reward.match(/\+(\d+)%?\s+(?:to\s+)?(?:cold\s+)?resistance/i);
        if (coldMatch && reward.includes("cold")) {
          coldRes += parseInt(coldMatch[1], 10);
        }

        const fireMatch = reward.match(/\+(\d+)%?\s+(?:to\s+)?(?:fire\s+)?resistance/i);
        if (fireMatch && reward.includes("fire")) {
          fireRes += parseInt(fireMatch[1], 10);
        }

        const lightningMatch = reward.match(/\+(\d+)%?\s+(?:to\s+)?(?:lightning\s+)?resistance/i);
        if (lightningMatch && reward.includes("lightning")) {
          lightningRes += parseInt(lightningMatch[1], 10);
        }

        // Life
        const lifeMatch = reward.match(/\+(\d+)\s+(?:to\s+)?(?:maximum\s+)?life/i);
        if (lifeMatch) {
          life += parseInt(lifeMatch[1], 10);
        }

        // Passive Points
        const passiveMatch = reward.match(/\+?(\d+)\s+passive\s+skill\s+points?/i);
        if (passiveMatch) {
          passivePoints += parseInt(passiveMatch[1], 10);
        }
      });
    });

    return { spirit, coldRes, fireRes, lightningRes, life, passivePoints };
  }, [acts]);

  const renderRewardSection = (title: string, quests: RewardQuest[], color: string) => {
    if (quests.length === 0) return null;

    return (
      <div className="reward-section">
        <h3 className="reward-section-title" style={{ color }}>
          {title} ({quests.filter(r => r.quest.completed).length}/{quests.length})
        </h3>
        <div className="reward-quest-list">
          {quests.map(({ quest, actId, actName }) => (
            <div
              key={quest.id}
              className={`reward-quest-item ${quest.completed ? "completed" : ""}`}
              onClick={() => onQuestToggle(actId, quest.id)}
            >
              <div className="reward-quest-checkbox">
                <div className={`checkbox ${quest.completed ? "checked" : ""}`}>
                  {quest.completed && <span className="checkmark">✓</span>}
                </div>
              </div>
              <div className="reward-quest-content">
                <div className="reward-quest-act">{actName}</div>
                <div className="reward-quest-name">{quest.description.replace(/\*\*/g, '')}</div>
                {quest.reward && (
                  <div className="reward-quest-reward" style={{ color }}>
                    {quest.reward}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="permanent-rewards-panel">
      <div className="rewards-panel-header">
        <h2>Permanent Rewards Tracker</h2>
        <button className="rewards-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="rewards-summary">
        <h3>Current Totals (Completed Only)</h3>
        <div className="totals-grid">
          <div className="total-item" style={{ color: "#BB86FC" }}>
            <span className="total-label">Spirit:</span>
            <span className="total-value">{totals.spirit}</span>
          </div>
          <div className="total-item" style={{ color: "#64B5F6" }}>
            <span className="total-label">Cold Res:</span>
            <span className="total-value">{totals.coldRes}%</span>
          </div>
          <div className="total-item" style={{ color: "#FF5252" }}>
            <span className="total-label">Fire Res:</span>
            <span className="total-value">{totals.fireRes}%</span>
          </div>
          <div className="total-item" style={{ color: "#FFD54F" }}>
            <span className="total-label">Lightning Res:</span>
            <span className="total-value">{totals.lightningRes}%</span>
          </div>
          <div className="total-item" style={{ color: "#EF5350" }}>
            <span className="total-label">Life:</span>
            <span className="total-value">+{totals.life}</span>
          </div>
          <div className="total-item" style={{ color: "#FFA726" }}>
            <span className="total-label">Passive Points:</span>
            <span className="total-value">{totals.passivePoints}</span>
          </div>
        </div>
      </div>

      <div className="rewards-content">
        {renderRewardSection("Spirit Rewards", rewardsByType.Spirit, "#BB86FC")}
        {renderRewardSection("Resistance Rewards", rewardsByType.Resistance, "#64B5F6")}
        {renderRewardSection("Life Rewards", rewardsByType.Life, "#EF5350")}
        {renderRewardSection("Mana Rewards", rewardsByType.Mana, "#42A5F5")}
        {renderRewardSection("Passive Skill Points", rewardsByType["Passive Skill"], "#FFA726")}
        {renderRewardSection("Other Rewards", rewardsByType.Other, "#B0BEC5")}
      </div>
    </div>
  );
};
