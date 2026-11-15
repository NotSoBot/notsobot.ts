import { Command, GatewayClientEvents, Interaction, Structures } from 'detritus-client';
import {
  ClientEvents,
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageComponentInputTextStyles,
  MessageFlags,
} from 'detritus-client/lib/constants';
import {
  ComponentContext,
  Components,
  InteractionModal,
  InteractionModalArgs,
  InteractionModalContext,
} from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { EmbedColors, GameFlagDifficulties, StatusEmojis } from '../../../constants';
import {
  Country,
  CountryMatcher,
  CountryTiers,
  countriesForTier,
  countryEmoji,
  countryName,
  countryRegion,
} from '../../countries';
import { getTranslator, TranslationKey, Translator } from '../../i18n';
import {
  DisplayPayload,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayReply,
  displayTimestamp,
  editOrReply,
  isCommandRunCancelled,
  renderDisplay,
} from '../../../utils';


export const COMMAND_ID = 'game.flag';

export const DEFAULT_ROUNDS = 10;
export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 20;

// every flag starts worth `MAX_POINTS`, each hint takes a point off, so knowing it right away pays the most
export const HINT_TIME = 10 * 1000;
export const MAX_POINTS = 3;
export const ROUND_TIME = MAX_POINTS * HINT_TIME;
// naming this many flags in a row (without anyone else naming one in between) adds a point to each one after
export const STREAK_BONUS_AT = 3;
// the result stays up on its own for a moment before the next flag
const BREAK_TIME = 4 * 1000;
// flags in a row nobody even tried before the game ends itself
const IDLE_ROUNDS = 2;
// longer messages are people talking, not guessing
const MAX_GUESS_LENGTH = 64;
// buttons stay listening a little past their round, so a click right at the end still gets an answer
const COMPONENTS_TIMEOUT_PADDING = 10 * 1000;
// a slash command's token can only send and edit its messages for 15 minutes, 20 rounds fit in about 12
const INTERACTION_TOKEN_TIME = 15 * 60 * 1000 - 30 * 1000;
// how many players the scores line under a result shows, the final standings show everyone
const SCORES_SHOWN = 5;

// flagcdn (flagpedia) has every iso country at its real aspect ratio, they're fetched once and attached as `flag.png`
// so the answer isn't in an image url anyone could open
const FLAG_URL = (code: string) => `https://flagcdn.com/w640/${code}.png`;
const FLAG_FILENAME = 'flag.png';
const FLAG_FETCH_TIMEOUT = 10 * 1000;

export const DIFFICULTY_TIERS: Record<GameFlagDifficulties, CountryTiers> = {
  [GameFlagDifficulties.EASY]: CountryTiers.EASY,
  [GameFlagDifficulties.MEDIUM]: CountryTiers.MEDIUM,
  [GameFlagDifficulties.HARD]: CountryTiers.HARD,
};

const DIFFICULTY_KEYS: Record<GameFlagDifficulties, TranslationKey> = {
  [GameFlagDifficulties.EASY]: 'game.flag.difficulty.easy',
  [GameFlagDifficulties.MEDIUM]: 'game.flag.difficulty.medium',
  [GameFlagDifficulties.HARD]: 'game.flag.difficulty.hard',
};

export interface CommandArgs {
  difficulty?: GameFlagDifficulties,
  rounds?: number,
}

type GameContext = Command.Context | Interaction.InteractionContext;

enum RoundOutcomes {
  CORRECT = 'CORRECT',
  SKIPPED = 'SKIPPED',
  TIMED_OUT = 'TIMED_OUT',
}

interface GameRound {
  country: Country,
  deadline: number,
  finished: boolean,
  flag: Buffer,
  // hints shown so far, 0 to `MAX_POINTS - 1`
  hints: number,
  // the round's message, null for the command's own response (the first round)
  message: Structures.Message | null,
  number: number,
  // set once it's over
  result: string | null,
  startedAt: number,
  // someone guessed (right or wrong, in chat or with the button), so it isn't an idle round
  tried: boolean,
}

interface Game {
  channelId: string,
  context: GameContext,
  difficulty: GameFlagDifficulties,
  // edits of the round messages go one at a time, so a slow hint edit can't land after the result
  edits: Promise<void>,
  expiresAt: number,
  finished: boolean,
  hintTimer: Timers.Timeout,
  hostId: string,
  idleRounds: number,
  matcher: CountryMatcher,
  // the flags for this game in order, picked when it starts so none repeat
  pool: Array<Country>,
  // the bot is in the channel's guild (or it's a prefixed command/its own dm), so chat messages reach it
  readsChat: boolean,
  round: GameRound | null,
  rounds: number,
  scores: Map<string, number>,
  streak: {count: number, userId: string} | null,
  subscription: EventSubscription | null,
  timer: Timers.Timeout,
  translator: Translator,
}

// one game per channel, so guesses go to the right one
const activeGames = new Map<string, Game>();
const flagCache = new Map<string, Promise<Buffer>>();


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { translate } = translator;
  const channelId = context.channelId || context.userId;
  // editing a prefixed trigger re-runs it, the game from the old run can't edit its message anymore
  const existing = activeGames.get(channelId);
  if (existing && isCommandRunCancelled(existing.context)) {
    cleanupGame(existing);
  }
  if (activeGames.has(channelId)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('game.flag.already_running')}`});
  }

  const difficulty = args.difficulty || GameFlagDifficulties.EASY;
  const pool = shuffle(countriesForTier(DIFFICULTY_TIERS[difficulty]));
  const rounds = Math.min(Math.max(Math.floor(args.rounds || DEFAULT_ROUNDS), MIN_ROUNDS), MAX_ROUNDS, pool.length);

  const game: Game = {
    channelId,
    context,
    difficulty,
    edits: Promise.resolve(),
    expiresAt: (context instanceof Command.Context) ? Infinity : Date.now() + INTERACTION_TOKEN_TIME,
    finished: false,
    hintTimer: new Timers.Timeout(),
    hostId: context.userId,
    idleRounds: 0,
    // english always counts, plus the server's language
    matcher: new CountryMatcher(pool, [translator.language]),
    pool: pool.slice(0, rounds),
    readsChat: (context instanceof Command.Context) || context.interaction.isBotPresent,
    round: null,
    rounds,
    scores: new Map(),
    streak: null,
    subscription: null,
    timer: new Timers.Timeout(),
    translator,
  };
  activeGames.set(channelId, game);

  if (game.readsChat) {
    game.subscription = context.client.subscribe(ClientEvents.MESSAGE_CREATE, (event: GatewayClientEvents.MessageCreate) => {
      onChatMessage(game, event.message).catch(() => {});
    });
  }

  try {
    await startRound(game);
  } catch(error) {
    cleanupGame(game);
    throw error;
  }
}


function shuffle<T>(values: Array<T>): Array<T> {
  const shuffled = values.slice();
  for (let i = shuffled.length - 1; 0 < i; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


function fetchFlag(country: Country): Promise<Buffer> {
  let promise = flagCache.get(country.code);
  if (!promise) {
    promise = (async () => {
      const response = await fetch(FLAG_URL(country.code), {signal: AbortSignal.timeout(FLAG_FETCH_TIMEOUT)});
      if (!response.ok) {
        throw new Error(`Flag ${country.code} returned ${response.status}`);
      }
      return Buffer.from(await response.arrayBuffer());
    })();
    // a failed fetch isn't kept, the next game tries again
    promise.catch(() => flagCache.delete(country.code));
    flagCache.set(country.code, promise);
  }
  return promise;
}


function cleanupGame(game: Game): void {
  game.finished = true;
  game.timer.stop();
  game.hintTimer.stop();
  if (game.subscription) {
    game.subscription.remove();
    game.subscription = null;
  }
  if (activeGames.get(game.channelId) === game) {
    activeGames.delete(game.channelId);
  }
}


function roundPoints(round: GameRound): number {
  return MAX_POINTS - round.hints;
}


// "N _ _   Z _ _ _ _ _ _", the first letter of every word and how long it is
function formatLetters(name: string): string {
  const words = name.split(/\s+/).map((word) => {
    return Array.from(word).map((character, index) => {
      if (!index || !/\p{L}/u.test(character)) {
        return character;
      }
      return '_';
    }).join(' ');
  });
  return `\`${words.join('   ')}\``;
}


function formatCountry(game: Game, country: Country): string {
  return `${countryEmoji(country)} **${countryName(country, game.translator.language)}**`;
}


function formatScores(game: Game, limit: number): Array<string> {
  const sorted = Array.from(game.scores.entries()).sort((x, y) => y[1] - x[1]);
  return sorted.slice(0, limit).map(([ userId, points ], index) => {
    return displayDetailsLine([`**${index + 1}.** <@${userId}>`, game.translator.translate('game.flag.points', {points})]);
  });
}


function createRoundPayload(game: Game, round: GameRound): DisplayPayload {
  const { translate } = game.translator;
  const file = {filename: FLAG_FILENAME, value: round.flag};
  const title = translate('game.flag.round_title', {number: round.number, total: game.rounds});

  if (round.finished) {
    const scores = formatScores(game, SCORES_SHOWN);
    return {
      description: displayDetails([
        round.result,
        (scores.length) ? `\n**${translate('game.flag.scores')}**` : null,
        ...scores,
      ]),
      files: [file],
      image: `attachment://${FLAG_FILENAME}`,
      title,
    };
  }

  const hints: Array<string> = [];
  if (1 <= round.hints) {
    hints.push(displayDetail(translate('game.flag.region'), translate(`game.flag.region.${countryRegion(round.country)}` as TranslationKey)));
  }
  if (2 <= round.hints) {
    hints.push(displayDetail(translate('game.flag.letters'), formatLetters(countryName(round.country, game.translator.language))));
  }
  const lastHint = MAX_POINTS - 1 <= round.hints;
  const nextChange = (lastHint) ? round.deadline : round.startedAt + (round.hints + 1) * HINT_TIME;
  return {
    components: createRoundComponents(game, round),
    componentsInside: true,
    description: displayDetails([
      (game.readsChat) ? translate('game.flag.prompt_chat') : translate('game.flag.prompt_button'),
      ...hints,
    ]),
    files: [file],
    image: `attachment://${FLAG_FILENAME}`,
    note: displayDetailsLine([
      translate('game.flag.worth', {points: roundPoints(round)}),
      translate(DIFFICULTY_KEYS[game.difficulty]),
      (lastHint) ? (
        translate('game.flag.time_runs_out', {time: displayTimestamp(nextChange)})
      ) : (
        translate('game.flag.next_hint', {time: displayTimestamp(nextChange)})
      ),
    ]),
    title,
  };
}


function createRoundComponents(game: Game, round: GameRound): Components {
  const { translate } = game.translator;
  const components = new Components({timeout: Math.max(round.deadline - Date.now(), 0) + COMPONENTS_TIMEOUT_PADDING});

  components.createButton({
    label: translate('game.flag.guess'),
    run: async (ctx: ComponentContext) => {
      if (round.finished) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      return ctx.respond(createGuessModal(game, round, await getTranslator(ctx)));
    },
  });

  components.createButton({
    label: translate('game.flag.skip'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (round.finished) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      if (ctx.userId !== game.hostId) {
        const { translate } = await getTranslator(ctx);
        return respondEphemeral(ctx, translate('game.flag.only_host', {user: `<@${game.hostId}>`}));
      }
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await endRound(game, round, RoundOutcomes.SKIPPED, null);
    },
  });

  components.createButton({
    label: translate('game.flag.stop'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (game.finished) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      if (ctx.userId !== game.hostId) {
        const { translate } = await getTranslator(ctx);
        return respondEphemeral(ctx, translate('game.flag.only_host', {user: `<@${game.hostId}>`}));
      }
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      const reason = translate('game.flag.stopped', {user: `<@${ctx.userId}>`});
      // between flags there's no round left to end, the next one just doesn't start
      if (round.finished || game.round !== round) {
        return finishGame(game, reason);
      }
      await endRound(game, round, RoundOutcomes.SKIPPED, null, reason);
    },
  });

  return components;
}


// for wherever chat doesn't reach the bot (a user install in a server it isn't in), and for anyone who'd rather not
// guess where everyone can see it
function createGuessModal(game: Game, round: GameRound, translator: Translator): InteractionModal {
  const { translate } = translator;
  const modal = new InteractionModal({
    timeout: Math.max(round.deadline - Date.now(), 0) + COMPONENTS_TIMEOUT_PADDING,
    title: translate('game.flag.modal_title'),
    run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
      const guess = String(args.guess || '');
      if (round.finished) {
        return respondEphemeral(modalContext, translate('game.flag.round_over'));
      }
      round.tried = true;
      if (!game.matcher.isCorrect(round.country, guess)) {
        return respondEphemeral(modalContext, `${StatusEmojis.NO} ${translate('game.flag.wrong')}`);
      }
      await modalContext.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await endRound(game, round, RoundOutcomes.CORRECT, modalContext.userId);
    },
  });
  modal.createLabel({
    label: translate('game.flag.modal_label'),
  }).createInputText({
    customId: 'guess',
    maxLength: MAX_GUESS_LENGTH,
    required: true,
    style: MessageComponentInputTextStyles.SHORT,
  });
  return modal;
}


// plain text, detritus keys a click's response listener by the clicked message, so a reply with components would take
// over the round's buttons (same as the imagine game)
function respondEphemeral(ctx: ComponentContext | InteractionModalContext, content: string) {
  return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
    allowedMentions: {parse: []},
    content,
    flags: MessageFlags.EPHEMERAL,
  });
}


async function onChatMessage(game: Game, message: Structures.Message): Promise<void> {
  if (message.channelId !== game.channelId || message.fromBot || game.finished) {
    return;
  }
  const round = game.round;
  if (!round || round.finished) {
    return;
  }
  // any talking counts as playing, only short messages are guesses
  round.tried = true;
  const content = message.content;
  if (!content || MAX_GUESS_LENGTH < content.length) {
    return;
  }
  if (!game.matcher.isCorrect(round.country, content)) {
    return;
  }
  const emoji = StatusEmojis.YES.replace(/^<:|>$/g, '');
  message.react(emoji).catch(() => {});
  await endRound(game, round, RoundOutcomes.CORRECT, message.author.id);
}


async function sendMessage(game: Game, payload: DisplayPayload): Promise<Structures.Message | null> {
  const message = {...await renderDisplay(game.context, payload), allowedMentions: {parse: []}};
  if (game.context instanceof Command.Context) {
    return game.context.rest.createMessage(game.context.channelId, message);
  }
  return game.context.createMessage(message);
}


// renders the round as it is when the edit runs (not when it was queued), one edit at a time
function refreshRound(game: Game, round: GameRound): Promise<void> {
  game.edits = game.edits.then(async () => {
    if (isCommandRunCancelled(game.context)) {
      cleanupGame(game);
      return;
    }
    const message = {...await renderDisplay(game.context, createRoundPayload(game, round)), attachments: []};
    if (!round.message) {
      await editOrReply(game.context, message);
    } else if (game.context instanceof Command.Context) {
      await round.message.edit({...message, allowedMentions: {parse: []}});
    } else {
      await game.context.editMessage(round.message.id, {...message, allowedMentions: {parse: []}});
    }
  }).catch(() => {});
  return game.edits;
}


async function startRound(game: Game): Promise<void> {
  if (game.finished) {
    return;
  }
  // a prefixed command's trigger was edited or deleted, the newer run has its own game
  if (isCommandRunCancelled(game.context)) {
    return cleanupGame(game);
  }
  const number = (game.round) ? game.round.number + 1 : 1;
  const country = game.pool[number - 1];

  let flag: Buffer;
  try {
    flag = await fetchFlag(country);
  } catch(error) {
    return failGame(game, error);
  }
  if (game.finished) {
    return;
  }

  const now = Date.now();
  const round: GameRound = {
    country,
    deadline: now + ROUND_TIME,
    finished: false,
    flag,
    hints: 0,
    message: null,
    number,
    result: null,
    startedAt: now,
    tried: false,
  };
  game.round = round;

  if (number === 1) {
    const message = await renderDisplay(game.context, createRoundPayload(game, round));
    await editOrReply(game.context, message);
  } else {
    try {
      round.message = await sendMessage(game, createRoundPayload(game, round));
    } catch(error) {
      return failGame(game, error);
    }
  }
  // the first flag went up slower than the timers' start, they count from when it's out
  round.startedAt = Date.now();
  round.deadline = round.startedAt + ROUND_TIME;

  scheduleHint(game, round);
  game.timer.start(ROUND_TIME, () => {
    endRound(game, round, RoundOutcomes.TIMED_OUT, null).catch(() => {});
  });

  // the next flag downloads while this one's played
  const next = game.pool[number];
  if (next) {
    fetchFlag(next).catch(() => {});
  }
}


function scheduleHint(game: Game, round: GameRound): void {
  if (MAX_POINTS - 1 <= round.hints) {
    return;
  }
  const at = round.startedAt + (round.hints + 1) * HINT_TIME;
  game.hintTimer.start(Math.max(at - Date.now(), 0), () => {
    if (round.finished || game.round !== round) {
      return;
    }
    round.hints++;
    refreshRound(game, round);
    scheduleHint(game, round);
  });
}


// `stopped` ends the whole game after this round, with that as the reason
async function endRound(
  game: Game,
  round: GameRound,
  outcome: RoundOutcomes,
  userId: string | null,
  stopped: string | null = null,
): Promise<void> {
  if (round.finished || game.round !== round) {
    return;
  }
  round.finished = true;
  game.timer.stop();
  game.hintTimer.stop();

  const { translate } = game.translator;
  const country = formatCountry(game, round.country);
  switch (outcome) {
    case RoundOutcomes.CORRECT: {
      const user = userId!;
      game.streak = (game.streak && game.streak.userId === user) ? {count: game.streak.count + 1, userId: user} : {count: 1, userId: user};
      const bonus = (STREAK_BONUS_AT <= game.streak.count) ? 1 : 0;
      const points = roundPoints(round) + bonus;
      game.scores.set(user, (game.scores.get(user) || 0) + points);
      game.idleRounds = 0;
      round.result = displayDetails([
        `${StatusEmojis.YES} ${translate('game.flag.correct', {user: `<@${user}>`, country, points: translate('game.flag.points', {points})})}`,
        (bonus) ? `-# ${translate('game.flag.streak', {count: game.streak.count})}` : null,
      ]);
    }; break;
    case RoundOutcomes.SKIPPED: {
      game.streak = null;
      round.result = translate('game.flag.skipped', {country});
    }; break;
    case RoundOutcomes.TIMED_OUT: {
      game.streak = null;
      game.idleRounds = (round.tried) ? 0 : game.idleRounds + 1;
      round.result = translate('game.flag.times_up', {country});
    }; break;
  }

  await refreshRound(game, round);

  if (stopped) {
    return finishGame(game, stopped);
  }
  if (game.rounds <= round.number) {
    return finishGame(game, null);
  }
  if (IDLE_ROUNDS <= game.idleRounds) {
    return finishGame(game, translate('game.flag.idle', {count: IDLE_ROUNDS}));
  }
  // another round wouldn't finish before the slash command's token stops working
  if (game.expiresAt < Date.now() + BREAK_TIME + ROUND_TIME + 15 * 1000) {
    return finishGame(game, null);
  }
  game.timer.start(BREAK_TIME, () => {
    startRound(game).catch(() => cleanupGame(game));
  });
}


async function finishGame(game: Game, reason: string | null): Promise<void> {
  if (game.finished) {
    return;
  }
  cleanupGame(game);
  const { translate } = game.translator;

  const sorted = Array.from(game.scores.entries()).sort((x, y) => y[1] - x[1]);
  let outcome: string;
  if (!sorted.length) {
    outcome = translate('game.flag.no_points');
  } else {
    const most = sorted[0][1];
    const winners = sorted.filter(([ userId, points ]) => points === most).map(([ userId ]) => `<@${userId}>`);
    const label = (winners.length === 1) ? translate('game.flag.winner') : translate('game.flag.tie');
    outcome = displayDetailsLine([displayDetail(label, winners.join(', ')), translate('game.flag.points', {points: most})]);
  }

  const played = (game.round) ? game.round.number : 0;
  try {
    await sendMessage(game, {
      description: displayDetails([
        outcome,
        reason ? `-# ${reason}` : null,
        (sorted.length) ? '' : null,
        ...formatScores(game, sorted.length),
      ]),
      note: displayDetailsLine([
        translate('game.flag.flags_played', {count: played}),
        translate(DIFFICULTY_KEYS[game.difficulty]),
      ]),
      title: translate('game.flag.final_title'),
    });
  } catch(error) {

  }
}


async function failGame(game: Game, error: any): Promise<void> {
  if (game.finished) {
    return;
  }
  cleanupGame(game);
  // required here, commands/errors imports utils (and this file with it) back
  const { createRunErrorPayload, warning }: typeof import('../../../commands/errors') = require('../../../commands/errors');
  const payload = await createRunErrorPayload(game.context, warning(game.translator.translate('game.flag.flag_failed')), error, game.translator);
  try {
    if (!game.round) {
      await displayReply(game.context, {...payload, color: EmbedColors.ERROR});
    } else {
      await sendMessage(game, {...payload, color: EmbedColors.ERROR});
    }
  } catch(error) {

  }
}
