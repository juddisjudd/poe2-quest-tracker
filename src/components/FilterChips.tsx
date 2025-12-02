import React from "react";
import { QuestTag } from "../types";
import "./FilterChips.css";

interface FilterChipsProps {
  activeFilters: QuestTag[];
  onFilterToggle: (tag: QuestTag) => void;
  questCounts: Record<QuestTag, number>;
}

const TAG_COLORS: Record<QuestTag, [number, number, number]> = {
  "Spirit": [147, 112, 219],
  "Resistance": [100, 149, 237],
  "Life": [220, 53, 69],
  "Mana": [52, 152, 219],
  "Gem": [46, 204, 113],
  "Passive Skill": [241, 196, 15],
  "Boss": [231, 76, 60],
  "Trial": [155, 89, 182],
  "Waypoint": [52, 152, 219],
  "Ritual": [142, 68, 173],
  "Breach": [192, 57, 43],
  "Expedition": [211, 84, 0],
  "Delirium": [44, 62, 80],
  "Essence": [39, 174, 96],
  "Optional": [149, 165, 166],
};

const getChipStyle = (tag: QuestTag, selected: boolean) => {
  const [r, g, b] = TAG_COLORS[tag];
  // Selected = bright/active, unselected = dim/off
  const background = selected
    ? `rgba(${r}, ${g}, ${b}, 0.9)`
    : `rgba(${r}, ${g}, ${b}, 0.15)`;
  const border = selected
    ? `1px solid rgba(${r}, ${g}, ${b}, 0.9)`
    : `1px solid rgba(${r}, ${g}, ${b}, 0.3)`;

  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const color = selected ? (luma > 180 ? "#000" : "#fff") : `rgba(${r}, ${g}, ${b}, 0.6)`;

  return { background, border, color, opacity: selected ? 1 : 0.7 };
};

export const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilters,
  onFilterToggle,
  questCounts,
}) => {
  const availableTags = (Object.keys(TAG_COLORS) as QuestTag[]).filter(
    tag => questCounts[tag] > 0
  );

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="filter-chips-container">
      <div className="filter-chips">
        {availableTags.map((tag) => {
          const isSelected = activeFilters.includes(tag);
          const style = getChipStyle(tag, isSelected);
          const count = questCounts[tag];

          return (
            <button
              key={tag}
              className={`filter-chip ${isSelected ? "selected" : ""}`}
              style={style}
              onClick={() => onFilterToggle(tag)}
              title={isSelected ? `Hide ${tag} quests` : `Show only ${tag} quests (${count})`}
            >
              {tag} <span className="chip-count">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
