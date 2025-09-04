import React from "react";
import "./PanelFooter.css";

interface PanelFooterProps {
  // Gem Panel
  gemPanelVisible: boolean;
  onToggleGemPanel: () => void;
  hasGemData: boolean;
  
  // Regex Panel
  regexPanelVisible: boolean;
  onToggleRegexPanel: () => void;
  hasRegexData: boolean;
  
  // Notes Panel
  notesPanelVisible: boolean;
  onToggleNotesPanel: () => void;
  hasNotesData: boolean;
  
  // Item Check Panel
  itemCheckPanelVisible: boolean;
  onToggleItemCheckPanel: () => void;
  hasItemCheckData: boolean;
  
  // Global state
  settingsOpen: boolean;
}

export const PanelFooter: React.FC<PanelFooterProps> = ({
  gemPanelVisible,
  onToggleGemPanel,
  hasGemData,
  regexPanelVisible,
  onToggleRegexPanel,
  hasRegexData,
  notesPanelVisible,
  onToggleNotesPanel,
  hasNotesData,
  itemCheckPanelVisible,
  onToggleItemCheckPanel,
  hasItemCheckData,
  settingsOpen,
}) => {
  return (
    <div className={`panel-footer ${settingsOpen ? "settings-open" : ""}`}>
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

      {/* Regex Panel Toggle */}
      {hasRegexData && (
        <div className={`panel-toggle regex-toggle ${regexPanelVisible ? "panel-open" : ""}`}>
          <button
            className="panel-toggle-btn"
            onClick={onToggleRegexPanel}
            title={regexPanelVisible ? "Hide Regex Filters" : "Show Regex Filters"}
          >
            <span className="toggle-icon">{regexPanelVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Regex</span>
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

      {/* Item Check Panel Toggle */}
      {hasItemCheckData && (
        <div className={`panel-toggle item-check-toggle ${itemCheckPanelVisible ? "panel-open" : ""}`}>
          <button
            className="panel-toggle-btn"
            onClick={onToggleItemCheckPanel}
            title={itemCheckPanelVisible ? "Hide Item Check" : "Show Item Check"}
          >
            <span className="toggle-icon">{itemCheckPanelVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Items</span>
          </button>
        </div>
      )}
    </div>
  );
};