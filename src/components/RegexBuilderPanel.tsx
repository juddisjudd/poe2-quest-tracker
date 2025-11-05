import React, { useState, useMemo } from "react";
import "./RegexBuilderPanel.css";

type RegexBuilderType = "vendor" | "waystone" | "tablet" | "relic";
type RegexLogicMode = "or" | "and";

interface ModOption {
  id: string;
  name: string;
  category: string;
  regex: string;
  isPositive?: boolean; // true = want this mod, false = avoid this mod
}

interface RegexBuilderPanelProps {
  isVisible: boolean;
  settingsOpen: boolean;
  onTogglePanel: () => void;
  showToggleButton?: boolean;
}

// Vendor/Stash Item Data
const VENDOR_ITEMS: ModOption[] = [
  // Item Properties
  { id: "quality", name: "Quality", category: "Properties", regex: "y: \\+", isPositive: true },
  { id: "sockets", name: "Sockets", category: "Properties", regex: "ts: S", isPositive: true },

  // Damage Mods
  { id: "phys_damage", name: "Physical Damage", category: "Damage", regex: "physical d", isPositive: true },
  { id: "cold_damage", name: "Cold Damage", category: "Damage", regex: "cold d", isPositive: true },
  { id: "fire_damage", name: "Fire Damage", category: "Damage", regex: "fire d", isPositive: true },
  { id: "lightning_damage", name: "Lightning Damage", category: "Damage", regex: "lightning d", isPositive: true },
  { id: "chaos_damage", name: "Chaos Damage", category: "Damage", regex: "chaos d", isPositive: true },
  { id: "ele_damage", name: "Elemental Damage", category: "Damage", regex: "elemental d", isPositive: true },

  // Speed & Stats
  { id: "attack_speed", name: "Attack Speed", category: "Speed", regex: "attack s", isPositive: true },
  { id: "cast_speed", name: "Cast Speed", category: "Speed", regex: "cast s", isPositive: true },
  { id: "move_speed", name: "Movement Speed", category: "Movement", regex: "movement s", isPositive: true },
  { id: "move_30", name: "Movement Speed (30%)", category: "Movement", regex: "30.*movement", isPositive: true },
  { id: "move_25", name: "Movement Speed (25%)", category: "Movement", regex: "25.*movement", isPositive: true },
  { id: "move_20", name: "Movement Speed (20%)", category: "Movement", regex: "20.*movement", isPositive: true },
  { id: "move_15", name: "Movement Speed (15%)", category: "Movement", regex: "15.*movement", isPositive: true },
  { id: "move_10", name: "Movement Speed (10%)", category: "Movement", regex: "10.*movement", isPositive: true },

  // Special Mods
  { id: "skill_level", name: "+# to Level of Skills", category: "Special", regex: "level.*skill", isPositive: true },
  { id: "spirit", name: "+# Spirit", category: "Special", regex: "spirit", isPositive: true },
  { id: "rarity", name: "Increased Rarity", category: "Special", regex: "rarity", isPositive: true },

  // Life & Mana
  { id: "max_life", name: "Maximum Life", category: "Defences", regex: "maximum l", isPositive: true },
  { id: "max_mana", name: "Maximum Mana", category: "Defences", regex: "maximum m", isPositive: true },
  { id: "max_es", name: "Maximum Energy Shield", category: "Defences", regex: "maximum e", isPositive: true },
  { id: "inc_evasion", name: "Increased Evasion", category: "Defences", regex: "evasion r", isPositive: true },
  { id: "inc_armour", name: "Increased Armour", category: "Defences", regex: "armour", isPositive: true },
  { id: "inc_es", name: "Increased Energy Shield", category: "Defences", regex: "energy s", isPositive: true },

  // Attributes
  { id: "strength", name: "+# Strength", category: "Attributes", regex: "strength", isPositive: true },
  { id: "dexterity", name: "+# Dexterity", category: "Attributes", regex: "dexterity", isPositive: true },
  { id: "intelligence", name: "+# Intelligence", category: "Attributes", regex: "intelligence", isPositive: true },
  { id: "all_attributes", name: "+# to All Attributes", category: "Attributes", regex: "all attr", isPositive: true },

  // Resistances
  { id: "fire_res", name: "Fire Resistance", category: "Resistances", regex: "fire.*res", isPositive: true },
  { id: "cold_res", name: "Cold Resistance", category: "Resistances", regex: "cold.*res", isPositive: true },
  { id: "lightning_res", name: "Lightning Resistance", category: "Resistances", regex: "lightning.*res", isPositive: true },
  { id: "chaos_res", name: "Chaos Resistance", category: "Resistances", regex: "chaos.*res", isPositive: true },
  { id: "any_res", name: "Any Resistance", category: "Resistances", regex: "res", isPositive: true },

  // Item Rarity
  { id: "rare", name: "Rare Items", category: "Rarity", regex: "y: r", isPositive: true },
  { id: "magic", name: "Magic Items", category: "Rarity", regex: "y: m", isPositive: true },
  { id: "normal", name: "Normal Items", category: "Rarity", regex: "y: n", isPositive: true },

  // Item Classes - Jewelry
  { id: "amulets", name: "Amulets", category: "Jewelry", regex: "s: am", isPositive: true },
  { id: "rings", name: "Rings", category: "Jewelry", regex: "s: ri", isPositive: true },
  { id: "belts", name: "Belts", category: "Jewelry", regex: "s: be", isPositive: true },

  // Item Classes - 1H Weapons
  { id: "wands", name: "Wands", category: "1H Weapons", regex: "s: wa", isPositive: true },
  { id: "one_hand_maces", name: "One Hand Maces", category: "1H Weapons", regex: "s: on", isPositive: true },
  { id: "sceptres", name: "Sceptres", category: "1H Weapons", regex: "s: sc", isPositive: true },

  // Item Classes - 2H Weapons
  { id: "bows", name: "Bows", category: "2H Weapons", regex: "s: bow", isPositive: true },
  { id: "staves", name: "Staves", category: "2H Weapons", regex: "s: st", isPositive: true },
  { id: "two_hand_maces", name: "Two Hand Maces", category: "2H Weapons", regex: "s: tw", isPositive: true },
  { id: "quarterstaves", name: "Quarterstaves", category: "2H Weapons", regex: "s: qua", isPositive: true },
  { id: "crossbows", name: "Crossbows", category: "2H Weapons", regex: "s: cr", isPositive: true },

  // Item Classes - Equipment
  { id: "gloves", name: "Gloves", category: "Equipment", regex: "s: gl", isPositive: true },
  { id: "boots", name: "Boots", category: "Equipment", regex: "s: boo", isPositive: true },
  { id: "body_armours", name: "Body Armours", category: "Equipment", regex: "s: bod", isPositive: true },
  { id: "helmets", name: "Helmets", category: "Equipment", regex: "s: he", isPositive: true },

  // Item Classes - Offhand
  { id: "quivers", name: "Quivers", category: "Offhand", regex: "s: qui", isPositive: true },
  { id: "foci", name: "Foci", category: "Offhand", regex: "s: fo", isPositive: true },
  { id: "shields", name: "Shields", category: "Offhand", regex: "s: sh", isPositive: true },
];

// Waystone Mods Data (from poe2.re)
const WAYSTONE_MODS: ModOption[] = [
  // Positive Mods - Magic Monsters
  { id: "magic_ignited", name: "Magic Monsters | Ignited Ground", category: "Magic+", regex: "ign", isPositive: true },
  { id: "magic_fire", name: "Magic Monsters | Extra Fire Damage", category: "Magic+", regex: "fire$", isPositive: true },
  { id: "magic_bleeding", name: "Magic Monsters | Bleeding on Hit", category: "Magic+", regex: "blee", isPositive: true },
  { id: "magic_ailment", name: "Magic Monsters | Increased Ailment/Stun Threshold", category: "Magic+", regex: "lm", isPositive: true },
  { id: "magic_stun_buildup", name: "Magic Monsters | Increased Stun Buildup", category: "Magic+", regex: "un b", isPositive: true },
  { id: "magic_vaal", name: "Magic Monsters | Vaal Packs", category: "Magic+", regex: "aa", isPositive: true },

  // Positive Mods - Rare Monsters
  { id: "rare_damage", name: "Rare Monsters | Increased Monster Damage", category: "Rare+", regex: "mage$", isPositive: true },
  { id: "rare_life", name: "Rare Monsters | More Monster Life", category: "Rare+", regex: "fe$", isPositive: true },
  { id: "rare_armoured", name: "Rare Monsters | Monsters Armoured", category: "Rare+", regex: "oure", isPositive: true },
  { id: "rare_modifier", name: "Rare Monsters | Additional Modifier", category: "Rare+", regex: "mod", isPositive: true },
  { id: "rare_iron_guards", name: "Rare Monsters | Iron Guards Packs", category: "Rare+", regex: "ds", isPositive: true },
  { id: "rare_transcended", name: "Rare Monsters | Transcended Packs", category: "Rare+", regex: "ans", isPositive: true },

  // Positive Mods - Additional Packs
  { id: "pack_beasts", name: "Additional Beast Packs", category: "Packs", regex: "sts", isPositive: true },
  { id: "pack_bramble", name: "Additional Bramble Packs", category: "Packs", regex: "f br", isPositive: true },
  { id: "pack_ezomyte", name: "Additional Ezomyte Packs", category: "Packs", regex: "yt", isPositive: true },
  { id: "pack_faridun", name: "Additional Faridun Packs", category: "Packs", regex: "un m", isPositive: true },
  { id: "pack_plagued", name: "Additional Plagued Packs", category: "Packs", regex: "agu", isPositive: true },
  { id: "pack_undead", name: "Additional Undead Packs", category: "Packs", regex: "ndea", isPositive: true },

  // Positive Mods - Rarity
  { id: "rarity_curses", name: "Item Rarity | Less Curse Effect", category: "Rarity+", regex: "rses", isPositive: true },
  { id: "rarity_ele_res", name: "Item Rarity | Monster Ele Res", category: "Rarity+", regex: "r el", isPositive: true },
  { id: "rarity_chilled", name: "Item Rarity | Chilled Ground", category: "Rarity+", regex: "chi", isPositive: true },
  { id: "rarity_penetration", name: "Item Rarity | Damage Penetrates Res", category: "Rarity+", regex: "tes", isPositive: true },
  { id: "rarity_chaos", name: "Item Rarity | Extra Chaos Damage", category: "Rarity+", regex: "ra ch", isPositive: true },
  { id: "rarity_cold", name: "Item Rarity | Extra Cold Damage", category: "Rarity+", regex: "col", isPositive: true },
  { id: "rarity_energy_shield", name: "Item Rarity | Monster Energy Shield", category: "Rarity+", regex: "f m", isPositive: true },
  { id: "rarity_freeze", name: "Item Rarity | Increased Freeze/Shock/Flammability", category: "Rarity+", regex: "mm", isPositive: true },
  { id: "rarity_eleweakness", name: "Item Rarity | Cursed with Ele Weakness", category: "Rarity+", regex: "kn", isPositive: true },
  { id: "rarity_recovery", name: "Item Rarity | Less Recovery Rate", category: "Rarity+", regex: "f l", isPositive: true },
  { id: "rarity_cooldown", name: "Item Rarity | Less Cooldown Recovery", category: "Rarity+", regex: "wn", isPositive: true },

  // Positive Mods - Pack Size
  { id: "pack_max_res", name: "Pack Size | Reduced Max Resistances", category: "Pack+", regex: "% ma", isPositive: true },
  { id: "pack_shocked", name: "Pack Size | Shocked Ground", category: "Pack+", regex: "cke", isPositive: true },
  { id: "pack_evasive", name: "Pack Size | Monsters Evasive", category: "Pack+", regex: "e eva", isPositive: true },
  { id: "pack_lightning", name: "Pack Size | Extra Lightning Damage", category: "Pack+", regex: "tn", isPositive: true },
  { id: "pack_projectiles", name: "Pack Size | Additional Projectiles", category: "Pack+", regex: "oj", isPositive: true },
  { id: "pack_poison", name: "Pack Size | Poison on Hit", category: "Pack+", regex: "ois", isPositive: true },
  { id: "pack_charges", name: "Pack Size | Steal Charges", category: "Pack+", regex: "r,", isPositive: true },
  { id: "pack_accuracy", name: "Pack Size | Increased Accuracy", category: "Pack+", regex: "cc", isPositive: true },
  { id: "pack_crit", name: "Pack Size | Increased Crit Chance/Bonus", category: "Pack+", regex: "bon", isPositive: true },
  { id: "pack_temporal", name: "Pack Size | Cursed with Temporal Chains", category: "Pack+", regex: "emp", isPositive: true },
  { id: "pack_flask", name: "Pack Size | Reduced Flask Charges", category: "Pack+", regex: "sk", isPositive: true },

  // Negative Mods - Avoid These
  { id: "enfeeble", name: "Cursed with Enfeeble", category: "Avoid", regex: "eble", isPositive: false },
  { id: "break_armour", name: "Monsters Break Armour", category: "Avoid", regex: "eq", isPositive: false },
  { id: "reduced_crit_extra", name: "Monsters Reduced Crit Extra Damage", category: "Avoid", regex: "tak", isPositive: false },
  { id: "aoe", name: "Monsters Increased Area of Effect", category: "Avoid", regex: "ect$", isPositive: false },
  { id: "attack_speed", name: "Monster Attack/Cast/Movement Speed", category: "Avoid", regex: "tta", isPositive: false },
];

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
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterType, setFilterType] = useState<"all" | "positive" | "negative">("all");
  const [copySuccess, setCopySuccess] = useState(false);
  const [logicMode, setLogicMode] = useState<RegexLogicMode>("or");

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

  // Filter mods based on search and category
  const filteredMods = useMemo(() => {
    return currentMods.filter(mod => {
      const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "All" || mod.category === filterCategory;
      const matchesType = filterType === "all" ||
        (filterType === "positive" && mod.isPositive) ||
        (filterType === "negative" && !mod.isPositive);
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [currentMods, searchTerm, filterCategory, filterType]);

  // Generate regex from selected mods
  const generatedRegex = useMemo(() => {
    if (selectedMods.size === 0) return "";

    const regexParts = Array.from(selectedMods)
      .map(id => currentMods.find(mod => mod.id === id))
      .filter(mod => mod !== undefined)
      .map(mod => mod!.regex);

    if (regexParts.length === 0) return "";

    // Single pattern - wrap in quotes
    if (regexParts.length === 1) return `"${regexParts[0]}"`;

    if (logicMode === "or") {
      // OR logic: Match items with ANY of the selected mods
      // Wrap the entire pattern in quotes
      return `"(${regexParts.join("|")})"`;
    } else {
      // AND logic: POE2 supports space-separated patterns for AND matching
      // Example: "cold.*res" "lightning.*res" matches items with BOTH
      return regexParts.map(p => `"${p}"`).join(" ");
    }
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
    const visibleIds = filteredMods.map(mod => mod.id);
    setSelectedMods(new Set(visibleIds));
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
              setFilterCategory("All");
            }}
          >
            Vendor/Stash
          </button>
          <button
            className={`regex-builder-tab ${builderType === "waystone" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("waystone");
              setSelectedMods(new Set());
              setFilterCategory("All");
            }}
          >
            Waystones
          </button>
          <button
            className={`regex-builder-tab ${builderType === "tablet" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("tablet");
              setSelectedMods(new Set());
              setFilterCategory("All");
            }}
          >
            Tablets
          </button>
          <button
            className={`regex-builder-tab ${builderType === "relic" ? "active" : ""}`}
            onClick={() => {
              setBuilderType("relic");
              setSelectedMods(new Set());
              setFilterCategory("All");
            }}
          >
            Relics
          </button>
        </div>

        <div className="regex-builder-content">
          {/* Filters */}
          <div className="regex-filters">
            <input
              type="text"
              className="regex-search"
              placeholder="Search mods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="regex-filter-row">
              <select
                className="regex-category-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Want/Avoid filters only for waystones, tablets, and relics */}
              {builderType !== "vendor" && (
                <div className="regex-type-filters">
                  <button
                    className={`type-filter-btn ${filterType === "all" ? "active" : ""}`}
                    onClick={() => setFilterType("all")}
                  >
                    All
                  </button>
                  <button
                    className={`type-filter-btn positive ${filterType === "positive" ? "active" : ""}`}
                    onClick={() => setFilterType("positive")}
                  >
                    Want
                  </button>
                  <button
                    className={`type-filter-btn negative ${filterType === "negative" ? "active" : ""}`}
                    onClick={() => setFilterType("negative")}
                  >
                    Avoid
                  </button>
                </div>
              )}
            </div>

            <div className="regex-actions">
              {/* Select All only useful for waystones/tablets/relics */}
              {builderType !== "vendor" && (
                <button className="regex-action-btn" onClick={selectAllVisible}>
                  Select All Visible
                </button>
              )}
              <button className="regex-action-btn" onClick={clearSelection}>
                Clear Selection
              </button>
              <span className="selection-count">
                {selectedMods.size} mod{selectedMods.size !== 1 ? "s" : ""} selected
              </span>
            </div>
          </div>

          {/* Mod List */}
          <div className="regex-mod-list">
            {filteredMods.map(mod => (
              <label key={mod.id} className="regex-mod-item">
                <input
                  type="checkbox"
                  checked={selectedMods.has(mod.id)}
                  onChange={() => toggleMod(mod.id)}
                />
                <span className={`mod-name ${mod.isPositive ? "positive" : "negative"}`}>
                  {mod.name}
                </span>
                <span className="mod-category">{mod.category}</span>
              </label>
            ))}
          </div>

          {/* Logic Mode Toggle - Available for all builder types */}
          <div className="regex-logic-mode">
            <label>Match Mode:</label>
            <div className="logic-mode-buttons">
              <button
                className={`logic-mode-btn ${logicMode === "or" ? "active" : ""}`}
                onClick={() => setLogicMode("or")}
                title={`Match ${builderType === "vendor" ? "items" : builderType === "waystone" ? "waystones" : builderType === "tablet" ? "tablets" : "relics"} with ANY selected mod`}
              >
                OR (Any)
              </button>
              <button
                className={`logic-mode-btn ${logicMode === "and" ? "active" : ""}`}
                onClick={() => setLogicMode("and")}
                title={`Match ${builderType === "vendor" ? "items" : builderType === "waystone" ? "waystones" : builderType === "tablet" ? "tablets" : "relics"} with ALL selected mods`}
              >
                AND (All)
              </button>
            </div>
            <span className="logic-hint">
              {logicMode === "or"
                ? `${builderType === "vendor" ? "Items" : builderType === "waystone" ? "Waystones" : builderType === "tablet" ? "Tablets" : "Relics"} with ANY selected mod`
                : `${builderType === "vendor" ? "Items" : builderType === "waystone" ? "Waystones" : builderType === "tablet" ? "Tablets" : "Relics"} with ALL selected mods`
              }
            </span>
          </div>

          {/* Generated Regex Output */}
          <div className="regex-output-section">
            <div className="regex-output-header">
              <label>Generated Regex</label>
              <div className="regex-output-actions">
                <span className={`regex-char-count ${generatedRegex.length > 45 ? "over-limit" : ""}`}>
                  {generatedRegex.length}/45 chars
                </span>
                <button
                  className="regex-copy-btn"
                  onClick={copyToClipboard}
                  disabled={!generatedRegex}
                  title="Copy to clipboard"
                >
                  {copySuccess ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="regex-output-display">
              {generatedRegex || "Select items to generate regex..."}
            </div>
            {generatedRegex.length > 45 && (
              <div className="regex-warning">
                ⚠ Warning: Pattern exceeds POE2's 45 character search limit
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
