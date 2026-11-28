// Music at the evening gathering: the first villager to settle in round the
// well plays a little guitar for the others. Pure.
import type { Villager } from '../entities/villager';

/** Who is playing the guitar now (null when nobody is gathered). */
export function eveningMusician(villagers: readonly Villager[]): Villager | null {
  let player: Villager | null = null;
  for (const villager of villagers) {
    const gathered = villager.activity === 'gather' && villager.atErrand && !villager.hidden;
    if (gathered && (!player || villager.id < player.id)) player = villager;
  }
  return player;
}
