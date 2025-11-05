import React from "react";
import { QuestTag } from "../types";
import "./FilterChips.css";

interface FilterChipsProps {
  activeFilters: QuestTag[];
  onFilterToggle: (tag: QuestTag) => void;
  questCounts: Record<QuestTag, number>;
}

// RGB color tuples for each tag type (inspired by XileHUD)
const TAG_COLORS: Record<QuestTag, [number, number, number]> = {
  "Spirit": [147, 112, 219], // Purple
  "Resistance": [100, 149, 237], // Cornflower blue
  "Life": [220, 53, 69], // Red
  "Mana": [52, 152, 219], // Blue
  "Gem": [46, 204, 113], // Green
  "Passive Skill": [241, 196, 15], // Yellow
  "Boss": [231, 76, 60], // Dark red
  "Trial": [155, 89, 182], // Purple
  "Waypoint": [52, 152, 219], // Blue
  "Ritual": [142, 68, 173], // Dark purple
  "Breach": [192, 57, 43], // Dark red
  "Expedition": [211, 84, 0], // Orange
  "Delirium": [44, 62, 80], // Dark blue-gray
  "Essence": [39, 174, 96], // Green
  "Optional": [149, 165, 166], // Gray
};

const getChipStyle = (tag: QuestTag, active: boolean) => {
  const [r, g, b] = TAG_COLORS[tag];
  const background = active
    ? `rgba(${r}, ${g}, ${b}, 0.9)`
    : `rgba(${r}, ${g}, ${b}, 0.22)`;
  const border = `1px solid rgba(${r}, ${g}, ${b}, 0.6)`;

  // Calculate luminance to determine text color
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const color = active ? (luma > 180 ? "#000" : "#fff") : "var(--text-primary)";

  return { background, border, color };
};

export const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilters,
  onFilterToggle,
  questCounts,
}) => {
  // Only show tags that have quests
  const availableTags = (Object.keys(TAG_COLORS) as QuestTag[]).filter(
    tag => questCounts[tag] > 0
  );

  if (availableTags.length === 0) {
    return null;
  }

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="filter-chips-container">
      <div className="filter-chips-header">
        <span className="filter-label">Filter by:</span>
        {hasActiveFilters && (
          <button
            className="filter-clear-btn"
            onClick={() => activeFilters.forEach(tag => onFilterToggle(tag))}
            title="Clear all filters"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="filter-chips">
        {availableTags.map((tag) => {
          const isActive = activeFilters.includes(tag);
          const style = getChipStyle(tag, isActive);
          const count = questCounts[tag];

          return (
            <button
              key={tag}
              className={`filter-chip ${isActive ? "active" : ""}`}
              style={style}
              onClick={() => onFilterToggle(tag)}
              title={`Filter by ${tag} (${count} quest${count !== 1 ? 's' : ''})`}
            >
              {tag} <span className="chip-count">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
