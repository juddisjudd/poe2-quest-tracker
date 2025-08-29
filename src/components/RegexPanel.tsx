import React, { useState } from "react";
import { RegexFilters } from "../types";
import "./RegexPanel.css";

interface RegexPanelProps {
  regexFilters: RegexFilters;
  isVisible: boolean;
  settingsOpen: boolean;
  onUpdateFilters: (filters: RegexFilters) => void;
  onTogglePanel: () => void;
}

export const RegexPanel: React.FC<RegexPanelProps> = ({
  regexFilters,
  isVisible,
  settingsOpen,
  onUpdateFilters,
  onTogglePanel,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000); // Clear feedback after 2 seconds
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleVendorChange = (category: keyof RegexFilters['vendor'], value: string) => {
    onUpdateFilters({
      ...regexFilters,
      vendor: {
        ...regexFilters.vendor,
        [category]: value
      }
    });
  };

  const handleGeneralChange = (category: 'waystones' | 'tablets' | 'relics', value: string) => {
    onUpdateFilters({
      ...regexFilters,
      [category]: value
    });
  };

  const renderRegexInput = (
    label: string, 
    value: string, 
    onChange: (value: string) => void
  ) => {
    const fieldId = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const isCopied = copiedField === fieldId;
    
    return (
      <div className="regex-input-group">
        <label className="regex-label">{label}</label>
        <div className="regex-input-wrapper">
          <input
            type="text"
            className="regex-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter regex for ${label.toLowerCase()}...`}
          />
          <button
            className={`copy-button-inline ${isCopied ? 'copied' : ''}`}
            onClick={() => handleCopy(value, fieldId)}
            disabled={!value.trim()}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
          >
            {isCopied ? '✓' : '📋'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Toggle Button - positioned at bottom */}
      <div className={`regex-panel-toggle ${isVisible ? "panel-open" : ""} ${settingsOpen ? "settings-open" : ""}`}>
        <button
          className="regex-toggle-btn"
          onClick={onTogglePanel}
          title={isVisible ? "Hide Regex Filters" : "Show Regex Filters"}
        >
          <span className="toggle-icon">{isVisible ? "▼" : "▲"}</span>
          <span className="toggle-text">Regex</span>
        </button>
      </div>

      {/* Regex Panel - slides up from bottom */}
      <div className={`regex-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="regex-panel-header">
          <h3>Regex Filters</h3>
          <div className="regex-panel-controls">
            <button
              className="control-btn close-btn"
              onClick={onTogglePanel}
              title="Close Regex Panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="regex-panel-content">
          <div className="regex-section">
            <h4>Vendor Items</h4>
            <div className="regex-inputs">
              {renderRegexInput('Weapons', regexFilters.vendor.weapons, (value) => handleVendorChange('weapons', value))}
              {renderRegexInput('Body Armour', regexFilters.vendor.body, (value) => handleVendorChange('body', value))}
              {renderRegexInput('Shields/Offhand', regexFilters.vendor.offhandShields, (value) => handleVendorChange('offhandShields', value))}
              {renderRegexInput('Belt', regexFilters.vendor.belt, (value) => handleVendorChange('belt', value))}
              {renderRegexInput('Boots', regexFilters.vendor.boots, (value) => handleVendorChange('boots', value))}
              {renderRegexInput('Gloves', regexFilters.vendor.gloves, (value) => handleVendorChange('gloves', value))}
              {renderRegexInput('Rings', regexFilters.vendor.ring, (value) => handleVendorChange('ring', value))}
              {renderRegexInput('Amulets', regexFilters.vendor.amulet, (value) => handleVendorChange('amulet', value))}
            </div>
          </div>

          <div className="regex-section">
            <h4>Other Items</h4>
            <div className="regex-inputs">
              {renderRegexInput('Waystones', regexFilters.waystones, (value) => handleGeneralChange('waystones', value))}
              {renderRegexInput('Tablets', regexFilters.tablets, (value) => handleGeneralChange('tablets', value))}
              {renderRegexInput('Relics', regexFilters.relics, (value) => handleGeneralChange('relics', value))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};