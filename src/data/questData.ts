import { Act } from "../types";

export const defaultQuestData: Act[] = [
    {
      "id": "act1",
      "name": "Act 1",
      "expanded": false,
      "quests": [
        {
          "id": "act1-Riverbank1",
          "name": "Riverbank: Kill Boss, enter town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Clearfell1",
          "name": "Clearfell: Kill Beira of the Rotten Pack",
          "description": "is always north/northeast of waypoint. Mud burrow and the worm boss can be skipped 10% coldres",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Clearfell2",
          "name": "Clearfell: Find exit to grelwood",
          "description": "use checkpoint from beira to come back here if you find the exit first ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Grelwood1",
          "name": "Grelwood: Find waypoint, talk to quest NPC",
          "description": "somewhat in center of zone ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Grelwood2",
          "name": "Grelwood: Find exit to grim tangle",
          "description": "enter zone, take waypoint, backtrack to grelwood ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Grelwood3",
          "name": "Grelwood: Find exit to red vale",
          "description": "enter zone, take waypoint, backtrack to grelwood ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Grelwood4",
          "name": "Grelwood: Go to red vale",
          "description": "either via waypoint or checkpoint ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Red Vale1",
          "name": "Red Vale: Find the three obelisks and get the three quest items",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Intermediate1",
          "name": "Intermediate: Go back to town, get runic tools from Renly",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Intermediate2",
          "name": "Intermediate: Go to Grelwood waypoint, click the three runes, talk to Una",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Intermediate3",
          "name": "Intermediate: Go back to town, talk to una",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Intermediate4",
          "name": "Intermediate: Go to Grim Tangle waypoint",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Grim Tangle1",
          "name": "Grim Tangle: Find exit to cemetery of the eternals",
          "description": "The boss (druid) can be skipped ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Cemetery of the Eternals1",
          "name": "Cemetery of the Eternals: Find the Mausoleum, kill the boss in there",
          "description": "On second boss, use checkpoint to teleport to zone beginning, then use waypoint to cemetery ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Cemetery of the Eternals2",
          "name": "Cemetery of the Eternals: Find the Tomb, kill the boss in there",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Cemetery of the Eternals3",
          "name": "Cemetery of the Eternals: Talk to Lachlan, open the gate, kill lachlan",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Cemetery of the Eternals4",
          "name": "Cemetery of the Eternals: Enter Hunting Grounds",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Hunting Grounds1",
          "name": "Hunting Grounds: Find and kill Crowbell",
          "description": " 2 skillpoints",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Hunting Grounds2",
          "name": "Hunting Grounds: Find exit to Ogham farmlands",
          "description": "enter zone, take waypoint, backtrack to hunting grounds ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Hunting Grounds3",
          "name": "Hunting Grounds: Find exit to Freythorn",
          "description": "enter zone, take waypoint, backtrack to hunting grounds (ONLY ON NORMAL DIFFICULTY) ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Hunting Grounds4",
          "name": "Hunting Grounds: Go to Freythorn",
          "description": "via townportal+waypoint if it isn't the last you have found ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Freythorn1",
          "name": "Freythorn: Do all 4 rituals, kill king of the mists at the 4th",
          "description": " 30 spirit (normal only)",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Freythorn2",
          "name": "Freythorn: Go to Ogham farmlands",
          "description": "via townportal+waypoint ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Farmlands1",
          "name": "Ogham Farmlands: Find una's lute",
          "description": "somewhat in center of zone 2 skill points",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Farmlands2",
          "name": "Ogham Farmlands: Find exit to Ogham village",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Village1",
          "name": "Ogham Village: Find Smithing tools",
          "description": "Only needed on first character per league ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Village2",
          "name": "Ogham Village: Find and kill the executioner",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Village3",
          "name": "Ogham Village: Go to manor ramparts",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-The Manor Ramparts1",
          "name": "The Manor Ramparts: Find exit to Ogham Manor",
          "description": "always go the opposite direction of the waypoint after you enter the zone ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Manor1",
          "name": "Ogham Manor: Find and kill candlemass",
          "description": "If you find the stairs first, go down, take checkpoint, then go back up.\r\nyou can then take the checkpoint from candlewood to the stairs once you found and killed it ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Manor2",
          "name": "Ogham Manor: Find and go down stairs twice",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Ogham Manor3",
          "name": "Ogham Manor: Find elevator to boss, kill boss, go back to down",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Town1",
          "name": "Town: Talk to Renly to turn in the smithing tools",
          "description": "Only needed on first character per league unlocks salvaging bench",
          "completed": false,
          "optional": false
        },
        {
          "id": "act1-Town2",
          "name": "Town: Talk to the hooded one to go to act 2",
          "description": " ",
          "completed": false,
          "optional": false
        }
      ]
    },
    {
      "id": "act2",
      "name": "Act 2",
      "expanded": false,
      "quests": [
        {
          "id": "act2-Vastiri Outskirts1",
          "name": "Vastiri Outskirts: Find and kill Rathbreaker",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Vastiri Outskirts2",
          "name": "Vastiri Outskirts: Portal back to camp, enter caravan",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #11",
          "name": "Town #1: Speak to everyone, use desert map to go to mawdun quarry",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Mawdun Quarry1",
          "name": "Mawdun Quarry: Find exit to mawdun mine",
          "description": "Follow the checkpoints ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Mawdun Mine1",
          "name": "Mawdun Mine: Find and kill Rudja",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Mawdun Mine2",
          "name": "Mawdun Mine: Talk to Risu, portal back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #21",
          "name": "Town #2: Talk to Risu, then use desert map to go to halani gates",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #22",
          "name": "Town #2: Talk to Asala at the gates, go back to caravan, talk to Risu again, then to Asala again",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #23",
          "name": "Town #2: Use desert map to go to halani gates again",
          "description": "will end up at traitors passage ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Traitor's Passage1",
          "name": "Traitor's Passage: Find and kill Basala, pick up the Djinn Barya quest item",
          "description": "ONLY ON NORMAL DIFFICULTY ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Traitor's Passage2",
          "name": "Traitor's Passage: Find the exit to the halani gates",
          "description": "stairs up means you are on the right way ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Halani Gates1",
          "name": "The Halani Gates: Find and kill Jamanra the risen king",
          "description": "Always keep close to the canyon. Cross the canyon three times to find the boss. ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Halani Gates2",
          "name": "The Halani Gates: Go down the stairs and to the bottom right of the zone, then back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #31",
          "name": "Town #3: Use the desert map to go to the Trial of Sekhemas",
          "description": "Take waypoint, then go back to town. ONLY ON NORMAL DIFFICULTY ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #32",
          "name": "Town #3: Talk to everyone, then use desert map to go to Keth",
          "description": "If it's not possible yet (due to changes in 0.2.0) try to do that at any later point where you are in town ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Keth1",
          "name": "Keth: Kill Kabala, the constrictor queen",
          "description": "somewhat on the middle of the zone 2 skill points",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Keth2",
          "name": "Keth: Kill (snake) monsters until you find the Kabala Clan relic.",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Keth3",
          "name": "Keth: Find exit to the lost city",
          "description": "always bottom right of the zone, after a big bridge. take checkpoint, do the rest if not yet done ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Keth4",
          "name": "Keth: Go to the lost city",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Lost City1",
          "name": "The Lost City: Find exit and go to the buried shrines, then the heart of keth",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Lost City2",
          "name": "The Lost City: Kill Azaraian the Forsaken son",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Lost City3",
          "name": "The Lost City: Talk to the goddess, loot the cinders, burn the goddess, loot the essence of water",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #41",
          "name": "Town #4: Use desert map to go to mastodon badlands",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Mastodon Badlands1",
          "name": "Mastodon Badlands: Find the exit to the bone pits",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Bone Pits1",
          "name": "The Bone Pits: Find and kill the zone boss and loot the horn",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Bone Pits2",
          "name": "The Bone Pits: Kill (hyena) enemies until you found the sun clan relic",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Bone Pits3",
          "name": "The Bone Pits: Portal back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #51",
          "name": "Town #5: Use desert map to go to the valley of titans",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Valley of the Titans1",
          "name": "The Valley of the Titans: Find and click the three ancient seals",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Valley of the Titans2",
          "name": "The Valley of the Titans: Find the medallion and place the two relics in there",
          "description": "The waypoint is here. Choose a buff, it can be changed later at any time one of two permanent buffs, can be changed later",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Valley of the Titans3",
          "name": "The Valley of the Titans: Find the exit to the Titan Grotto",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Valley of the Titans4",
          "name": "The Valley of the Titans: Go to the Titan Grotto",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Titan Grotto1",
          "name": "Titan Grotto: Find and kill the boss, then go back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #61",
          "name": "Town #6: Talk to Zarka, then Asala",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #62",
          "name": "Town #6: Use the desert map to traval to the halani gates",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #63",
          "name": "Town #6: Go to the front of the caravan and sound the horn",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #64",
          "name": "Town #6: Use the desert map to traval to deshar",
          "description": "  ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Deshar1",
          "name": "Deshar: Talk to the abandoned rhoa BECAUSE IT'S THE RIGHT THING TO DO YOU MONSTER.",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Deshar2",
          "name": "Deshar: Find the final letter on a corpse on the ground",
          "description": "near a big tower on the ground 2 skill points on quest turn in",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Deshar3",
          "name": "Deshar: Find the exit to the path of mourning",
          "description": "enter zone, take waypoint, backtrack to Deshar ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Deshar4",
          "name": "Deshar: Go the the Path of Mourning",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Path of Mourning1",
          "name": "The Path of Mourning: Find the exit to the Spires of Deshar",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Spires of Deshar1",
          "name": "The Spires of Deshar: Find the sisters of Garukhan",
          "description": " 10% lightning res",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Spires of Deshar2",
          "name": "The Spires of Deshar: Find and kill Tor Gul, the Defiler",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Spires of Deshar3",
          "name": "The Spires of Deshar: Portal back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #71",
          "name": "Town #7: Turn in the final letter at Shambrin",
          "description": " Here you will get the second 2 skill points",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #72",
          "name": "Town #7: Talk to everyone, then use desert map to go to the dreadnought",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Dreadnought1",
          "name": "The Dreadnought: Find the exit to the dreadnought vanguard, then find and kill Jamara, the Abomination",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-The Dreadnought2",
          "name": "The Dreadnought: Portal back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act2-Town #81",
          "name": "Town #8: Leave the Caravan, talk to the Hooded one, go back to the Caravan, Talk to Asala to go to act 3",
          "description": " ",
          "completed": false,
          "optional": false
        }
      ]
    },
    {
      "id": "act3",
      "name": "Act 3",
      "expanded": false,
      "quests": [
        {
          "id": "act3-Sandswept Marsh1",
          "name": "Sandswept Marsh: Find the exit to the ziggurat encampment (town)",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Town #11",
          "name": "Town #1: Talk to everyone and exit into the Jungle Ruins",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jungle Ruins #11",
          "name": "Jungle Ruins #1: Find the Exit to venom crypts (near waypoint)",
          "description": "do NOT go through, only take the checkpoint and waypoint. ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jungle Ruins #12",
          "name": "Jungle Ruins #1: Find and kill the mighty silverfist",
          "description": " 2 skill points",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jungle Ruins #13",
          "name": "Jungle Ruins #1: Find the exit to the infested barrens",
          "description": "do NOT go through, only take the checkpoint ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jungle Ruins #14",
          "name": "Jungle Ruins #1: Go to the infested barrens",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Infested Barrens #11",
          "name": "Infested Barrens #1: Find the exit to chimeral wetlands",
          "description": "enter zone, take waypoint, backtrack to Infested Barrens ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Infested Barrens #12",
          "name": "Infested Barrens #1: Find the exit to azak bog",
          "description": "enter zone, take waypoint, backtrack to Infested Barrens ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Infested Barrens #13",
          "name": "Infested Barrens #1: Find the Exit to the matlan waterways",
          "description": "here is the waypoint of barrens itself ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Infested Barrens #14",
          "name": "Infested Barrens #1: From whatever you find last, take the waypoint and portal back to Jungle Ruins",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jungle Ruins #21",
          "name": "Jungle Ruins #2: Enter the Venom Crypts",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Venom Crypts1",
          "name": "Venom Crypts: Find the corpse for the venom phial, then go back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Town #21",
          "name": "Town #2: go back to town, turn in phial at Servi for a reward",
          "description": "Reward is permanent and cannot be changed later ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Town #22",
          "name": "Town #2: Go to the Azak Bog",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Azak Bog1",
          "name": "The Azak Bog: find the Flameskin ritual and activate all, it gives 25% fire res and rarity for the rest of the zone",
          "description": "if you don't find it before the boss, don't search for it, but don't skip it if you do find it before the boss ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Azak Bog2",
          "name": "The Azak Bog: Find and kill Ignagduk",
          "description": " 30  spirit",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Azak Bog3",
          "name": "The Azak Bog: Go back to town and then to Chimeral Wetlands",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Chimeral Wetlands1",
          "name": "The Chimeral Wetlands: Find the temple/trial of chaos",
          "description": "Found by following the righthand border of the zone\r\nenter zone, take waypoint, waypoint back to Wetlands (ONLY ON NORMAL DIFFICULTY) ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Chimeral Wetlands2",
          "name": "The Chimeral Wetlands: Find and kill the chimeara boss",
          "description": "found by following the lefthand border of the zone ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Chimeral Wetlands3",
          "name": "The Chimeral Wetlands: Enter Juquani's Machinarium",
          "description": "Behind the chimera boss ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Machinarium1",
          "name": "Jiquani's Machinarium: Find the first small soul core, then open the door",
          "description": "either left or right of alva ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Machinarium2",
          "name": "Jiquani's Machinarium: Find two more small soul cores",
          "description": "There are three in total, but you only need two. The third door is only some gold and a chest. ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Machinarium3",
          "name": "Jiquani's Machinarium: Find the exit towards Jiquani's sanctum",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Machinarium4",
          "name": "Jiquani's Machinarium: Find and kill Blackjaw",
          "description": " 10% fire res",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Machinarium5",
          "name": "Jiquani's Machinarium: Checkpoint port to the exit, then go to Jiquani's Sanctum",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Sanctum1",
          "name": "Jiquani's Sanctum: Don't forget the activate the waypoint right after the entry.",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Sanctum2",
          "name": "Jiquani's Sanctum: Talk to alva",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Sanctum3",
          "name": "Jiquani's Sanctum: Find two medium soul cores",
          "description": "Soul cores are completely random in the zone. ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Sanctum4",
          "name": "Jiquani's Sanctum: Activate both generators\r\nImportant: Place down a portal BEFORE you activate the second generator.",
          "description": "Generators are always to the left and the right back (relativ to where Alva is standing) ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Sanctum5",
          "name": "Jiquani's Sanctum: Portal back to town and waypoint back to the Jiquani's Sanctum.",
          "description": "it's arguable whether that is actually faster, because the \"power\" has to travel along the ground towards alva anyways first. ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Sanctum6",
          "name": "Jiquani's Sanctum: Kill Zicoatl, Warden of the core and loot the large soul core",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Jiquani's Sanctum7",
          "name": "Jiquani's Sanctum: Go back to the infested barrens waypoint",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Infested Barrens #21",
          "name": "Infested Barrens #2: Insert the large soul core and go to matlan waterways afterwards",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Matlan Waterways1",
          "name": "Matlan Waterways: Activate every single lever to navigate through the zone, then activate the big one at the end",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Matlan Waterways2",
          "name": "Matlan Waterways: Port back to town",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Town #31",
          "name": "Town #3: Go down the stairs near the well / the hooded one",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Town #32",
          "name": "Town #3: Talk to alva, enter the drowned city",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Drowned City1",
          "name": "The Drowned City: Find the exit to the molten vault",
          "description": "it is almost always to the north west of the zone\r\nenter zone, take waypoint, backtrack to the drowned city. Only needed on first character per league ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Drowned City2",
          "name": "The Drowned City: Find the exit to the apex of filth",
          "description": "it is almost always to the north east of the zone.\r\nenter zone, take waypoint, backtrack to the drowned city. Backtracking only needed on first character per league ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Drowned City3",
          "name": "The Drowned City: Enter the Molten Vault",
          "description": "only needed on first character per league ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Drowned City4",
          "name": "The Drowned City: Enter the Apex of Filth",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Molten Vault1",
          "name": "The Molten Vault: Find and kill the boss, then talk to Oswald back in town",
          "description": "Only needed on first character per league unlocks the \r\nreforging bench",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Molten Vault2",
          "name": "The Molten Vault: Enter the Apex of Filth",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Apex of Filth1",
          "name": "The Apex of Filth: Find and kill the queen of filth, then portal back to town",
          "description": "The zone layout is always a huge spiral, either clockwise or counterclockwise. \r\nAfter you travelled a full 360° of that spiral, you will find the boss ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Town #41",
          "name": "Town #4: Go down the stairs near the well / the hooded one again, and enter the Temple of Kopec",
          "description": "opposite of the drowned city ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Temple of Kopec1",
          "name": "The Temple of Kopec: go up the stairs twice, then Kill Ketzuli, High priest of the Sun",
          "description": "The stairs are always in either of the corners of the triangle shaped zone. Stay in the shade to not take damage ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Intermediate / Town #51",
          "name": "Intermediate / Town #5: Talk to Alva and ride the elevator up",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Intermediate / Town #52",
          "name": "Intermediate / Town #5: Go through the gateway, then down the stairs again to enter Utzaal",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Utzaal1",
          "name": "Utzaal: The sacrificial heart can randomly drop in this zone",
          "description": "If you don't find it in Utzaal, just go to the next zone, do not farm in this zone until it drops ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Utzaal2",
          "name": "Utzaal: Search and kill Viper Napuatzi.",
          "description": "She is always towards the right end of the zone, facing north. ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Utzaal3",
          "name": "Utzaal: Find the exit to Aggorat and enter aggorat",
          "description": "It is again always to the top right end of the zone, facing north ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Aggorat1",
          "name": "Aggorat: Follow the voices of the trial of Atziri (on the big plaza), go through to find the next checkpoint",
          "description": "Yes, that means having sound on is beneficial in this zone! ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Aggorat2",
          "name": "Aggorat: Find the exit towards the Black Chambers",
          "description": "After the big plaza, it is always to the top left end of the zone ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Aggorat3",
          "name": "Aggorat: Find the Sacrificial table",
          "description": "After the big plaza, it is always to the the top right end of the zone ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Aggorat4",
          "name": "Aggorat: The sacrificial heart can randomly drop in this zone",
          "description": "If you haven't found it until now, continue to kill monsters until you find it. ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Aggorat5",
          "name": "Aggorat: checkpoint port to the sacrificial table, loot the dagger, place the heart, stab the heart",
          "description": " 2 skill points",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Aggorat6",
          "name": "Aggorat: checkpoint port to the black chambers, enter the black chambers",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-The Black Chambers1",
          "name": "The Black Chambers: Find and defeat Doryiani, Royal Thaumaturge",
          "description": "He is always to the top left of the zone ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Intermediate / Town #61",
          "name": "Intermediate / Town #6: Port back to town, walk through the gateway to enter Act 1 Cruel",
          "description": " ",
          "completed": false,
          "optional": false
        },
        {
          "id": "act3-Intermediate / Town #62",
          "name": "Intermediate / Town #6: Port back to town, talk to Doryiana to finish the campaign.",
          "description": " ",
          "completed": false,
          "optional": false
        }
      ]
    }
  ];
