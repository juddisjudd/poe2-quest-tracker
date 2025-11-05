import React, { useMemo } from "react";
import { NotesData } from "../types";
import { parsePOBColorCodes } from "../utils/pobColorParser";
import "./NotesPanel.css";

interface NotesPanelProps {
  notesData: NotesData;
  isVisible: boolean;
  settingsOpen: boolean;
  onUpdateNotes: (notes: NotesData) => Promise<void>;
  onTogglePanel: () => void;
  showToggleButton?: boolean;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notesData,
  isVisible,
  settingsOpen,
  onUpdateNotes,
  onTogglePanel,
  showToggleButton = true,
}) => {
  // Parse POB notes with color codes
  const parsedPobNotes = useMemo(() => {
    if (!notesData.pobNotes) return null;
    return parsePOBColorCodes(notesData.pobNotes);
  }, [notesData.pobNotes]);

  const clearPobNotes = async () => {
    await onUpdateNotes({
      ...notesData,
      pobNotes: undefined
    });
  };

  return (
    <>
      {/* Toggle Button - positioned at bottom */}
      {showToggleButton && (
        <div className={`notes-panel-toggle ${isVisible ? "panel-open" : ""} ${settingsOpen ? "settings-open" : ""}`}>
          <button
            className="notes-toggle-btn"
            onClick={onTogglePanel}
            title={isVisible ? "Hide Notes" : "Show Notes"}
          >
            <span className="toggle-icon">{isVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Notes</span>
          </button>
        </div>
      )}

      {/* Notes Panel - slides up from bottom */}
      <div className={`notes-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="notes-panel-header">
          <h3>Notes</h3>
          <div className="notes-panel-controls">
            <button
              className="control-btn close-btn"
              onClick={onTogglePanel}
              title="Close Notes Panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="notes-panel-content">
          {/* POB Notes Display */}
          <div className="notes-section">
            <div className="pob-notes-display">
              <div className="pob-notes-header">
                <label>Path of Building Notes</label>
                {notesData.pobNotes && (
                  <button
                    className="clear-button"
                    onClick={clearPobNotes}
                    title="Clear POB notes"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div
                className="pob-notes-content"
                dangerouslySetInnerHTML={{
                  __html: parsedPobNotes || "No notes imported yet. Import your Path of Building code from the settings panel to view leveling notes here."
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};