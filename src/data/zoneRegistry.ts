import { ZoneRegistry } from '../types';

/**
 * Zone Registry for Path of Exile 2
 * Maps zone IDs to human-readable names for auto-completion matching
 * Includes normalized names for case-insensitive matching
 */
export const zoneRegistry: ZoneRegistry = {
  version: '2.0',
  game: 'poe2',
  zonesByAct: [
    {
      actNumber: 1,
      zones: [
        { id: 'a1_riverbank', name: 'The Riverbank', normalizedName: 'the riverbank' },
        { id: 'a1_town', name: 'Clearfell Encampment', normalizedName: 'clearfell encampment' },
        { id: 'a1_clearfell', name: 'Clearfell', normalizedName: 'clearfell' },
        { id: 'a1_clearfell_ruins', name: 'Clearfell Ruins', normalizedName: 'clearfell ruins' },
        { id: 'a1_freythorn', name: 'Freythorn', normalizedName: 'freythorn' },
        { id: 'a1_hunting_grounds', name: 'The Hunting Grounds', normalizedName: 'the hunting grounds' },
        { id: 'a1_mud_burrow', name: 'The Mud Burrow', normalizedName: 'the mud burrow' },
        { id: 'a1_gravesong', name: 'Gravesong', normalizedName: 'gravesong' },
        { id: 'a1_timber_vale', name: 'Timber Vale', normalizedName: 'timber vale' },
        { id: 'a1_cemetery_of_the_first', name: 'Cemetery of the First', normalizedName: 'cemetery of the first' },
        { id: 'a1_lachlann_tomb', name: "Lachlann's Tomb", normalizedName: "lachlann's tomb" },
        { id: 'a1_grelwood', name: 'Grelwood', normalizedName: 'grelwood' },
        { id: 'a1_manor_ramparts', name: 'Manor Ramparts', normalizedName: 'manor ramparts' },
        { id: 'a1_manor_estate', name: 'Manor Estate', normalizedName: 'manor estate' },
        { id: 'a1_manor_halls', name: 'Manor Halls', normalizedName: 'manor halls' },
        { id: 'a1_count_throne_room', name: "Count's Throne Room", normalizedName: "count's throne room" },
      ],
    },
    {
      actNumber: 2,
      zones: [
        { id: 'a2_town', name: 'Sandswept Marsh', normalizedName: 'sandswept marsh' },
        { id: 'a2_valley_of_titans', name: 'Valley of the Titans', normalizedName: 'valley of the titans' },
        { id: 'a2_halani_gates', name: 'The Halani Gates', normalizedName: 'the halani gates' },
        { id: 'a2_the_dreadnought', name: 'The Dreadnought', normalizedName: 'the dreadnought' },
        { id: 'a2_traitors_passage', name: "Traitor's Passage", normalizedName: "traitor's passage" },
        { id: 'a2_kabala_outskirts', name: 'Kabala Outskirts', normalizedName: 'kabala outskirts' },
        { id: 'a2_kabala_streets', name: 'Kabala Streets', normalizedName: 'kabala streets' },
        { id: 'a2_deshar_excavation_site', name: 'Deshar Excavation Site', normalizedName: 'deshar excavation site' },
        { id: 'a2_tomb_of_the_consort', name: 'Tomb of the Consort', normalizedName: 'tomb of the consort' },
        { id: 'a2_the_bone_pit', name: 'The Bone Pit', normalizedName: 'the bone pit' },
        { id: 'a2_the_canyon_ruins', name: 'The Canyon Ruins', normalizedName: 'the canyon ruins' },
        { id: 'a2_valley_of_jamanra', name: 'Valley of Jamanra', normalizedName: 'valley of jamanra' },
        { id: 'a2_the_molten_vault', name: 'The Molten Vault', normalizedName: 'the molten vault' },
        { id: 'a2_mesa_ziggurat', name: 'Mesa Ziggurat', normalizedName: 'mesa ziggurat' },
        { id: 'a2_the_burning_monolith', name: 'The Burning Monolith', normalizedName: 'the burning monolith' },
        { id: 'a2_the_radiant_grove', name: 'The Radiant Grove', normalizedName: 'the radiant grove' },
        { id: 'a2_trial_of_the_sekhema', name: 'Trial of the Sekhema', normalizedName: 'trial of the sekhema' },
      ],
    },
    {
      actNumber: 3,
      zones: [
        { id: 'a3_town', name: 'Aggorat', normalizedName: 'aggorat' },
        { id: 'a3_the_azak_bog', name: 'The Azak Bog', normalizedName: 'the azak bog' },
        { id: 'a3_the_shrouded_bog', name: 'The Shrouded Bog', normalizedName: 'the shrouded bog' },
        { id: 'a3_the_lost_city', name: 'The Lost City', normalizedName: 'the lost city' },
        { id: 'a3_the_skeletal_temple', name: 'The Skeletal Temple', normalizedName: 'the skeletal temple' },
        { id: 'a3_ogham_village', name: 'Ogham Village', normalizedName: 'ogham village' },
        { id: 'a3_ogham_manor', name: 'Ogham Manor', normalizedName: 'ogham manor' },
        { id: 'a3_the_jungle_ruins', name: 'The Jungle Ruins', normalizedName: 'the jungle ruins' },
        { id: 'a3_the_vaal_factory', name: 'The Vaal Factory', normalizedName: 'the vaal factory' },
        { id: 'a3_the_temple_of_chaos', name: 'The Temple of Chaos', normalizedName: 'the temple of chaos' },
        { id: 'a3_aggorat_sewers', name: 'Aggorat Sewers', normalizedName: 'aggorat sewers' },
        { id: 'a3_the_flooded_depths', name: 'The Flooded Depths', normalizedName: 'the flooded depths' },
        { id: 'a3_the_shining_trench', name: 'The Shining Trench', normalizedName: 'the shining trench' },
        { id: 'a3_the_molten_vault', name: 'The Molten Vault', normalizedName: 'the molten vault' },
      ],
    },
  ],
};

/**
 * Get zone ID by zone name (case-insensitive)
 * @param zoneName - The zone name to look up
 * @returns The zone ID or null if not found
 */
export function getZoneId(zoneName: string): string | null {
  const normalized = zoneName.toLowerCase().trim();
  for (const act of zoneRegistry.zonesByAct) {
    const zone = act.zones.find((z) => z.normalizedName === normalized);
    if (zone) {
      return zone.id;
    }
  }
  return null;
}

/**
 * Get zone info by zone name (case-insensitive)
 * @param zoneName - The zone name to look up
 * @returns The zone info or null if not found
 */
export function getZoneInfo(zoneName: string): { id: string; name: string; actNumber: number } | null {
  const normalized = zoneName.toLowerCase().trim();
  for (const act of zoneRegistry.zonesByAct) {
    const zone = act.zones.find((z) => z.normalizedName === normalized);
    if (zone) {
      return {
        id: zone.id,
        name: zone.name,
        actNumber: act.actNumber,
      };
    }
  }
  return null;
}

/**
 * Get all zones for a specific act
 * @param actNumber - The act number (1, 2, 3, etc.)
 * @returns Array of zone IDs for the act
 */
export function getZonesForAct(actNumber: number): string[] {
  const act = zoneRegistry.zonesByAct.find((a) => a.actNumber === actNumber);
  return act ? act.zones.map((z) => z.id) : [];
}
