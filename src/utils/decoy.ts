// What a decoy channel is made of besides the api's row: a generated name in the server's own style, the notices a
// moderator can copy to post themselves, and the bait the webhook posts. Anything every server got the same would be a
// fingerprint spam tools can learn, so all of it is picked from pools.


// a base name for the channel and an emoji that goes with it: real-looking channels people don't chat in
type NameEntry = [string, string];

const NAME_POOLS: Record<string, Array<NameEntry>> = {
  en: [
    ['art-share', '🎨'],
    ['clips', '🎬'],
    ['screenshots', '📸'],
    ['media-dump', '📁'],
    ['link-dump', '🔗'],
    ['archive', '🗄️'],
    ['old-events', '📅'],
    ['event-recaps', '📅'],
    ['polls-old', '📊'],
    ['wallpapers', '🖼️'],
    ['setups', '🖥️'],
    ['pet-pics', '🐾'],
    ['food-pics', '🍕'],
    ['music-share', '🎵'],
    ['highlights', '⭐'],
    ['giveaway-archive', '🎁'],
    ['bot-logs-old', '📜'],
    ['resources', '📚'],
  ],
  es: [
    ['arte', '🎨'],
    ['clips', '🎬'],
    ['capturas', '📸'],
    ['archivo', '🗄️'],
    ['enlaces', '🔗'],
    ['eventos-viejos', '📅'],
    ['fondos', '🖼️'],
    ['mascotas', '🐾'],
    ['comida', '🍕'],
    ['musica', '🎵'],
    ['destacados', '⭐'],
    ['recursos', '📚'],
  ],
  pt: [
    ['arte', '🎨'],
    ['clipes', '🎬'],
    ['prints', '📸'],
    ['arquivo', '🗄️'],
    ['links', '🔗'],
    ['eventos-antigos', '📅'],
    ['wallpapers', '🖼️'],
    ['pets', '🐾'],
    ['comida', '🍕'],
    ['musicas', '🎵'],
    ['destaques', '⭐'],
    ['recursos', '📚'],
  ],
};

// words that give a decoy away or invite real chat, never generated (they're also skipped when the server already has a
// channel with that name)
const BLOCKED_WORDS = ['bait', 'chat', 'decoy', 'do-not', 'dont', 'general', 'honeypot', 'lounge', 'talk', 'trap'];

// what a server puts between an emoji and a channel's name, `💬┃general`
export const NAME_SEPARATORS = ['┃', '│', '|', '︱', '・', '•', '»', '→', '-', '_', '꒱', '〢', '╏', '┊', '⋮', '⌇'];

// a leading emoji: pictographs with their variation selectors and joiners, or a keycap/flag
const EMOJI_PREFIX = /^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*|[\u{1F1E6}-\u{1F1FF}]{2})/u;


export interface ChannelNameStyle {
  // an emoji goes first
  emoji: boolean,
  // between the emoji (or nothing) and the name, empty: none
  separator: string,
  // words joined with `-` or `_`
  wordSeparator: '-' | '_',
}

export function parseChannelName(name: string): {emoji: boolean, separator: string, core: string} {
  let rest = name;
  let emoji = false;
  const match = rest.match(EMOJI_PREFIX);
  if (match) {
    emoji = true;
    rest = rest.slice(match[0].length);
  }
  let separator = '';
  for (let candidate of NAME_SEPARATORS) {
    if (rest.startsWith(candidate)) {
      separator = candidate;
      rest = rest.slice(candidate.length);
      break;
    }
  }
  // `-` and `_` only count as a separator after an emoji, otherwise they're part of a plain name
  if (!emoji && (separator === '-' || separator === '_')) {
    rest = separator + rest;
    separator = '';
  }
  return {core: rest, emoji, separator};
}

/**
 * The style most of the server's text channels share. A server with fewer than 3 named channels gets plain names, too
 * few to tell its style.
 */
export function detectChannelNameStyle(names: Array<string>): ChannelNameStyle {
  const style: ChannelNameStyle = {emoji: false, separator: '', wordSeparator: '-'};
  if (names.length < 3) {
    return style;
  }
  let emoji = 0;
  let underscores = 0;
  let dashes = 0;
  const separators = new Map<string, number>();
  for (let name of names) {
    const parsed = parseChannelName(name);
    if (parsed.emoji) {
      emoji++;
    }
    separators.set(parsed.separator, (separators.get(parsed.separator) || 0) + 1);
    underscores += (parsed.core.match(/_/g) || []).length;
    dashes += (parsed.core.match(/-/g) || []).length;
  }
  style.emoji = names.length / 2 <= emoji;
  let best = '';
  let bestCount = 0;
  for (let [separator, count] of separators) {
    if (bestCount < count) {
      best = separator;
      bestCount = count;
    }
  }
  style.separator = (names.length / 2 <= bestCount) ? best : '';
  style.wordSeparator = (dashes < underscores) ? '_' : '-';
  return style;
}

function getPool<T>(pools: Record<string, Array<T>>, language: string): Array<T> {
  const code = (language || 'en').toLowerCase().split(/[-_]/)[0];
  return pools[code] || pools.en;
}

function pickRandom<T>(items: Array<T>): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * A name for a new decoy channel in the server's style, from its language's pool, unlike any channel it has already.
 * `random` is for tests.
 */
export function generateDecoyChannelName(
  existingNames: Array<string>,
  language: string,
  random: () => number = Math.random,
): string {
  const style = detectChannelNameStyle(existingNames);
  const taken = new Set(existingNames.map((name) => parseChannelName(name).core.toLowerCase().replace(/_/g, '-')));
  const pool = getPool(NAME_POOLS, language).filter(([word]) => {
    return !taken.has(word) && !BLOCKED_WORDS.some((blocked) => word.includes(blocked));
  });
  const choices = (pool.length) ? pool : getPool(NAME_POOLS, language);
  const [word, emoji] = choices[Math.floor(random() * choices.length)];
  const core = (style.wordSeparator === '_') ? word.replace(/-/g, '_') : word;
  return `${(style.emoji) ? emoji : ''}${(style.emoji || style.separator) ? style.separator : ''}${core}`.slice(0, 100);
}


// a moderator's notice to copy, they post it themselves so the channel's message is a person's. Picked at random so
// servers don't all share one
const NOTICE_POOLS: Record<string, Array<string>> = {
  en: [
    'Please don\'t post in this channel. Anything sent here gets you removed from the server and your recent messages deleted.',
    'This channel is for catching spam accounts. Posting here removes you from the server and deletes your recent messages, so please don\'t.',
    'Heads up: don\'t send anything here. Messages in this channel get the sender kicked and their recent messages cleared.',
    'Nothing to see here. Sending a message in this channel removes you from the server and deletes what you posted recently.',
    'Please leave this channel alone, it catches spam bots. Any message here gets you kicked and your recent messages deleted.',
  ],
  es: [
    'Por favor, no escribas en este canal. Cualquier mensaje aquí te saca del servidor y borra tus mensajes recientes.',
    'Este canal sirve para atrapar cuentas de spam. Escribir aquí te expulsa del servidor y borra tus mensajes recientes.',
    'Aviso: no envíes nada aquí. Quien escriba en este canal es expulsado y se borran sus mensajes recientes.',
  ],
  pt: [
    'Por favor, não escreva neste canal. Qualquer mensagem aqui te remove do servidor e apaga suas mensagens recentes.',
    'Este canal serve para pegar contas de spam. Escrever aqui te expulsa do servidor e apaga suas mensagens recentes.',
    'Aviso: não envie nada aqui. Quem escrever neste canal é expulso e tem as mensagens recentes apagadas.',
  ],
};

export function pickDecoyNotice(language: string): string {
  return pickRandom(getPool(NOTICE_POOLS, language));
}


// what the webhook posts and deletes a moment later, only there long enough to mark the channel as active
const BAIT_TEXTS = [
  'ok', 'lol', 'nice', 'true', 'same', 'yeah', 'haha', 'gg', 'fr', 'wait what', 'oh', 'yep', 'mood', 'real', 'hm',
];

export function pickDecoyBait(): string {
  return pickRandom(BAIT_TEXTS);
}

// the name the webhook posts under, the channel's own words without its emoji or separator, `📁┃media-dump` -> `Media Dump`
export function createDecoyWebhookName(channelName: string): string {
  const words = parseChannelName(channelName).core.split(/[-_\s]+/).filter(Boolean);
  const name = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').slice(0, 80);
  // discord refuses webhooks named after itself (and `clyde`)
  return (!name || /discord|clyde/i.test(name)) ? 'Archive' : name;
}
