import { Act } from "../types";

export const defaultQuestData: Act[] = [
  {
    id: "act1-normal",
    name: "Act 1 (Normal)",
    expanded: true,
    quests: [
      {
        id: "a1n-clearfell",
        name: "Clearfell - Kill Beira of the Rotten Pack",
        description: "+10% to Cold Resistance",
        completed: false,
      },
      {
        id: "a1n-hunting-grounds",
        name: "Hunting Grounds - Kill The Crowbell",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a1n-freythorn",
        name: "Freythorn - Kill The King in the Mists",
        description: "+30 to Spirit",
        completed: false,
      },
      {
        id: "a1n-ogham-farmlands",
        name: "Ogham Farmlands - Find Una's Lute, deliver it to Una",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a1n-ogham-manor",
        name: "Ogham Manor - Kill Candlemass, the Living Rite",
        description: "+20 to maximum Life",
        completed: false,
      },
    ],
  },
  {
    id: "act2-normal",
    name: "Act 2 (Normal)",
    expanded: false,
    quests: [
      {
        id: "a2n-keth",
        name: "Keth - Kill Kabala, Constrictor Queen",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a2n-valley-titans",
        name: "Valley of the Titans - Deliver relics to altar",
        description:
          "Choose: 30% increased Charm Charges gained OR 15% increased Mana Recovery from Flasks",
        completed: false,
      },
      {
        id: "a2n-deshar",
        name: "Deshar - Find the Final Letter and deliver it to Shambrin",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a2n-spires",
        name: "The Spires of Deshar - Interact with Sisters of Garukhan monument",
        description: "+10% to Lightning Resistance",
        completed: false,
      },
    ],
  },
  {
    id: "act3-normal",
    name: "Act 3 (Normal)",
    expanded: false,
    quests: [
      {
        id: "a3n-jungle-ruins",
        name: "Jungle Ruins - Kill Mighty Silverfist",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a3n-azak-bog",
        name: "The Azak Bog - Kill Ignagduk, the Bog Witch",
        description: "+30 to Spirit",
        completed: false,
      },
      {
        id: "a3n-venom-crypts",
        name: "The Venom Crypts - Find Corpse-snake Venom, deliver to Servi",
        description:
          "Choose: 25% increased Stun Threshold OR 30% increased Elemental Ailment Threshold OR 25% increased Mana Regeneration Rate",
        completed: false,
      },
      {
        id: "a3n-machinarium",
        name: "Jiquani's Machinarium - Kill Blackjaw, the Remnant",
        description: "+10% to Fire Resistance",
        completed: false,
      },
      {
        id: "a3n-aggorat",
        name: "Aggorat - Acquire Sacrificial Heart, sacrifice at altar",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
    ],
  },
  {
    id: "act1-cruel",
    name: "Act 1 (Cruel)",
    expanded: false,
    quests: [
      {
        id: "a1c-clearfell",
        name: "Clearfell - Kill Beira of the Rotten Pack",
        description: "+10% to Cold Resistance",
        completed: false,
      },
      {
        id: "a1c-hunting-grounds",
        name: "Hunting Grounds - Kill The Crowbell",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a1c-ogham-farmlands",
        name: "Ogham Farmlands - Find Una's Lute, deliver it to Una",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a1c-ogham-manor",
        name: "Ogham Manor - Kill Candlemass, the Living Rite",
        description: "5% increased maximum Life",
        completed: false,
      },
    ],
  },
  {
    id: "act2-cruel",
    name: "Act 2 (Cruel)",
    expanded: false,
    quests: [
      {
        id: "a2c-keth",
        name: "Keth - Kill Kabala, Constrictor Queen",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a2c-valley-titans",
        name: "Valley of the Titans - Deliver relics to altar",
        description:
          "Choose: 30% increased Charm Charges gained OR 15% increased Life Recovery from Flasks",
        completed: false,
      },
      {
        id: "a2c-deshar",
        name: "Deshar - Find the Final Letter and deliver it to Shambrin",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a2c-spires",
        name: "The Spires of Deshar - Interact with Sisters of Garukhan monument",
        description: "+10% Lightning Resistance",
        completed: false,
      },
    ],
  },
  {
    id: "act3-cruel",
    name: "Act 3 (Cruel)",
    expanded: false,
    quests: [
      {
        id: "a3c-jungle-ruins",
        name: "Jungle Ruins - Kill Mighty Silverfist",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
      {
        id: "a3c-azak-bog",
        name: "The Azak Bog - Kill Ignagduk, the Bog Witch",
        description: "+40 to Spirit",
        completed: false,
      },
      {
        id: "a3c-venom-crypts",
        name: "The Venom Crypts - Find Venom Vial, deliver to Servi",
        description:
          "Choose: +10% to Chaos Resistance OR +5 to All Attributes OR 15% reduced Slowing Potency of Debuffs on you",
        completed: false,
      },
      {
        id: "a3c-machinarium",
        name: "Jiquani's Machinarium - Kill Blackjaw, the Remnant",
        description: "+10% Fire Resistance",
        completed: false,
      },
      {
        id: "a3c-aggorat",
        name: "Aggorat - Acquire Sacrificial Heart, sacrifice at altar",
        description: "+2 Weapon Set Passive Skill Points",
        completed: false,
      },
    ],
  },
];
