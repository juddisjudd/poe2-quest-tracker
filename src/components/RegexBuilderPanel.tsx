import React, { useState, useMemo } from "react";
import "./RegexBuilderPanel.css";
import vendorItemsData from "../data/regex-patterns/vendor-items.json";
import waystoneModsData from "../data/regex-patterns/waystone-mods.json";
import { optimizePattern } from "../utils/regexOptimizer";

type RegexBuilderType = "vendor" | "waystone" | "tablet" | "relic";
type RegexLogicMode = "or" | "and";

interface ModOption {
  id: string;
  name: string;
  category: string;
  regex: string;
  isPositive?: boolean; // true = want this mod, false = avoid this mod
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly';
  rewardImpact?: 'none' | 'low' | 'medium' | 'high';
}

interface RegexBuilderPanelProps {
  isVisible: boolean;
  settingsOpen: boolean;
  onTogglePanel: () => void;
  showToggleButton?: boolean;
}

// Vendor/Stash Item Data - Loaded from JSON
const VENDOR_ITEMS: ModOption[] = vendorItemsData.items as ModOption[];

// Waystone Mods Data - Loaded from JSON with enhanced difficulty/reward ratings
const WAYSTONE_MODS: ModOption[] = waystoneModsData.mods as ModOption[];

// Tablet Types Data
const TABLET_TYPES: ModOption[] = [
  { id: "breach", name: "Breach", category: "Tablet Types", regex: "Breach", isPositive: true },
  { id: "delirium", name: "Delirium", category: "Tablet Types", regex: "Delirium", isPositive: true },
  { id: "irradiated", name: "Irradiated", category: "Tablet Types", regex: "Irradiated", isPositive: true },
  { id: "expedition", name: "Expedition", category: "Tablet Types", regex: "Expedition", isPositive: true },
  { id: "ritual", name: "Ritual", category: "Tablet Types", regex: "Ritual", isPositive: true },
  { id: "overseer", name: "Overseer", category: "Tablet Types", regex: "Overseer", isPositive: true },

  // Rarity
  { id: "magic", name: "Magic", category: "Rarity", regex: "Magic", isPositive: true },
  { id: "normal", name: "Normal", category: "Rarity", regex: "Normal", isPositive: true },
];

// Relic Mods Data (from poe2.re - Sanctum Trial)
const RELIC_MODS: ModOption[] = [
  // Prefixes - Combat
  { id: "boss_reduced_damage", name: "Bosses Deal Reduced Damage", category: "Combat", regex: "es d", isPositive: true },
  { id: "boss_increased_damage_taken", name: "Bosses Take Increased Damage", category: "Combat", regex: "ses t", isPositive: true },
  { id: "monster_reduced_damage", name: "Monsters Deal Reduced Damage", category: "Combat", regex: "^monsters d", isPositive: true },
  { id: "monster_increased_damage_taken", name: "Monsters Take Increased Damage", category: "Combat", regex: "^monsters t", isPositive: true },
  { id: "monster_reduced_speed", name: "Monsters Reduced Attack/Cast/Movement Speed", category: "Combat", regex: ",", isPositive: true },
  { id: "rare_reduced_damage", name: "Rare Monsters Deal Reduced Damage", category: "Combat", regex: "e monsters d", isPositive: true },
  { id: "rare_increased_damage_taken", name: "Rare Monsters Take Increased Damage", category: "Combat", regex: "e monsters t", isPositive: true },
  { id: "trap_reduced_damage", name: "Traps Deal Reduced Damage", category: "Combat", regex: "ps", isPositive: true },

  // Prefixes - Defences
  { id: "increased_defences", name: "Increased Defences", category: "Defences", regex: "def", isPositive: true },
  { id: "increased_max_life", name: "Increased Maximum Life", category: "Defences", regex: "lif", isPositive: true },
  { id: "increased_movement", name: "Increased Movement Speed", category: "Defences", regex: "ed mo", isPositive: true },

  // Prefixes - Honour
  { id: "chance_save", name: "Chance to Save with 1 Honour", category: "Honour", regex: "we", isPositive: true },
  { id: "increased_honour", name: "Increased Honour Restored", category: "Honour", regex: "ored", isPositive: true },
  { id: "increased_max_honour", name: "Increased Maximum Honour", category: "Honour", regex: "m honour$", isPositive: true },
  { id: "sacred_water_start", name: "Sacred Water at Trial Start", category: "Honour", regex: "ial$", isPositive: true },

  // Prefixes - Rewards
  { id: "upgrade_keys", name: "Chance for Keys to Upgrade", category: "Rewards", regex: "eac", isPositive: true },
  { id: "additional_merchant_choice", name: "Additional Merchant Choice", category: "Rewards", regex: "cho", isPositive: true },
  { id: "gain_additional_key", name: "Chance to Gain Additional Key", category: "Rewards", regex: "^w", isPositive: true },

  // Suffixes - Map & Navigation
  { id: "additional_rooms_revealed", name: "Additional Rooms Revealed", category: "Navigation", regex: "ms", isPositive: true },
  { id: "one_room_revealed", name: "One Additional Room Revealed", category: "Navigation", regex: "m i", isPositive: true },

  // Suffixes - Drops & Loot
  { id: "increased_keys", name: "Increased Key Drops", category: "Loot", regex: "f k", isPositive: true },
  { id: "increased_relics", name: "Increased Relic Drops", category: "Loot", regex: "cs d", isPositive: true },
  { id: "reduced_prices", name: "Reduced Merchant Prices", category: "Loot", regex: "pr", isPositive: true },

  // Suffixes - Survivability
  { id: "avoid_affliction", name: "Chance to Avoid Affliction", category: "Survivability", regex: "vo", isPositive: true },
  { id: "reduced_slow", name: "Reduced Slowing Potency", category: "Survivability", regex: "sl", isPositive: true },
  { id: "honour_resistance", name: "Honour Resistance", category: "Survivability", regex: "o ho", isPositive: true },
  { id: "max_honour_resistance", name: "Maximum Honour Resistance", category: "Survivability", regex: "o m", isPositive: true },
  { id: "dodge_distance", name: "Dodge Roll Distance", category: "Survivability", regex: "od", isPositive: true },
  { id: "reduced_crit_damage", name: "Reduced Critical Damage Taken", category: "Survivability", regex: "ts", isPositive: true },

  // Suffixes - Sacred Water
  { id: "fountain_double_water", name: "Fountains Double Sacred Water", category: "Sacred Water", regex: "^f", isPositive: true },
  { id: "water_on_room", name: "Sacred Water on Room Completion", category: "Sacred Water", regex: "ete", isPositive: true },
  { id: "monster_double_water", name: "Monsters Drop Double Sacred Water", category: "Sacred Water", regex: "p d", isPositive: true },

  // Suffixes - Honour Restoration
  { id: "honour_on_boss", name: "Restore Honour on Boss Kill", category: "Honour Restore", regex: "kil", isPositive: true },
  { id: "honour_on_key", name: "Restore Honour on Key Pickup", category: "Honour Restore", regex: "ick", isPositive: true },
  { id: "honour_on_room", name: "Restore Honour on Room Completion", category: "Honour Restore", regex: "etio", isPositive: true },
  { id: "honour_on_shrine", name: "Restore Honour on Shrine Veneration", category: "Honour Restore", regex: "hr", isPositive: true },
];

export const RegexBuilderPanel: React.FC<RegexBuilderPanelProps> = ({
  isVisible,
  settingsOpen,
  onTogglePanel,
  showToggleButton = true,
}) => {
  const [builderType, setBuilderType] = useState<RegexBuilderType>("vendor");
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "positive" | "negative">("all");
  const [copySuccess, setCopySuccess] = useState(false);
  const [logicMode, setLogicMode] = useState<RegexLogicMode>("or");
  const [useOptimized, setUseOptimized] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Get current data source based on active builder type
  const currentMods = useMemo(() => {
    switch (builderType) {
      case "vendor":
        return VENDOR_ITEMS;
      case "waystone":
        return WAYSTONE_MODS;
      case "tablet":
        return TABLET_TYPES;
      case "relic":
        return RELIC_MODS;
      default:
        return VENDOR_ITEMS;
    }
  }, [builderType]);

  // Get unique categories from current data source
  const CATEGORIES = useMemo(() => {
    const categories = new Set<string>();
    currentMods.forEach(mod => categories.add(mod.category));
    return Array.from(categories).sort();
  }, [currentMods]);

  // Group mods by category
  const modsByCategory = useMemo(() => {
    const grouped = new Map<string, ModOption[]>();

    currentMods.forEach(mod => {
      // Apply search and type filters
      const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" ||
        (filterType === "positive" && mod.isPositive) ||
        (filterType === "negative" && !mod.isPositive);

      if (!matchesSearch || !matchesType) return;

      if (!grouped.has(mod.category)) {
        grouped.set(mod.category, []);
      }
      grouped.get(mod.category)!.push(mod);
    });

    return grouped;
  }, [currentMods, searchTerm, filterType]);

  // Generate regex from selected mods
  const generatedRegex = useMemo(() => {
    if (selectedMods.size === 0) return "";

    const regexParts = Array.from(selectedMods)
      .map(id => currentMods.find(mod => mod.id === id))
      .filter(mod => mod !== undefined)
      .map(mod => mod!.regex);

    if (regexParts.length === 0) return "";

    let pattern = "";

    // Single pattern - wrap in quotes
    if (regexParts.length === 1) {
      pattern = `"${regexParts[0]}"`;
    } else if (logicMode === "or") {
      // OR logic: Match items with ANY of the selected mods
      // Wrap the entire pattern in quotes
      pattern = `"(${regexParts.join("|")})"`;
    } else {
      // AND logic: POE2 supports space-separated patterns for AND matching
      // Example: "cold.*res" "lightning.*res" matches items with BOTH
      pattern = regexParts.map(p => `"${p}"`).join(" ");
    }

    // Apply optimization if enabled and pattern is too long
    if (useOptimized && pattern.length > 45) {
      const optimized = optimizePattern(pattern, 45);
      return optimized.pattern;
    }

    return pattern;
  }, [currentMods, selectedMods, logicMode, useOptimized]);

  // Calculate optimization info
  const optimizationInfo = useMemo(() => {
    if (selectedMods.size === 0) return null;

    const regexParts = Array.from(selectedMods)
      .map(id => currentMods.find(mod => mod.id === id))
      .filter(mod => mod !== undefined)
      .map(mod => mod!.regex);

    if (regexParts.length === 0) return null;

    let pattern = "";
    if (regexParts.length === 1) {
      pattern = `"${regexParts[0]}"`;
    } else if (logicMode === "or") {
      pattern = `"(${regexParts.join("|")})"`;
    } else {
      pattern = regexParts.map(p => `"${p}"`).join(" ");
    }

    if (pattern.length <= 45) return null;

    return optimizePattern(pattern, 45);
  }, [currentMods, selectedMods, logicMode]);

  const toggleMod = (modId: string) => {
    setSelectedMods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modId)) {
        newSet.delete(modId);
      } else {
        newSet.add(modId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedMods(new Set());
  };

  const selectAllVisible = () => {
    const visibleIds: string[] = [];
    modsByCategory.forEach(mods => {
      mods.forEach(mod => visibleIds.push(mod.id));
    });
    setSelectedMods(new Set(visibleIds));
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const copyToClipboard = async () => {
    if (!generatedRegex) return;

    try {
      await navigator.clipboard.writeText(generatedRegex);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      {showToggleButton && (
        <div className={`regex-builder-toggle ${isVisible ? "panel-open" : ""} ${settingsOpen ? "settings-open" : ""}`}>
          <button
            className="regex-toggle-btn"
            onClick={onTogglePanel}
            title={isVisible ? "Hide Regex Builder" : "Show Regex Builder"}
          >
            <span className="toggle-icon">{isVisible ? "▼" : "▲"}</span>
            <span className="toggle-text">Regex Builder</span>
          </button>
        </div>
      )}

      {/* Regex Builder Panel */}
      <div className={`regex-builder-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="regex-builder-header">
          <h3>Regex Builder</h3>
          <button
            className="control-btn close-btn"
            onClick={onTogglePanel}
            title="Close Regex Builder"
          >
            ×
          </button>
        </div>

        {/* Builder Type Tabs */}
        <div className="regex-builder-tabs">
          <button
            className={`regex-builder-tab ${builderType === "vendor" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("vendor");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            Vendor/Stash
          </button>
          <button
            className={`regex-builder-tab ${builderType === "waystone" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("waystone");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            Waystones
          </button>
          <button
            className={`regex-builder-tab ${builderType === "tablet" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("tablet");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            Tablets
          </button>
          <button
            className={`regex-builder-tab ${builderType === "relic" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("relic");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            Relics
          </button>
        </div>

        <div className="regex-builder-content">
          {/* Toolbar */}
          <div className="regex-toolbar">
            <input
              type="text"
              className="regex-search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {builderType !== "vendor" && (
              <div className="regex-type-filters">
                <button
                  className={`type-filter-btn ${filterType === "all" ? "active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  All
                </button>
                <button
                  className={`type-filter-btn ${filterType === "positive" ? "active" : ""}`}
                  onClick={() => setFilterType("positive")}
                >
                  Want
                </button>
                <button
                  className={`type-filter-btn ${filterType === "negative" ? "active" : ""}`}
                  onClick={() => setFilterType("negative")}
                >
                  Avoid
                </button>
              </div>
            )}
            <button className="regex-action-btn-sm" onClick={clearSelection}>
              Clear ({selectedMods.size})
            </button>
          </div>

          {/* Two Column Selection Area */}
          <div className="regex-selection-columns">
            {(() => {
              const categories = Array.from(modsByCategory.entries());
              const midpoint = Math.ceil(categories.length / 2);
              const leftCategories = categories.slice(0, midpoint);
              const rightCategories = categories.slice(midpoint);

              return (
                <>
                  <div className="regex-column">
                    {leftCategories.map(([category, mods]) => {
                      const isCollapsed = collapsedCategories.has(category);
                      const categorySelectedCount = mods.filter(m => selectedMods.has(m.id)).length;

                      return (
                        <div key={category} className="regex-category-section">
                          <div
                            className="regex-category-header"
                            onClick={() => toggleCategory(category)}
                          >
                            <span className="category-toggle-icon">
                              {isCollapsed ? "▶" : "▼"}
                            </span>
                            <span className="category-name">{category}</span>
                            <span className="category-count">
                              {categorySelectedCount > 0 && `${categorySelectedCount}/`}{mods.length}
                            </span>
                          </div>
                          {!isCollapsed && (
                            <div className="regex-category-items">
                              {mods.map(mod => (
                                <label key={mod.id} className="regex-mod-item">
                                  <input
                                    type="checkbox"
                                    checked={selectedMods.has(mod.id)}
                                    onChange={() => toggleMod(mod.id)}
                                  />
                                  <span className={`mod-name ${mod.isPositive ? "positive" : "negative"}`}>
                                    {mod.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="regex-column">
                    {rightCategories.map(([category, mods]) => {
                      const isCollapsed = collapsedCategories.has(category);
                      const categorySelectedCount = mods.filter(m => selectedMods.has(m.id)).length;

                      return (
                        <div key={category} className="regex-category-section">
                          <div
                            className="regex-category-header"
                            onClick={() => toggleCategory(category)}
                          >
                            <span className="category-toggle-icon">
                              {isCollapsed ? "▶" : "▼"}
                            </span>
                            <span className="category-name">{category}</span>
                            <span className="category-count">
                              {categorySelectedCount > 0 && `${categorySelectedCount}/`}{mods.length}
                            </span>
                          </div>
                          {!isCollapsed && (
                            <div className="regex-category-items">
                              {mods.map(mod => (
                                <label key={mod.id} className="regex-mod-item">
                                  <input
                                    type="checkbox"
                                    checked={selectedMods.has(mod.id)}
                                    onChange={() => toggleMod(mod.id)}
                                  />
                                  <span className={`mod-name ${mod.isPositive ? "positive" : "negative"}`}>
                                    {mod.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Output Section at Bottom */}
          <div className="regex-output-bottom">
            <div className="regex-output-controls">
              <div className="regex-logic-mode-inline">
                <label>Mode:</label>
                <button
                  className={`logic-mode-btn ${logicMode === "or" ? "active" : ""}`}
                  onClick={() => setLogicMode("or")}
                >
                  OR
                </button>
                <button
                  className={`logic-mode-btn ${logicMode === "and" ? "active" : ""}`}
                  onClick={() => setLogicMode("and")}
                >
                  AND
                </button>
              </div>
              <div className="regex-output-actions">
                <span className={`regex-char-count ${generatedRegex.length > 45 ? "over-limit" : ""}`}>
                  {generatedRegex.length}/45
                </span>
                {optimizationInfo && (
                  <button
                    className={`regex-optimize-btn-sm ${useOptimized ? "active" : ""}`}
                    onClick={() => setUseOptimized(!useOptimized)}
                  >
                    {useOptimized ? "✓ Opt" : "Optimize"}
                  </button>
                )}
                <button
                  className="regex-copy-btn"
                  onClick={copyToClipboard}
                  disabled={!generatedRegex}
                >
                  {copySuccess ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div className="regex-output-display-bottom">
              {generatedRegex || "Select items to generate regex..."}
            </div>
            {generatedRegex.length > 45 && (
              <div className="regex-warning-compact">
                ⚠ Pattern exceeds 45 character limit{optimizationInfo && !useOptimized && " - click Optimize"}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
