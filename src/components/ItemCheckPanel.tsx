import React, { useState } from "react";
import { ItemCheckData, ItemData, ItemCheckResult } from "../types";
import { parseItemFromText, checkItemAgainstPob } from "../utils/itemParser";
import "./ItemCheckPanel.css";

interface ItemCheckPanelProps {
  itemCheckData: ItemCheckData | undefined;
  isVisible: boolean;
  settingsOpen: boolean;
  onUpdateItemData: (data: ItemCheckData) => void;
  onTogglePanel: () => void;
  showToggleButton?: boolean;
}

export const ItemCheckPanel: React.FC<ItemCheckPanelProps> = ({
  itemCheckData,
  isVisible,
  settingsOpen,
  onUpdateItemData,
  onTogglePanel,
  showToggleButton = true,
}) => {
  const [itemText, setItemText] = useState('');
  const [checkResult, setCheckResult] = useState<ItemCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckItem = async () => {
    if (!itemText.trim()) return;

    setIsChecking(true);
    try {
      const parsedItem = parseItemFromText(itemText.trim());
      if (!parsedItem) {
        alert('Could not parse item. Please check the format and try again.');
        return;
      }

      const pobItems = itemCheckData?.items || [];
      if (pobItems.length === 0) {
        alert('No POB items found. Please import a Path of Building code first.');
        return;
      }

      const result = checkItemAgainstPob(parsedItem, pobItems);
      setCheckResult(result);
    } catch (error) {
      console.error('Error checking item:', error);
      alert('Error checking item. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearItem = () => {
    setItemText('');
    setCheckResult(null);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'keep': return '#4CAF50'; // Green
      case 'consider': return '#FF9800'; // Orange
      case 'vendor': return '#f44336'; // Red
      default: return '#666';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'keep': return '🔥 KEEP';
      case 'consider': return '🤔 CONSIDER';
      case 'vendor': return '💰 VENDOR';
      default: return 'UNKNOWN';
    }
  };

  return (
    <>
      {/* Toggle Button - positioned at bottom */}
      {showToggleButton && (
        <div className={`item-check-panel-toggle ${isVisible ? "panel-open" : ""} ${settingsOpen ? "settings-open" : ""}`}>
          <button
            className="item-check-toggle-btn"
            onClick={onTogglePanel}
            title={isVisible ? "Hide Item Check" : "Show Item Check"}
          >
            <span className="toggle-icon">{isVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Items</span>
          </button>
        </div>
      )}

      {/* Item Check Panel - slides up from bottom */}
      <div className={`item-check-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="item-check-panel-header">
          <h3>Item Check</h3>
          <div className="item-check-panel-controls">
            <button
              className="control-btn close-btn"
              onClick={onTogglePanel}
              title="Close Item Check Panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="item-check-panel-content">
          <div className="item-input-section">
            <label htmlFor="item-text">Paste Item Text:</label>
            <textarea
              id="item-text"
              className="item-text-input"
              value={itemText}
              onChange={(e) => setItemText(e.target.value)}
              placeholder="Copy item text from Path of Exile 2 and paste here..."
              rows={10}
            />
            <div className="item-input-controls">
              <button
                className="btn-primary"
                onClick={handleCheckItem}
                disabled={!itemText.trim() || isChecking}
              >
                {isChecking ? 'Checking...' : 'Check Item'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleClearItem}
                disabled={!itemText && !checkResult}
              >
                Clear
              </button>
            </div>
          </div>

          {checkResult && (
            <div className="item-check-results">
              <div className="checked-item-info">
                <h4>Checked Item: {checkResult.item.name}</h4>
                <div className="item-details">
                  <span className="item-class">{checkResult.item.itemClass}</span>
                  <span className="item-rarity" data-rarity={checkResult.item.rarity.toLowerCase()}>{checkResult.item.rarity}</span>
                  <span className="item-level">Level {checkResult.item.level}</span>
                </div>
              </div>

              {checkResult.bestMatch ? (
                <div className="best-match">
                  <div className="match-summary">
                    <h5>Best Match: {checkResult.bestMatch.item.baseType} <span className="loadout-badge">({checkResult.bestMatch.item.loadoutNames?.join(", ") || "Unknown Loadout"})</span></h5>
                    <div className="mod-count-display">
                      <span className="mod-count-text">
                        {checkResult.bestMatch.prefixMatches + checkResult.bestMatch.suffixMatches}/{checkResult.item.modifiers.filter(m => m.type === 'prefix' || m.type === 'suffix').length} matching mods
                      </span>
                      <span className="mod-breakdown">
                        ({checkResult.bestMatch.prefixMatches} prefixes, {checkResult.bestMatch.suffixMatches} suffixes)
                      </span>
                    </div>
                  </div>
                  <div className="match-details">
                    <div className="match-stats">
                      <div className="match-stat">
                        <span className="stat-label">Match Score:</span>
                        <span className="stat-value">{checkResult.bestMatch.score}%</span>
                      </div>
                      <div className="match-stat">
                        <span className="stat-label">Recommendation:</span>
                        <span 
                          className="stat-value recommendation-text"
                          style={{ color: getRecommendationColor(checkResult.bestMatch.recommendation) }}
                        >
                          {getRecommendationText(checkResult.bestMatch.recommendation).replace(/🔥|🤔|💰/g, '').trim()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-matches">
                  <div className="match-summary">
                    <h5>No Matching Items</h5>
                    <div className="mod-count-display">
                      <span className="mod-count-text">
                        0/{checkResult.item.modifiers.filter(m => m.type === 'prefix' || m.type === 'suffix').length} matching mods
                      </span>
                      <span className="mod-breakdown">(0 prefixes, 0 suffixes)</span>
                    </div>
                  </div>
                  <p>No items of this type found in your POB build.</p>
                </div>
              )}

              {checkResult.bestMatch?.matchingModifiers && (
                <div className="matching-modifiers">
                  <h5>Matching Modifiers:</h5>
                  
                  {checkResult.bestMatch.matchingModifiers.matchingPrefixes.length > 0 && (
                    <div className="modifier-section">
                      <h6>Prefixes ({checkResult.bestMatch.matchingModifiers.matchingPrefixes.length}):</h6>
                      <div className="modifiers-list">
                        {checkResult.bestMatch.matchingModifiers.matchingPrefixes.map((match, index) => (
                          <div key={index} className="modifier-match">
                            <div className="modifier-text source">{match.source.text}</div>
                            <div className="modifier-arrow">→</div>
                            <div className="modifier-text target">{match.target.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkResult.bestMatch.matchingModifiers.matchingSuffixes.length > 0 && (
                    <div className="modifier-section">
                      <h6>Suffixes ({checkResult.bestMatch.matchingModifiers.matchingSuffixes.length}):</h6>
                      <div className="modifiers-list">
                        {checkResult.bestMatch.matchingModifiers.matchingSuffixes.map((match, index) => (
                          <div key={index} className="modifier-match">
                            <div className="modifier-text source">{match.source.text}</div>
                            <div className="modifier-arrow">→</div>
                            <div className="modifier-text target">{match.target.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkResult.bestMatch.matchingModifiers.matchingPrefixes.length === 0 && 
                   checkResult.bestMatch.matchingModifiers.matchingSuffixes.length === 0 && (
                    <div className="no-matching-modifiers">
                      <p>No matching modifiers found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="item-check-status">
            <div className="pob-items-count">
              POB Items: {itemCheckData?.items?.length || 0}
              {!itemCheckData?.items?.length && (
                <span className="import-hint"> - Import a POB first</span>
              )}
            </div>
            <div className="scoring-disclaimer">
              <span className="disclaimer-text">
                Scoring is a "best effort" comparison. POB items may not reflect optimal values to target.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};