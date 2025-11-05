import React from "react";
import "./PanelFooter.css";

interface PanelFooterProps {
  // Gem Panel
  gemPanelVisible: boolean;
  onToggleGemPanel: () => void;
  hasGemData: boolean;

  // Notes Panel
  notesPanelVisible: boolean;
  onToggleNotesPanel: () => void;
  hasNotesData: boolean;

  // Rewards Panel
  rewardsPanelVisible: boolean;
  onToggleRewardsPanel: () => void;
  hasRewardsData: boolean;

  // Regex Builder Panel
  regexBuilderVisible: boolean;
  onToggleRegexBuilder: () => void;

  // Item Check Panel
  itemCheckVisible: boolean;
  onToggleItemCheck: () => void;
  hasItemCheckData: boolean;

  // Global state
  settingsOpen: boolean;
}

export const PanelFooter: React.FC<PanelFooterProps> = ({
  gemPanelVisible,
  onToggleGemPanel,
  hasGemData,
  notesPanelVisible,
  onToggleNotesPanel,
  hasNotesData,
  rewardsPanelVisible,
  onToggleRewardsPanel,
  hasRewardsData,
  regexBuilderVisible,
  onToggleRegexBuilder,
  itemCheckVisible,
  onToggleItemCheck,
  hasItemCheckData,
  settingsOpen,
}) => {
  // Hide footer when any full-screen panel is open
  const anyPanelOpen = gemPanelVisible || notesPanelVisible || rewardsPanelVisible || regexBuilderVisible || itemCheckVisible;

  return (
    <div className={`panel-footer ${settingsOpen ? "settings-open" : ""} ${anyPanelOpen ? "hidden" : ""}`}>
      {/* Gem Panel Toggle */}
      {hasGemData && (
        <div className={`panel-toggle gem-toggle ${gemPanelVisible ? "panel-open" : ""}`}>
          <button
            className="panel-toggle-btn"
            onClick={onToggleGemPanel}
            title={gemPanelVisible ? "Hide Gem Progression" : "Show Gem Progression"}
          >
            <span className="toggle-icon">{gemPanelVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Gems</span>
          </button>
        </div>
      )}

      {/* Notes Panel Toggle */}
      {hasNotesData && (
        <div className={`panel-toggle notes-toggle ${notesPanelVisible ? "panel-open" : ""}`}>
          <button
            className="panel-toggle-btn"
            onClick={onToggleNotesPanel}
            title={notesPanelVisible ? "Hide Notes" : "Show Notes"}
          >
            <span className="toggle-icon">{notesPanelVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Notes</span>
          </button>
        </div>
      )}

      {/* Rewards Panel Toggle */}
      {hasRewardsData && (
        <div className={`panel-toggle rewards-toggle ${rewardsPanelVisible ? "panel-open" : ""}`}>
          <button
            className="panel-toggle-btn"
            onClick={onToggleRewardsPanel}
            title={rewardsPanelVisible ? "Hide Rewards Tracker" : "Show Rewards Tracker"}
          >
            <span className="toggle-icon">★</span>
            <span className="toggle-text">Rewards</span>
          </button>
        </div>
      )}

      {/* Regex Builder Toggle */}
      <div className={`panel-toggle regex-toggle ${regexBuilderVisible ? "panel-open" : ""}`}>
        <button
          className="panel-toggle-btn"
          onClick={onToggleRegexBuilder}
          title={regexBuilderVisible ? "Hide Regex Builder" : "Show Regex Builder"}
        >
          <span className="toggle-icon">{regexBuilderVisible ? "▼" : "▲"}</span>
          <span className="toggle-text">Regex</span>
        </button>
      </div>

      {/* Item Check Toggle */}
      {hasItemCheckData && (
        <div className={`panel-toggle item-check-toggle ${itemCheckVisible ? "panel-open" : ""}`}>
          <button
            className="panel-toggle-btn"
            onClick={onToggleItemCheck}
            title={itemCheckVisible ? "Hide Item Checker" : "Show Item Checker"}
          >
            <span className="toggle-icon">{itemCheckVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Items</span>
          </button>
        </div>
      )}
    </div>
  );
};