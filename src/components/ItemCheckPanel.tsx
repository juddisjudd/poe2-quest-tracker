import React, { useState } from "react";
import { ItemData, ItemMatchResult } from "../types";
import { parseItemFromText, calculateItemMatch, getMatchColor } from "../utils/itemParser";
import "./ItemCheckPanel.css";

interface ItemCheckPanelProps {
  isVisible: boolean;
  settingsOpen: boolean;
  onTogglePanel: () => void;
  pobItems: ItemData[]; // Items from POB loadouts
}

export const ItemCheckPanel: React.FC<ItemCheckPanelProps> = ({
  isVisible,
  settingsOpen,
  onTogglePanel,
  pobItems
}) => {
  const [itemText, setItemText] = useState("");
  const [matchResults, setMatchResults] = useState<ItemMatchResult[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<ItemMatchResult | null>(null);
  const [pastedItem, setPastedItem] = useState<ItemData | null>(null);

  const handleCheckItem = () => {
    if (!itemText.trim()) {
      setMatchResults([]);
      setSelectedMatch(null);
      setPastedItem(null);
      return;
    }

    // Parse the pasted item
    const parsedItem = parseItemFromText(itemText);
    if (!parsedItem) {
      alert("Could not parse item. Please make sure you've copied the full item text from the game.");
      return;
    }

    setPastedItem(parsedItem);

    // Filter POB items by matching item class
    const matchingClassItems = pobItems.filter(
      pobItem => pobItem.itemClass === parsedItem.itemClass
    );

    if (matchingClassItems.length === 0) {
      setMatchResults([]);
      setSelectedMatch(null);
      return;
    }

    // Calculate match percentage for each POB item
    const results: ItemMatchResult[] = matchingClassItems.map(pobItem => {
      const { matchPercentage, details } = calculateItemMatch(parsedItem, pobItem);
      return {
        loadoutName: pobItem.loadoutName || "Unknown Loadout",
        pobItem,
        matchPercentage,
        matchColor: getMatchColor(matchPercentage),
        details
      };
    });

    // Sort by match percentage (highest first)
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);

    setMatchResults(results);
    setSelectedMatch(results.length > 0 ? results[0] : null);
  };

  const handleClear = () => {
    setItemText("");
    setMatchResults([]);
    setSelectedMatch(null);
    setPastedItem(null);
  };

  return (
    <div className={`item-check-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="item-check-header">
          <h3>Item Checker</h3>
          <button
            className="control-btn close-btn"
            onClick={onTogglePanel}
            title="Close Item Checker"
          >
            ×
          </button>
        </div>

        <div className="item-check-content">
          {/* Input Section */}
          <div className="item-input-section">
            <label>Paste Item Text</label>
            <textarea
              className="item-text-input"
              placeholder="Copy an item from the game and paste it here..."
              value={itemText}
              onChange={(e) => setItemText(e.target.value)}
              rows={10}
            />
            <div className="item-input-actions">
              <button className="item-action-btn primary" onClick={handleCheckItem}>
                Check Item
              </button>
              <button className="item-action-btn" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>

          {/* No POB Items Message */}
          {pobItems.length === 0 && (
            <div className="item-check-message">
              <p>No POB items loaded. Import a Path of Building code to compare items.</p>
            </div>
          )}

          {/* Match Results */}
          {matchResults.length > 0 && pastedItem && (
            <>
              <div className="match-results-section">
                <h4>Matching Loadouts ({matchResults.length})</h4>
                <div className="match-results-list">
                  {matchResults.map((result, index) => (
                    <div
                      key={index}
                      className={`match-result-item ${selectedMatch === result ? "selected" : ""}`}
                      onClick={() => setSelectedMatch(result)}
                    >
                      <div className="match-result-info">
                        <div className="match-loadout-name">{result.loadoutName}</div>
                        <div className="match-slot-name">{result.pobItem.slot}</div>
                      </div>
                      <div
                        className="match-percentage"
                        style={{ color: result.matchColor }}
                      >
                        {result.matchPercentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Comparison */}
              {selectedMatch && (
                <div className="item-comparison-section">
                  <h4>Detailed Comparison</h4>

                  {/* Match Summary */}
                  <div className="match-summary">
                    <div className="summary-item">
                      <span className="summary-label">Item Type:</span>
                      <span className={`summary-value ${selectedMatch.details.itemTypeMatch ? "match" : "no-match"}`}>
                        {selectedMatch.details.itemTypeMatch ? "✓ Match" : "✗ Different"}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Rarity:</span>
                      <span className={`summary-value ${selectedMatch.details.rarityMatch ? "match" : "no-match"}`}>
                        {selectedMatch.details.rarityMatch ? "✓ Match" : "✗ Different"}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Implicit Mods:</span>
                      <span className="summary-value">
                        {selectedMatch.details.implicitMatches} / {selectedMatch.details.totalImplicits}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Explicit Mods:</span>
                      <span className="summary-value">
                        {selectedMatch.details.explicitMatches} / {selectedMatch.details.totalExplicits}
                      </span>
                    </div>
                  </div>

                  {/* Side-by-side Comparison */}
                  <div className="item-mod-comparison">
                    <div className="comparison-column">
                      <h5>Your Item</h5>
                      <div className="item-details">
                        <div className="item-name">{pastedItem.name}</div>
                        <div className="item-type">{pastedItem.itemType}</div>
                        <div className="item-rarity">{pastedItem.rarity}</div>

                        {/* Enchant Mods */}
                        {pastedItem.enchant.length > 0 && (
                          <div className="mod-section">
                            <div className="mod-section-title">Enchant</div>
                            {pastedItem.enchant.map((mod, i) => (
                              <div key={i} className="mod-line enchant">{mod.text}</div>
                            ))}
                          </div>
                        )}

                        {/* Implicit Mods */}
                        {pastedItem.implicit.length > 0 && (
                          <div className="mod-section">
                            <div className="mod-section-title">Implicit</div>
                            {pastedItem.implicit.map((mod, i) => {
                              const hasMatch = selectedMatch.pobItem.implicit.some(
                                pobMod => normalizeModText(pobMod.text) === normalizeModText(mod.text)
                              );
                              return (
                                <div key={i} className={`mod-line implicit ${hasMatch ? "match" : "no-match"}`}>
                                  {hasMatch ? "✓ " : "✗ "}{mod.text}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Explicit Mods */}
                        {pastedItem.explicit.length > 0 && (
                          <div className="mod-section">
                            <div className="mod-section-title">Explicit</div>
                            {pastedItem.explicit.map((mod, i) => {
                              const hasMatch = selectedMatch.pobItem.explicit.some(
                                pobMod => normalizeModText(pobMod.text) === normalizeModText(mod.text)
                              );
                              return (
                                <div key={i} className={`mod-line explicit ${hasMatch ? "match" : "no-match"}`}>
                                  {hasMatch ? "✓ " : "✗ "}{mod.text}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="comparison-column">
                      <h5>POB Item ({selectedMatch.loadoutName})</h5>
                      <div className="item-details">
                        <div className="item-name">{selectedMatch.pobItem.name}</div>
                        <div className="item-type">{selectedMatch.pobItem.itemType}</div>
                        <div className="item-rarity">{selectedMatch.pobItem.rarity}</div>

                        {/* Enchant Mods */}
                        {selectedMatch.pobItem.enchant.length > 0 && (
                          <div className="mod-section">
                            <div className="mod-section-title">Enchant</div>
                            {selectedMatch.pobItem.enchant.map((mod, i) => (
                              <div key={i} className="mod-line enchant">{mod.text}</div>
                            ))}
                          </div>
                        )}

                        {/* Implicit Mods */}
                        {selectedMatch.pobItem.implicit.length > 0 && (
                          <div className="mod-section">
                            <div className="mod-section-title">Implicit</div>
                            {selectedMatch.pobItem.implicit.map((mod, i) => {
                              const hasMatch = pastedItem.implicit.some(
                                pastedMod => normalizeModText(pastedMod.text) === normalizeModText(mod.text)
                              );
                              return (
                                <div key={i} className={`mod-line implicit ${hasMatch ? "match" : "pob-only"}`}>
                                  {hasMatch ? "✓ " : "○ "}{mod.text}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Explicit Mods */}
                        {selectedMatch.pobItem.explicit.length > 0 && (
                          <div className="mod-section">
                            <div className="mod-section-title">Explicit</div>
                            {selectedMatch.pobItem.explicit.map((mod, i) => {
                              const hasMatch = pastedItem.explicit.some(
                                pastedMod => normalizeModText(pastedMod.text) === normalizeModText(mod.text)
                              );
                              return (
                                <div key={i} className={`mod-line explicit ${hasMatch ? "match" : "pob-only"}`}>
                                  {hasMatch ? "✓ " : "○ "}{mod.text}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* No Matches Message */}
          {matchResults.length === 0 && pastedItem && pobItems.length > 0 && (
            <div className="item-check-message">
              <p>No matching items found in your POB loadouts for {pastedItem.itemClass}.</p>
            </div>
          )}
        </div>
      </div>
  );
};

// Helper function to normalize mod text for comparison (removes numbers)
function normalizeModText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\+?\d+(\.\d+)?/g, 'X')
    .replace(/\s+/g, ' ')
    .trim();
}
