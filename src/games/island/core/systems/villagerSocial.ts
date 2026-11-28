// Villagers being social. Two villagers who meet while strolling (or gathering
// round the well in the evening) stop and chat a little, facing each other and
// taking turns with a speech bubble. They wave when the player comes near, and
// hum (a note bubble) now and then at their chores. Pure: timers advance by the
// fixed step; randomness comes from the game's rng.
import type { Rng } from '@/shared/engine/random';
import type { IslandConfig } from '../config';
import type { Direction, Player } from '../entities/player';
import type { BubbleKind, Villager } from '../entities/villager';

type SocialSettings = IslandConfig['social'];

/** Activities during which a villager will stop to chat (not in the middle of a chore). */
const SOCIAL_ACTIVITIES = new Set(['wander', 'gather', 'owl']);
/** Chores that bring out a hum. */
const HUMMING_CHORES = new Set(['bake', 'sweep', 'fish', 'water', 'read']);
/** Gathered (the evening by the well, the night owl on its bench): they chat across a wider circle. */
const GATHERED = new Set(['gather', 'owl']);
/** What a speaker shows in turn during a chat. */
const CHAT_BUBBLES: readonly BubbleKind[] = ['dots', 'smile', 'dots', 'note'];

function facingTowards(from: Player, to: Player): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

const free = (v: Villager): boolean =>
  !v.hidden && !v.talking && v.chat === null && v.route.length === 0 && !v.moving;

function say(villager: Villager, kind: BubbleKind, seconds: number): void {
  villager.bubble = { kind, seconds };
}

/** Starts a chat between two villagers: they face each other; the first speaks. */
function startChat(a: Villager, b: Villager, rng: Rng, settings: SocialSettings): void {
  a.chat = { partner: b.id, seconds: settings.chatSeconds };
  b.chat = { partner: a.id, seconds: settings.chatSeconds };
  if (!a.sitting) a.facing = facingTowards(a, b);
  if (!b.sitting) b.facing = facingTowards(b, a);
  say(a, rng.pick(CHAT_BUBBLES), settings.chatTurnSeconds);
}

/** One fixed step of village social life. */
export function updateSocial(
  villagers: readonly Villager[],
  player: Player | null,
  rng: Rng,
  stepSeconds: number,
  settings: SocialSettings,
  tileSizePx: number,
): void {
  for (const v of villagers) {
    v.chatCooldown = Math.max(0, v.chatCooldown - stepSeconds);
    v.waveCooldown = Math.max(0, v.waveCooldown - stepSeconds);
    if (v.bubble) {
      v.bubble.seconds -= stepSeconds;
      if (v.bubble.seconds <= 0) v.bubble = null;
    }
  }

  // Chats in progress: take turns, then say goodbye and go on.
  for (const v of villagers) {
    if (!v.chat) continue;
    v.chat.seconds -= stepSeconds;
    const partner = villagers.find((other) => other.id === v.chat?.partner);
    if (v.chat.seconds <= 0 || !partner || partner.hidden) {
      v.chat = null;
      v.chatCooldown = settings.chatCooldownSeconds;
      continue;
    }
    // The turn passes when the speaker's bubble runs out (the lower id hands it over).
    if (!v.bubble && !partner.bubble && v.id < partner.id) {
      const nextSpeaker = rng.chance(0.5) ? v : partner;
      say(nextSpeaker, rng.pick(CHAT_BUBBLES), settings.chatTurnSeconds);
    }
  }

  // New chats: two free, strolling villagers close to each other.
  for (let i = 0; i < villagers.length; i++) {
    const a = villagers[i];
    if (!a || !free(a) || a.chatCooldown > 0 || !SOCIAL_ACTIVITIES.has(a.activity)) continue;
    for (let j = i + 1; j < villagers.length; j++) {
      const b = villagers[j];
      if (!b || !free(b) || b.chatCooldown > 0 || !SOCIAL_ACTIVITIES.has(b.activity)) continue;
      const gathered = GATHERED.has(a.activity) && GATHERED.has(b.activity);
      const range =
        (gathered ? settings.gatherChatRangeTiles : settings.chatRangeTiles) * tileSizePx;
      if (Math.hypot(a.x - b.x, a.y - b.y) > range) continue;
      startChat(a, b, rng, settings);
      break;
    }
  }

  for (const v of villagers) {
    if (v.hidden || v.talking || v.chat) continue;
    // A wave when the player comes near.
    if (
      player &&
      v.waveCooldown <= 0 &&
      Math.hypot(player.x - v.x, player.y - v.y) <= settings.waveRangeTiles * tileSizePx
    ) {
      if (!v.sitting && !v.moving) v.facing = facingTowards(v, player);
      say(v, 'wave', settings.waveSeconds);
      v.waveCooldown = settings.waveCooldownSeconds;
      continue;
    }
    // A hum now and then at a chore.
    if (v.atErrand && HUMMING_CHORES.has(v.activity)) {
      v.humIn -= stepSeconds;
      if (v.humIn <= 0 && !v.bubble) {
        // A fisher now and then shows off a catch instead.
        const caught = v.activity === 'fish' && rng.chance(settings.catchShare);
        say(v, caught ? 'fish' : 'note', settings.humSeconds);
        v.humIn = rng.range(settings.humMinSeconds, settings.humMaxSeconds);
      }
    }
  }
}
