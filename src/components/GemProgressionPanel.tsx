import React from "react";
import { GemProgression, GemSlot } from "../types";
import "./GemProgressionPanel.css";

// Import gem images
import UncutSkillGem from "/assets/global/UncutSkillGem.webp";
import UncutSkillGemBuff from "/assets/global/UncutSkillGemBuff.webp";
import UncutSupportGem from "/assets/global/UncutSupportGem.webp";

interface GemProgressionPanelProps {
  gemProgression: GemProgression;
  isVisible: boolean;
  settingsOpen: boolean;
  onToggleGem: (gemId: string) => void;
  onTogglePanel: () => void;
}

export const GemProgressionPanel: React.FC<GemProgressionPanelProps> = ({
  gemProgression,
  isVisible,
  settingsOpen,
  onToggleGem,
  onTogglePanel,
}) => {
  const getGemIcon = (gem: GemSlot) => {
    if (gem.type === 'support') {
      return UncutSupportGem;
    } else if (gem.type === 'spirit') {
      return UncutSkillGemBuff;
    } else {
      return UncutSkillGem;
    }
  };

  const renderGemSlot = (gem: GemSlot, isMainGem: boolean = false) => {
    const statClass = gem.statRequirement ? `stat-${gem.statRequirement}` : 'stat-none';
    const slotClasses = `
      gem-slot ${gem.type} ${statClass} ${gem.acquired ? "acquired" : ""} ${
      isMainGem ? "main-gem" : "support-gem"
    }
    `;
    

    return (
      <div
        key={gem.id}
        className={slotClasses.trim()}
        onClick={() => onToggleGem(gem.id)}
      >
        <div className="gem-slot-inner">
          {gem.acquired && (
            <div className="gem-acquired-indicator">
              <span className="gem-checkmark">✓</span>
            </div>
          )}
          <div className="gem-icon">
            <img 
              src={getGemIcon(gem)} 
              alt={`${gem.type} gem`}
              className="gem-icon-image"
            />
          </div>
        </div>
        <div className="gem-name-tooltip">
          {gem.name}
          {gem.statRequirement && <span className="stat-requirement"> ({gem.statRequirement.toUpperCase()})</span>}
        </div>
      </div>
    );
  };

  const renderSkillBar = (socketGroup: any, groupIndex: number) => {
    const emptySlots = Math.max(0, socketGroup.maxSockets - socketGroup.supportGems.length - 1);
    
    return (
      <div key={socketGroup.id} className="skill-bar">
        {/* Main gem on the left */}
        <div className="main-gem-slot">
          {renderGemSlot(socketGroup.mainGem, true)}
          <div className="gem-name-label">{socketGroup.mainGem.name}</div>
        </div>
        
        {/* Support gems in a horizontal row */}
        <div className="support-gems-row">
          {socketGroup.supportGems.map((supportGem: GemSlot) =>
            renderGemSlot(supportGem)
          )}
          {Array.from({ length: emptySlots }, (_, index) => (
            <div key={`empty-${groupIndex}-${index}`} className="gem-slot empty">
              <div className="gem-slot-inner">
                <div className="gem-icon">
                  <img 
                    src={UncutSupportGem} 
                    alt="empty gem slot"
                    className="gem-icon-image"
                    style={{ opacity: 0.3 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Calculate gem statistics
  const totalGems = gemProgression.socketGroups.reduce(
    (total, group) => total + 1 + group.supportGems.length,
    0
  );
  
  const acquiredGems = gemProgression.socketGroups.reduce(
    (total, group) => 
      total + 
      (group.mainGem.acquired ? 1 : 0) + 
      group.supportGems.filter(g => g.acquired).length,
    0
  );

  return (
    <>
      {/* Toggle Button - positioned at bottom */}
      <div className={`gem-panel-toggle ${isVisible ? "panel-open" : ""} ${settingsOpen ? "settings-open" : ""}`}>
        <button
          className="gem-toggle-btn"
          onClick={onTogglePanel}
          title={isVisible ? "Hide Gem Progression" : "Show Gem Progression"}
        >
          <span className="toggle-icon">{isVisible ? "▼" : "▲"}</span>
          <span className="toggle-text">Gems</span>
        </button>
      </div>

      {/* Gem Panel - slides up from bottom */}
      <div className={`gem-progression-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="gem-panel-header">
          <h3>Gem Progression</h3>
          <div className="gem-panel-controls">
            <div className="gem-panel-stats">
              <span className="gem-count">
                {acquiredGems}/{totalGems} gems
              </span>
            </div>
            <button
              className="gem-panel-close"
              onClick={onTogglePanel}
              title="Close Gem Panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="gem-panel-content">
          {gemProgression.socketGroups.length === 0 ? (
            <div className="gem-panel-empty">
              <div className="empty-icon">💎</div>
              <h4>No gems imported yet</h4>
              <p>Import a Path of Building code in settings to get started.</p>
            </div>
          ) : (
            <div className="skill-bars-container">
              {gemProgression.socketGroups.map((group, index) => 
                renderSkillBar(group, index)
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};