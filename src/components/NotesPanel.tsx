import React from "react";
import { NotesData } from "../types";
import "./NotesPanel.css";

interface NotesPanelProps {
  notesData: NotesData;
  isVisible: boolean;
  settingsOpen: boolean;
  onUpdateNotes: (notes: NotesData) => void;
  onTogglePanel: () => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notesData,
  isVisible,
  settingsOpen,
  onUpdateNotes,
  onTogglePanel,
}) => {
  const handleUserNotesChange = (value: string) => {
    onUpdateNotes({
      ...notesData,
      userNotes: value
    });
  };

  const clearPobNotes = () => {
    onUpdateNotes({
      ...notesData,
      pobNotes: undefined
    });
  };

  return (
    <>
      {/* Toggle Button - positioned at bottom */}
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

      {/* Notes Panel - slides up from bottom */}
      <div className={`notes-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="notes-panel-header">
          <h3>Notes</h3>
          <div className="notes-panel-controls">
            <button
              className="notes-panel-close"
              onClick={onTogglePanel}
              title="Close Notes Panel"
            >
              ×
            </button>
          </div>
        </div>

        <div className="notes-panel-content">
          {/* POB Notes Display - only show if notes exist */}
          {notesData.pobNotes && (
            <div className="notes-section">
              <h4>Notes from Path of Building Import</h4>
              <div className="pob-notes-display">
                <div className="pob-notes-header">
                  <label>Imported Notes</label>
                  <button
                    className="clear-button"
                    onClick={clearPobNotes}
                    title="Clear POB notes"
                  >
                    Clear
                  </button>
                </div>
                <div className="pob-notes-content">
                  {notesData.pobNotes}
                </div>
              </div>
            </div>
          )}

          {/* Manual Notes Section */}
          <div className="notes-section">
            <h4>Manual Notes</h4>
            <div className="manual-notes-group">
              <label className="notes-label">Your Notes</label>
              <textarea
                className="notes-textarea"
                value={notesData.userNotes || ""}
                onChange={(e) => handleUserNotesChange(e.target.value)}
                placeholder="Enter your notes here... (To import POB notes, use the import function in settings)"
                rows={notesData.pobNotes ? 8 : 12}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};