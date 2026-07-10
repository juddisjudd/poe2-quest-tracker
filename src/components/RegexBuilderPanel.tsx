import React, { useState, useMemo } from "react";
import "./RegexBuilderPanel.css";
import vendorItemsData from "../data/regex-patterns/vendor-items.json";
import waystoneModsData from "../data/regex-patterns/waystone-mods.json";
import { optimizePattern } from "../utils/regexOptimizer";
import { useI18n } from "../utils/i18n";

type RegexBuilderType = "vendor" | "waystone" | "tablet" | "relic";
type RegexLogicMode = "or" | "and";

interface ModOption {
  id: string;
  name: string;
  nameZh?: string;
  category: string;
  categoryZh?: string;
  regex: string;
  regexZh?: string;
  isPositive?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard' | 'deadly';
  rewardImpact?: 'none' | 'low' | 'medium' | 'high';
}

interface RegexBuilderPanelProps {
  isVisible: boolean;
  settingsOpen: boolean;
  onTogglePanel: () => void;
  showToggleButton?: boolean;
}

const VENDOR_ITEMS: ModOption[] = vendorItemsData.items as ModOption[];
const WAYSTONE_MODS: ModOption[] = waystoneModsData.mods as ModOption[];

const TABLET_TYPES: ModOption[] = [
  { id: "breach", name: "Breach", nameZh: "裂隙", category: "Tablet Types", categoryZh: "石板类型", regex: "Breach", isPositive: true },
  { id: "delirium", name: "Delirium", nameZh: "惊悸", category: "Tablet Types", categoryZh: "石板类型", regex: "Delirium", isPositive: true },
  { id: "irradiated", name: "Irradiated", nameZh: "辐照", category: "Tablet Types", categoryZh: "石板类型", regex: "Irradiated", isPositive: true },
  { id: "expedition", name: "Expedition", nameZh: "远征", category: "Tablet Types", categoryZh: "石板类型", regex: "Expedition", isPositive: true },
  { id: "ritual", name: "Ritual", nameZh: "仪式", category: "Tablet Types", categoryZh: "石板类型", regex: "Ritual", isPositive: true },
  { id: "overseer", name: "Overseer", nameZh: "监视者", category: "Tablet Types", categoryZh: "石板类型", regex: "Overseer", isPositive: true },

  { id: "magic", name: "Magic", nameZh: "魔法", category: "Rarity", categoryZh: "稀有度", regex: "Magic", isPositive: true },
  { id: "normal", name: "Normal", nameZh: "普通", category: "Rarity", categoryZh: "稀有度", regex: "Normal", isPositive: true },
];

const RELIC_MODS: ModOption[] = [
  { id: "boss_reduced_damage", name: "Bosses Deal Reduced Damage", nameZh: "首领造成的伤害降低", category: "Combat", categoryZh: "战斗", regex: "es d", isPositive: true },
  { id: "boss_increased_damage_taken", name: "Bosses Take Increased Damage", nameZh: "首领受到的伤害提高", category: "Combat", categoryZh: "战斗", regex: "ses t", isPositive: true },
  { id: "monster_reduced_damage", name: "Monsters Deal Reduced Damage", nameZh: "怪物造成的伤害降低", category: "Combat", categoryZh: "战斗", regex: "^monsters d", isPositive: true },
  { id: "monster_increased_damage_taken", name: "Monsters Take Increased Damage", nameZh: "怪物受到的伤害提高", category: "Combat", categoryZh: "战斗", regex: "^monsters t", isPositive: true },
  { id: "monster_reduced_speed", name: "Monsters Reduced Attack/Cast/Movement Speed", nameZh: "怪物攻击/施法/移动速度降低", category: "Combat", categoryZh: "战斗", regex: ",", isPositive: true },
  { id: "rare_reduced_damage", name: "Rare Monsters Deal Reduced Damage", nameZh: "稀有怪物造成的伤害降低", category: "Combat", categoryZh: "战斗", regex: "e monsters d", isPositive: true },
  { id: "rare_increased_damage_taken", name: "Rare Monsters Take Increased Damage", nameZh: "稀有怪物受到的伤害提高", category: "Combat", categoryZh: "战斗", regex: "e monsters t", isPositive: true },
  { id: "trap_reduced_damage", name: "Traps Deal Reduced Damage", nameZh: "陷阱造成的伤害降低", category: "Combat", categoryZh: "战斗", regex: "ps", isPositive: true },

  { id: "increased_defences", name: "Increased Defences", nameZh: "防御提高", category: "Defences", categoryZh: "防御", regex: "def", isPositive: true },
  { id: "increased_max_life", name: "Increased Maximum Life", nameZh: "最大生命提高", category: "Defences", categoryZh: "防御", regex: "lif", isPositive: true },
  { id: "increased_movement", name: "Increased Movement Speed", nameZh: "移动速度提高", category: "Defences", categoryZh: "防御", regex: "ed mo", isPositive: true },

  { id: "chance_save", name: "Chance to Save with 1 Honour", nameZh: "以 1 点荣耀保留存活的几率", category: "Honour", categoryZh: "荣耀", regex: "we", isPositive: true },
  { id: "increased_honour", name: "Increased Honour Restored", nameZh: "荣耀恢复提高", category: "Honour", categoryZh: "荣耀", regex: "ored", isPositive: true },
  { id: "increased_max_honour", name: "Increased Maximum Honour", nameZh: "最大荣耀提高", category: "Honour", categoryZh: "荣耀", regex: "m honour$", isPositive: true },
  { id: "sacred_water_start", name: "Sacred Water at Trial Start", nameZh: "试炼开始时获得圣水", category: "Honour", categoryZh: "荣耀", regex: "ial$", isPositive: true },

  { id: "upgrade_keys", name: "Chance for Keys to Upgrade", nameZh: "钥匙升级几率", category: "Rewards", categoryZh: "奖励", regex: "eac", isPositive: true },
  { id: "additional_merchant_choice", name: "Additional Merchant Choice", nameZh: "额外的商人选项", category: "Rewards", categoryZh: "奖励", regex: "cho", isPositive: true },
  { id: "gain_additional_key", name: "Chance to Gain Additional Key", nameZh: "获得额外钥匙几率", category: "Rewards", categoryZh: "奖励", regex: "^w", isPositive: true },

  { id: "additional_rooms_revealed", name: "Additional Rooms Revealed", nameZh: "显示额外房间", category: "Navigation", categoryZh: "导航", regex: "ms", isPositive: true },
  { id: "one_room_revealed", name: "One Additional Room Revealed", nameZh: "显示 1 个额外房间", category: "Navigation", categoryZh: "导航", regex: "m i", isPositive: true },

  { id: "increased_keys", name: "Increased Key Drops", nameZh: "钥匙掉落提高", category: "Loot", categoryZh: "掉落", regex: "f k", isPositive: true },
  { id: "increased_relics", name: "Increased Relic Drops", nameZh: "圣物掉落提高", category: "Loot", categoryZh: "掉落", regex: "cs d", isPositive: true },
  { id: "reduced_prices", name: "Reduced Merchant Prices", nameZh: "商人价格降低", category: "Loot", categoryZh: "掉落", regex: "pr", isPositive: true },

  { id: "avoid_affliction", name: "Chance to Avoid Affliction", nameZh: "避免折磨几率", category: "Survivability", categoryZh: "生存", regex: "vo", isPositive: true },
  { id: "reduced_slow", name: "Reduced Slowing Potency", nameZh: "减速效果降低", category: "Survivability", categoryZh: "生存", regex: "sl", isPositive: true },
  { id: "honour_resistance", name: "Honour Resistance", nameZh: "荣耀抗性", category: "Survivability", categoryZh: "生存", regex: "o ho", isPositive: true },
  { id: "max_honour_resistance", name: "Maximum Honour Resistance", nameZh: "最大荣耀抗性", category: "Survivability", categoryZh: "生存", regex: "o m", isPositive: true },
  { id: "dodge_distance", name: "Dodge Roll Distance", nameZh: "翻滚距离", category: "Survivability", categoryZh: "生存", regex: "od", isPositive: true },
  { id: "reduced_crit_damage", name: "Reduced Critical Damage Taken", nameZh: "受到的暴击伤害降低", category: "Survivability", categoryZh: "生存", regex: "ts", isPositive: true },

  { id: "fountain_double_water", name: "Fountains Double Sacred Water", nameZh: "喷泉圣水翻倍", category: "Sacred Water", categoryZh: "圣水", regex: "^f", isPositive: true },
  { id: "water_on_room", name: "Sacred Water on Room Completion", nameZh: "完成房间获得圣水", category: "Sacred Water", categoryZh: "圣水", regex: "ete", isPositive: true },
  { id: "monster_double_water", name: "Monsters Drop Double Sacred Water", nameZh: "怪物掉落的圣水翻倍", category: "Sacred Water", categoryZh: "圣水", regex: "p d", isPositive: true },

  { id: "honour_on_boss", name: "Restore Honour on Boss Kill", nameZh: "击杀首领恢复荣耀", category: "Honour Restore", categoryZh: "荣耀恢复", regex: "kil", isPositive: true },
  { id: "honour_on_key", name: "Restore Honour on Key Pickup", nameZh: "拾取钥匙恢复荣耀", category: "Honour Restore", categoryZh: "荣耀恢复", regex: "ick", isPositive: true },
  { id: "honour_on_room", name: "Restore Honour on Room Completion", nameZh: "完成房间恢复荣耀", category: "Honour Restore", categoryZh: "荣耀恢复", regex: "etio", isPositive: true },
  { id: "honour_on_shrine", name: "Restore Honour on Shrine Veneration", nameZh: "祭拜神龛恢复荣耀", category: "Honour Restore", categoryZh: "荣耀恢复", regex: "hr", isPositive: true },
];

export const RegexBuilderPanel: React.FC<RegexBuilderPanelProps> = ({
  isVisible,
  settingsOpen,
  onTogglePanel,
  showToggleButton = true,
}) => {
  const { t, language } = useI18n();
  const [builderType, setBuilderType] = useState<RegexBuilderType>("vendor");
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "positive" | "negative">("all");
  const [copySuccess, setCopySuccess] = useState(false);
  const [logicMode, setLogicMode] = useState<RegexLogicMode>("or");
  const [useOptimized, setUseOptimized] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const escapeRegexLiteral = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const getModRegex = (mod: ModOption) => {
    if (language === "zh") {
      if (mod.regexZh) return mod.regexZh;
      if (mod.nameZh) return escapeRegexLiteral(mod.nameZh);
    }
    return mod.regex;
  };

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

  const CATEGORIES = useMemo(() => {
    const categories = new Set<string>();
    currentMods.forEach(mod => categories.add(mod.category));
    return Array.from(categories).sort();
  }, [currentMods]);

  const modsByCategory = useMemo(() => {
    const grouped = new Map<string, ModOption[]>();

    currentMods.forEach(mod => {
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

  const generatedRegex = useMemo(() => {
    if (selectedMods.size === 0) return "";

    const regexParts = Array.from(selectedMods)
      .map(id => currentMods.find(mod => mod.id === id))
      .filter(mod => mod !== undefined)
      .map(mod => getModRegex(mod!));

    if (regexParts.length === 0) return "";

    let pattern = "";

    if (regexParts.length === 1) {
      pattern = `"${regexParts[0]}"`;
    } else if (logicMode === "or") {
      pattern = `"(${regexParts.join("|")})"`;
    } else {
      pattern = regexParts.map(p => `"${p}"`).join(" ");
    }

    if (useOptimized && pattern.length > 45) {
      const optimized = optimizePattern(pattern, 45);
      return optimized.pattern;
    }

    return pattern;
  }, [currentMods, selectedMods, logicMode, useOptimized]);

  const optimizationInfo = useMemo(() => {
    if (selectedMods.size === 0) return null;

    const regexParts = Array.from(selectedMods)
      .map(id => currentMods.find(mod => mod.id === id))
      .filter(mod => mod !== undefined)
      .map(mod => getModRegex(mod!));

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

  const getModLabel = (mod: ModOption) => {
    if (language === "zh" && mod.nameZh) return mod.nameZh;
    return mod.name;
  };

  const getCategoryLabel = (category: string, mods: ModOption[]) => {
    if (language === "zh") {
      const first = mods[0];
      if (first?.categoryZh) return first.categoryZh;
    }
    return category;
  };

  const warningHint = optimizationInfo && !useOptimized ? ` - ${t("regex.optimize")}` : "";

  return (
    <>
      {showToggleButton && (
        <div className={`regex-builder-toggle ${isVisible ? "panel-open" : ""} ${settingsOpen ? "settings-open" : ""}`}>
          <button
            className="regex-toggle-btn"
            onClick={onTogglePanel}
            title={isVisible ? t("regex.hide") : t("regex.show")}
          >
            <span className="toggle-icon">{isVisible ? "v" : "^"}</span>
            <span className="toggle-text">{t("regex.toggle")}</span>
          </button>
        </div>
      )}

      <div className={`regex-builder-panel ${isVisible ? "visible" : "hidden"}`}>
        <div className="regex-builder-header">
          <h3>{t("regex.title")}</h3>
          <button
            className="control-btn close-btn"
            onClick={onTogglePanel}
            title={t("regex.hide")}
          >
            X
          </button>
        </div>

        <div className="regex-builder-tabs">
          <button
            className={`regex-builder-tab ${builderType === "vendor" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("vendor");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            {t("regex.tabs.vendor")}
          </button>
          <button
            className={`regex-builder-tab ${builderType === "waystone" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("waystone");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            {t("regex.tabs.waystone")}
          </button>
          <button
            className={`regex-builder-tab ${builderType === "tablet" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("tablet");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            {t("regex.tabs.tablet")}
          </button>
          <button
            className={`regex-builder-tab ${builderType === "relic" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("relic");
              setSelectedMods(new Set());
              setCollapsedCategories(new Set());
            }}
          >
            {t("regex.tabs.relic")}
          </button>
        </div>

        <div className="regex-builder-content">
          <div className="regex-toolbar">
            <input
              type="text"
              className="regex-search"
              placeholder={t("regex.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {builderType !== "vendor" && (
              <div className="regex-type-filters">
                <button
                  className={`type-filter-btn ${filterType === "all" ? "active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  {t("regex.filter.all")}
                </button>
                <button
                  className={`type-filter-btn ${filterType === "positive" ? "active" : ""}`}
                  onClick={() => setFilterType("positive")}
                >
                  {t("regex.filter.want")}
                </button>
                <button
                  className={`type-filter-btn ${filterType === "negative" ? "active" : ""}`}
                  onClick={() => setFilterType("negative")}
                >
                  {t("regex.filter.avoid")}
                </button>
              </div>
            )}
            <button className="regex-action-btn-sm" onClick={clearSelection}>
              {t("regex.clear", { count: selectedMods.size })}
            </button>
          </div>

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
                      const categoryLabel = getCategoryLabel(category, mods);

                      return (
                        <div key={category} className="regex-category-section">
                          <div
                            className="regex-category-header"
                            onClick={() => toggleCategory(category)}
                          >
                            <span className="category-toggle-icon">
                              {isCollapsed ? "^" : "v"}
                            </span>
                            <span className="category-name">{categoryLabel}</span>
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
                                    {getModLabel(mod)}
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
                      const categoryLabel = getCategoryLabel(category, mods);

                      return (
                        <div key={category} className="regex-category-section">
                          <div
                            className="regex-category-header"
                            onClick={() => toggleCategory(category)}
                          >
                            <span className="category-toggle-icon">
                              {isCollapsed ? "^" : "v"}
                            </span>
                            <span className="category-name">{categoryLabel}</span>
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
                                    {getModLabel(mod)}
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

          <div className="regex-output-bottom">
            <div className="regex-output-controls">
              <div className="regex-logic-mode-inline">
                <label>{t("regex.mode")}</label>
                <button
                  className={`logic-mode-btn ${logicMode === "or" ? "active" : ""}`}
                  onClick={() => setLogicMode("or")}
                >
                  {t("regex.or")}
                </button>
                <button
                  className={`logic-mode-btn ${logicMode === "and" ? "active" : ""}`}
                  onClick={() => setLogicMode("and")}
                >
                  {t("regex.and")}
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
                    {useOptimized ? t("regex.optimized") : t("regex.optimize")}
                  </button>
                )}
                <button
                  className="regex-copy-btn"
                  onClick={copyToClipboard}
                  disabled={!generatedRegex}
                >
                  {copySuccess ? t("regex.copied") : t("regex.copy")}
                </button>
              </div>
            </div>
            <div className="regex-output-display-bottom">
              {generatedRegex || t("regex.empty")}
            </div>
            {generatedRegex.length > 45 && (
              <div className="regex-warning-compact">
                {t("regex.warning", { hint: warningHint })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
