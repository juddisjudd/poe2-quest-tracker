import React, { useState } from "react";
import { GemProgression, GemSlot, GemProgressionWithLoadouts } from "../types";
import "./GemProgressionPanel.css";

import UncutSkillGem from "/assets/global/UncutSkillGem.webp";
import UncutSkillGemBuff from "/assets/global/UncutSkillGemBuff.webp";
import UncutSupportGem from "/assets/global/UncutSupportGem.webp";

interface LoadoutDropdownProps {
  loadouts: Array<{ id: string; name: string }>;
  activeLoadoutId: string;
  onSwitchLoadout: (loadoutId: string) => void;
}

const LoadoutDropdown: React.FC<LoadoutDropdownProps> = ({ loadouts, activeLoadoutId, onSwitchLoadout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeLoadout = loadouts.find(l => l.id === activeLoadoutId);

  return (
    <div className="loadout-dropdown-wrapper">
      <button 
        className="loadout-dropdown-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Switch between different POB loadouts"
      >
        {activeLoadout?.name || 'Select Loadout'}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="loadout-dropdown-menu">
          {loadouts.map(loadout => (
            <button
              key={loadout.id}
              className={`loadout-dropdown-item ${loadout.id === activeLoadoutId ? 'active' : ''}`}
              onClick={() => {
                onSwitchLoadout(loadout.id);
                setIsOpen(false);
              }}
            >
              {loadout.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface GemProgressionPanelProps {
  gemProgression: GemProgression;
  gemLoadouts?: GemProgressionWithLoadouts;
  isVisible: boolean;
  settingsOpen: boolean;
  onToggleGem: (gemId: string) => void;
  onTogglePanel: () => void;
  onSwitchLoadout?: (loadoutId: string) => void;
}

export const GemProgressionPanel: React.FC<GemProgressionPanelProps> = ({
  gemProgression,
  gemLoadouts,
  isVisible,
  settingsOpen,
  onToggleGem,
  onTogglePanel,
  onSwitchLoadout,
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
    const maxSupportSlots = 5;
    const currentSupportGems = socketGroup.supportGems.length;
    const emptySlots = Math.max(0, maxSupportSlots - currentSupportGems);
    
    return (
      <div key={socketGroup.id} className="skill-bar">
        <div className="skill-bar-header">
          <div className="skill-name">{socketGroup.mainGem.name}</div>
        </div>
        
        <div className="socket-group">
          {renderGemSlot(socketGroup.mainGem, true)}
          
          {socketGroup.supportGems.map((supportGem: GemSlot) =>
            renderGemSlot(supportGem)
          )}
          {Array.from({ length: emptySlots }, (_, index) => (
            <div key={`empty-support-${groupIndex}-${index}`} className="gem-slot empty support-gem">
              <div className="gem-slot-inner">
                <div className="gem-icon">
                  <img 
                    src={UncutSupportGem} 
                    alt="empty support slot"
                    className="gem-icon-image empty-socket"
                  />
                </div>
              </div>
              <div className="gem-name-tooltip">Empty Support Slot</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <div className="gem-panel-title-row">
            <h3>Gem Progression</h3>
          </div>
          <div className="gem-panel-controls">
            <div className="gem-panel-stats">
              <span className="gem-count">
                {acquiredGems}/{totalGems} gems
              </span>
            </div>
            <button
              className="control-btn close-btn"
              onClick={onTogglePanel}
              title="Close Gem Panel"
            >
              ×
            </button>
          </div>
        </div>

        {/* Loadout selector - positioned between header and content */}
        {gemLoadouts && 
         gemLoadouts.loadouts && 
         gemLoadouts.loadouts.length > 1 && 
         gemLoadouts.loadouts.some(loadout => loadout.name && loadout.name.trim()) && 
         onSwitchLoadout && (
          <div className="loadout-selector-section">
            <span className="loadout-label">POB Loadouts</span>
            <LoadoutDropdown
              loadouts={gemLoadouts.loadouts}
              activeLoadoutId={gemLoadouts.activeLoadoutId}
              onSwitchLoadout={onSwitchLoadout}
            />
          </div>
        )}

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