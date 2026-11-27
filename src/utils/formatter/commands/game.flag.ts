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

import { awardGamePoints, fetchGameFlag } from '../../../api';
import { EmbedColors, GameFlagDifficulties, GamePointsGames, MessageComponentCustomIds, StatusEmojis } from '../../../constants';
import { log } from '../../../log';
import UserSettingsStore from '../../../stores/usersettings';
import { captureError } from '../../../sentry';
import {
  Countries,
  Country,
  CountryMatcher,
  CountryTiers,
  countriesForTier,
  countryEmoji,
  countryName,
  countryRegion,
} from '../../countries';
import { checkComponentAccess } from '../../componentchecks';
import { canUseEditor } from '../../editoractivity';
import { getCachedTranslator, getTranslator, TranslationKey, Translator } from '../../i18n';
import {
  DisplayPayload,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayTimestamp,
  editOrReply,
  isCommandRunCancelled,
  renderDisplay,
} from '../../../utils';


export const COMMAND_ID = 'game.flag';

// every flag starts worth `MAX_POINTS`, each hint takes a point off, so knowing it right away pays the most
export const HINT_TIME = 20 * 1000;
export const MAX_POINTS = 3;
export const ROUND_TIME = MAX_POINTS * HINT_TIME;
// naming this many flags in a row (without anyone else naming one in between) adds a point to each one after
export const STREAK_BONUS_AT = 3;
// longer messages are people talking, not guessing
const MAX_GUESS_LENGTH = 64;
// buttons stay listening a little past their flag, so a click right at the end still gets an answer
const COMPONENTS_TIMEOUT_PADDING = 10 * 1000;
// how long a finished flag's Play Again button works
const PLAY_AGAIN_TIME = 15 * 60 * 1000;
// how many players the scores under a result show
const SCORES_SHOWN = 5;
// flags a session won't show again until this many others came up (or the pool runs out)
const RECENT_FLAGS = 30;

// the api has every flag at its real proportions (`assets/images/flags`, the overlays use the same files), each one is
// fetched once per process and attached as `flag.png` so the answer isn't in a url anyone could open. Shown as the
// message's image, a thumbnail would crop it to a square and cut wide flags off. 320px keeps it from taking over the
// channel (it's one message per flag anyway)
const FLAG_WIDTH = 320;
const FLAG_FILENAME = 'flag.png';

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
}

// a Play Again click starts the next flag from its button
type GameContext = Command.Context | Interaction.InteractionContext | ComponentContext;

enum RoundOutcomes {
  CORRECT = 'CORRECT',
  // Open in Activity took its flag into a room (`holdForActivity`), its answer isn't shown
  MOVED = 'MOVED',
  SKIPPED = 'SKIPPED',
  TIMED_OUT = 'TIMED_OUT',
}

// carried from one flag to the next through Play Again, running the command again starts a new one
interface GameSession {
  difficulty: GameFlagDifficulties,
  // the latest flags shown, so they don't come right back
  recent: Array<string>,
  scores: Map<string, number>,
  streak: {count: number, userId: string} | null,
}

// one flag, its message is the command's (or the Play Again click's) response
interface Game {
  // its start was deleted (or a prefixed trigger edited into a new run), it stopped and took its message with it
  aborted: boolean,
  // an aborted game whose message stays: an edited trigger's new run replies in it
  abortKeepsResponse: boolean,
  // an Open in Activity press is launching with its flag: guesses and the skip don't count until it's settled
  // (`holdForActivity`)
  carrying: boolean,
  channelId: string,
  context: GameContext,
  country: Country,
  deadline: number,
  // messages deleted while the flag was going up (its id isn't known yet), checked against it once it is. null after
  deletedWhilePosting: Array<string> | null,
  // edits of the message go one at a time (the first post too), so a slow hint edit or an early guess's result can't
  // land before or after the wrong one
  edits: Promise<void>,
  finished: boolean,
  flag: Buffer,
  hintTimer: Timers.Timeout,
  // hints shown so far, 0 to `MAX_POINTS - 1`
  hints: number,
  hostId: string,
  matcher: CountryMatcher,
  // the scorer's global points total, once the api answered the award (only shown if that's before the result renders)
  pointsTotal: number | null,
  // the bot is in the channel's guild (or it's a prefixed command/its own dm), so chat messages reach it
  readsChat: boolean,
  responseId: string | undefined,
  // set once it's over
  result: string | null,
  session: GameSession,
  startedAt: number,
  subscriptions: Array<EventSubscription>,
  timer: Timers.Timeout,
  translator: Translator,
}

// one flag per channel, so guesses go to the right one. Kept on the process like the carries below: a `.refresh`
// reloads this module while a game from before it keeps running on the old copy (its timers, its chat listener, its
// Play Again), and a fresh map here let a second game start in that channel. Only the process's own games, a channel's
// commands and presses come to its shard's process
const activeGames: Map<string, Game> = (globalThis as any).notsobotFlagGuesserGames = (globalThis as any).notsobotFlagGuesserGames || new Map();
// channels whose flag is still starting, taken before anything is awaited so two Play Again clicks at once can't both
// start one. On the process for the same reason
const startingChannels: Set<string> = (globalThis as any).notsobotFlagGuesserStarting = (globalThis as any).notsobotFlagGuesserStarting || new Set();
const flagCache = new Map<string, Promise<Buffer>>();
// each flag's message: its difficulty, and its flag's code while nobody's answered it, for its Open in Activity (a room
// continuing the game, `takeFlagGuesserCarry`). per process is enough, a channel's interactions come to its shard's process.
// kept on the process: a `.refresh` reloads this module, and a game from before it (its Play Again chain keeps running
// the old copy) has to write where the reloaded launcher reads
const carriedByMessage: Map<string, CarriedMessage> = (globalThis as any).notsobotFlagGuesserCarries = (globalThis as any).notsobotFlagGuesserCarries || new Map();
// the latest flags' messages, older ones' Open in Activity opens the rooms as before
const CARRIED_MESSAGES = 1000;

export interface FlagGuesserCarry {
  difficulty: GameFlagDifficulties,
  // the flag up in it, null once it's answered, skipped or out of time (its answer is in the message then)
  code: string | null,
}

interface CarriedMessage extends FlagGuesserCarry {
  // while its flag is up: takes it out of the chat round for a launch (`holdForActivity`), from the module copy that
  // started the game (a `.refresh` keeps it on its old code). null when another press already holds it
  hold?: (user: Structures.User) => ((moved: boolean) => void) | null,
}

export interface FlagGuesserCarryTaken {
  // what the launch carries (`LaunchOptions.flagGame`)
  flagGame: FlagGuesserCarry,
  // once the launch is over: `moved` ends the chat round as taken to the Activity, otherwise it goes on as before
  settle: (moved: boolean) => void,
}

// What an Open in Activity press on `messageId` carries into the activity, null for a message this process doesn't
// know. A flag still up is held out of the chat round until `settle`: nobody can score it in chat while it's on its way
// into a room. A second press while it's held carries the difficulty only, one room gets the flag
export function takeFlagGuesserCarry(messageId: string | undefined, user: Structures.User): FlagGuesserCarryTaken | null {
  const carried = (messageId) ? carriedByMessage.get(messageId) : undefined;
  if (!carried) {
    return null;
  }
  const flagGame: FlagGuesserCarry = {difficulty: carried.difficulty, code: carried.code};
  let settle: (moved: boolean) => void = () => {};
  if (flagGame.code && carried.hold) {
    const held = carried.hold(user);
    if (held) {
      settle = held;
    } else {
      flagGame.code = null;
    }
  }
  return {flagGame, settle};
}
// every country's names in a language, built once
const matchers = new Map<string, CountryMatcher>();


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const session: GameSession = {
    difficulty: args.difficulty || GameFlagDifficulties.EASY,
    recent: [],
    scores: new Map(),
    streak: null,
  };
  return startGame(context, session);
}


function getChannelId(context: GameContext): string {
  return context.channelId || context.userId;
}


// editing a prefixed trigger re-runs it, the game from the old run can't edit its message anymore
function getActiveGame(context: GameContext): Game | undefined {
  const existing = activeGames.get(getChannelId(context));
  if (existing && isCommandRunCancelled(existing.context)) {
    // keeping the response, the new run replies in it
    abortGame(existing, true);
    return undefined;
  }
  return existing;
}


async function startGame(context: GameContext, session: GameSession): Promise<void> {
  const channelId = getChannelId(context);
  if (getActiveGame(context) || startingChannels.has(channelId)) {
    const { translate } = await getTranslator(context);
    return replyWarning(context, translate('game.flag.already_running'));
  }
  startingChannels.add(channelId);
  let translator: Translator;
  try {
    translator = await getTranslator(context);
  } finally {
    startingChannels.delete(channelId);
  }

  const country = pickCountry(session);
  const game: Game = {
    aborted: false,
    abortKeepsResponse: false,
    carrying: false,
    channelId,
    context,
    country,
    deadline: 0,
    deletedWhilePosting: [],
    edits: Promise.resolve(),
    finished: false,
    flag: Buffer.alloc(0),
    hintTimer: new Timers.Timeout(),
    hints: 0,
    hostId: context.userId,
    matcher: getMatcher(translator.language),
    pointsTotal: null,
    readsChat: (context instanceof Command.Context) || ((context instanceof ComponentContext) ? context.isBotPresent : context.interaction.isBotPresent),
    responseId: undefined,
    result: null,
    session,
    startedAt: 0,
    subscriptions: [],
    timer: new Timers.Timeout(),
    translator,
  };
  activeGames.set(channelId, game);

  try {
    game.flag = await fetchFlag(context, country);
  } catch(error) {
    return failGame(game, error);
  }

  // events only reach the bot where it's present, a user install in a server it isn't in has the Guess button
  if (game.readsChat) {
    game.subscriptions.push(
      context.client.subscribe(ClientEvents.MESSAGE_CREATE, (event: GatewayClientEvents.MessageCreate) => {
        onChatMessage(game, event.message).catch(() => {});
      }),
      context.client.subscribe(ClientEvents.MESSAGE_DELETE, (event: GatewayClientEvents.MessageDelete) => {
        onMessagesDeleted(game, event.channelId, [event.messageId]);
      }),
      context.client.subscribe(ClientEvents.MESSAGE_DELETE_BULK, (event: GatewayClientEvents.MessageDeleteBulk) => {
        onMessagesDeleted(game, event.channelId, Array.from(event.messages.keys()));
      }),
    );
  }

  game.startedAt = Date.now();
  game.deadline = game.startedAt + ROUND_TIME;
  // the chat is read from here on, a guess during the upload queues its result behind the first post instead of
  // replying alongside it
  const posted = (async () => {
    await editOrReply(context, await renderDisplay(context, createGamePayload(game)));
    game.responseId = await getResponseId(game);
    if (game.responseId) {
      carriedByMessage.set(game.responseId, {
        difficulty: game.session.difficulty,
        code: (game.finished) ? null : game.country.code,
        hold: (game.finished) ? undefined : (user) => holdForActivity(game, user),
      });
      if (CARRIED_MESSAGES < carriedByMessage.size) {
        carriedByMessage.delete(carriedByMessage.keys().next().value!);
      }
    }
  })();
  game.edits = posted.catch(() => {});
  try {
    await posted;
  } catch(error) {
    cleanupGame(game);
    throw error;
  }
  const deletedWhilePosting = game.deletedWhilePosting || [];
  game.deletedWhilePosting = null;
  if (game.responseId && deletedWhilePosting.includes(game.responseId)) {
    abortGame(game, false);
  }
  // its start was deleted while the flag was going up (its id wasn't known to delete it then). Not when a prefixed
  // trigger was edited meanwhile, the new run replies in this same message
  if (game.aborted) {
    if (!game.abortKeepsResponse) {
      deleteResponse(game);
    }
    return;
  }
  // a guess (or skip) already ended it while the response id was fetched, no timers for a finished flag
  if (game.finished) {
    return;
  }
  // the timers count from when the flag is out
  game.startedAt = Date.now();
  game.deadline = game.startedAt + ROUND_TIME;
  scheduleHint(game);
  game.timer.start(ROUND_TIME, () => {
    endGame(game, RoundOutcomes.TIMED_OUT, null).catch(() => {});
  });
}


function getMatcher(language: string): CountryMatcher {
  let matcher = matchers.get(language);
  if (!matcher) {
    // english always counts, plus the server's language
    matcher = new CountryMatcher(Countries, [language]);
    matchers.set(language, matcher);
  }
  return matcher;
}


function pickCountry(session: GameSession): Country {
  const pool = countriesForTier(DIFFICULTY_TIERS[session.difficulty]);
  const fresh = pool.filter((country) => !session.recent.includes(country.code));
  const choices = (fresh.length) ? fresh : pool;
  const country = choices[Math.floor(Math.random() * choices.length)];
  session.recent.push(country.code);
  while (Math.min(RECENT_FLAGS, pool.length - 1) < session.recent.length) {
    session.recent.shift();
  }
  return country;
}


function fetchFlag(context: GameContext, country: Country): Promise<Buffer> {
  let promise = flagCache.get(country.code);
  if (!promise) {
    // as the bot, nothing about the player is needed for a flag
    promise = fetchGameFlag({client: context.client}, country.code, {width: FLAG_WIDTH});
    // a failed fetch isn't kept, the next game tries again
    promise.catch(() => flagCache.delete(country.code));
    flagCache.set(country.code, promise);
  }
  return promise;
}


function cleanupGame(game: Game): void {
  game.finished = true;
  // its answer's out (or the game's gone), Open in Activity only carries its difficulty now
  const carry = (game.responseId) ? carriedByMessage.get(game.responseId) : undefined;
  if (carry) {
    carry.code = null;
    carry.hold = undefined;
  }
  game.timer.stop();
  game.hintTimer.stop();
  while (game.subscriptions.length) {
    game.subscriptions.shift()!.remove();
  }
  if (activeGames.get(game.channelId) === game) {
    activeGames.delete(game.channelId);
  }
}


async function getResponseId(game: Game): Promise<string | undefined> {
  const context = game.context;
  if (context instanceof Command.Context) {
    return (context.response) ? context.response.id : undefined;
  }
  if (context.responseId) {
    return context.responseId;
  }
  try {
    return (await context.fetchResponse()).id;
  } catch(error) {
    return undefined;
  }
}


function deleteResponse(game: Game): void {
  const context = game.context;
  if (context instanceof Command.Context) {
    if (context.response && !context.response.deleted) {
      context.response.delete().catch(() => {});
    }
  } else {
    context.deleteResponse().catch(() => {});
  }
}


// deleting a prefixed trigger or the game's message stops it (and takes the message with it, like any other command's
// reply), instead of it still taking answers for a flag nobody can see
function onMessagesDeleted(game: Game, channelId: string, messageIds: Array<string>): void {
  if (channelId !== game.channelId || game.aborted || game.finished) {
    return;
  }
  // still going up, its id is checked against these once it's known
  if (game.deletedWhilePosting) {
    game.deletedWhilePosting.push(...messageIds);
  }
  const starts = [game.responseId];
  if (game.context instanceof Command.Context) {
    starts.push(game.context.messageId);
  }
  if (messageIds.some((messageId) => starts.includes(messageId))) {
    abortGame(game, false);
  }
}


// stops right away, `keepResponse` for an edited prefixed trigger whose new run replies in the same message (a deleted
// trigger's response is already deleted by the command hooks, deleting it again just fails quietly)
function abortGame(game: Game, keepResponse: boolean): void {
  if (game.aborted) {
    return;
  }
  game.aborted = true;
  game.abortKeepsResponse = keepResponse;
  cleanupGame(game);
  if (!keepResponse && game.responseId) {
    deleteResponse(game);
  }
}


function roundPoints(game: Game): number {
  return MAX_POINTS - game.hints;
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


function formatScores(game: Game): Array<string> {
  const sorted = Array.from(game.session.scores.entries()).sort((x, y) => y[1] - x[1]);
  return sorted.slice(0, SCORES_SHOWN).map(([ userId, points ], index) => {
    return displayDetailsLine([`**${index + 1}.** <@${userId}>`, game.translator.translate('game.flag.points', {points})]);
  });
}


function createGamePayload(game: Game): DisplayPayload {
  const { translate } = game.translator;
  const file = {filename: FLAG_FILENAME, value: game.flag};
  const title = translate('game.flag.modal_title');
  const difficulty = translate(DIFFICULTY_KEYS[game.session.difficulty]);

  if (game.finished) {
    const scores = formatScores(game);
    return {
      components: createPlayAgainComponents(game),
      componentsInside: true,
      description: displayDetails([
        game.result,
        (game.pointsTotal !== null) ? `-# ${translate('game.flag.points_total', {points: game.pointsTotal.toLocaleString(game.translator.language)})}` : null,
        (scores.length) ? `\n**${translate('game.flag.scores')}**` : null,
        ...scores,
      ]),
      files: [file],
      note: difficulty,
      image: `attachment://${FLAG_FILENAME}`,
      title,
    };
  }

  const hints: Array<string> = [];
  if (1 <= game.hints) {
    hints.push(displayDetail(translate('game.flag.region'), translate(`game.flag.region.${countryRegion(game.country)}` as TranslationKey)));
  }
  if (2 <= game.hints) {
    hints.push(displayDetail(translate('game.flag.letters'), formatLetters(countryName(game.country, game.translator.language))));
  }
  const lastHint = MAX_POINTS - 1 <= game.hints;
  const nextChange = (lastHint) ? game.deadline : game.startedAt + (game.hints + 1) * HINT_TIME;
  return {
    components: createGameComponents(game),
    componentsInside: true,
    description: displayDetails([
      (game.readsChat) ? translate('game.flag.prompt_chat') : translate('game.flag.prompt_button'),
      ...hints,
    ]),
    files: [file],
    note: displayDetailsLine([
      translate('game.flag.worth', {points: roundPoints(game)}),
      difficulty,
      (lastHint) ? (
        translate('game.flag.time_runs_out', {time: displayTimestamp(nextChange)})
      ) : (
        translate('game.flag.next_hint', {time: displayTimestamp(nextChange)})
      ),
    ]),
    image: `attachment://${FLAG_FILENAME}`,
    title,
  };
}


// A press skips a command's checks (`onCommandCheck`): someone NotSoBot blocked (or in a server it blocked), or kept
// from the game here by one of the server's rules, gets what the command would have told them. From what's in memory
// only, the answer to a press can't wait on the api
function refusedPress(ctx: ComponentContext): string | null {
  const access = checkComponentAccess(ctx, COMMAND_ID);
  return access.blocked || access.rule;
}


function createGameComponents(game: Game): Components {
  const { translate } = game.translator;
  const components = new Components({timeout: Math.max(game.deadline - Date.now(), 0) + COMPONENTS_TIMEOUT_PADDING});

  components.createButton({
    label: translate('game.flag.guess'),
    run: async (ctx: ComponentContext) => {
      if (game.finished) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      const refusal = refusedPress(ctx);
      if (refusal) {
        return respondEphemeral(ctx, refusal);
      }
      // a modal has to be the press's first answer, within 3 seconds: in their own language when their settings are in
      // memory, the game's otherwise. Getting them from the api first (5 seconds when it's slow) lost the modal
      const translator = (UserSettingsStore.has(ctx.userId)) ? getCachedTranslator(ctx) : game.translator;
      return ctx.respond(createGuessModal(game, translator));
    },
  });

  components.createButton({
    label: translate('game.flag.skip'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (game.finished) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      if (ctx.userId !== game.hostId) {
        const { translate } = await getTranslator(ctx);
        return respondEphemeral(ctx, translate('game.flag.only_host', {user: `<@${game.hostId}>`}));
      }
      if (game.carrying) {
        // held for an Open in Activity press, whose launch ends or resumes it
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await endGame(game, RoundOutcomes.SKIPPED, null);
    },
  });

  addActivityButton(game, components);
  return components;
}


// anyone can start the next flag, it's a new message at the bottom of the chat with the same difficulty and the scores
// so far
function createPlayAgainComponents(game: Game): Components {
  const components = new Components({timeout: PLAY_AGAIN_TIME});
  components.createButton({
    label: game.translator.translate('game.flag.play_again'),
    style: MessageComponentButtonStyles.SUCCESS,
    run: async (ctx: ComponentContext) => {
      const refusal = refusedPress(ctx);
      if (refusal) {
        return respondEphemeral(ctx, refusal);
      }
      if (getActiveGame(ctx) || startingChannels.has(getChannelId(ctx))) {
        const { translate } = await getTranslator(ctx);
        return respondEphemeral(ctx, `${StatusEmojis.WARNING} ${translate('game.flag.already_running')}`);
      }
      // the flag can take a moment to download, the deferred reply turns into the next flag's message
      await ctx.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
      try {
        await startGame(ctx, game.session);
      } catch(error) {
        // the flag didn't download or post: the deferred reply would say "thinking" for good
        captureError(error, {tags: {source: 'game.flag.play_again'}});
        await ctx.deleteResponse().catch(() => {});
      }
    },
  });
  addActivityButton(game, components);
  return components;
}


// Open in Activity, a room in the activity continuing this game (`launchButtonOf` in utils/editoractivity.ts, `takeFlagGuesserCarry`: its
// difficulty and, while unanswered, its flag first), its rooms for a message this process forgot. a static id the
// components listener answers, so it keeps working after this message's buttons stop listening. Left out while the
// activity is only open to NotSoBot owners and whoever started this flag isn't one, a press would only say it's not
// ready
function addActivityButton(game: Game, components: Components): void {
  if (!canUseEditor(game.context)) {
    return;
  }
  components.createButton({
    customId: MessageComponentCustomIds.FLAG_GUESSER_ACTIVITY,
    label: game.translator.translate('game.flag.open_activity'),
    style: MessageComponentButtonStyles.SECONDARY,
  });
}


// for wherever chat doesn't reach the bot (a user install in a server it isn't in), and for anyone who'd rather not
// guess where everyone can see it
function createGuessModal(game: Game, translator: Translator): InteractionModal {
  const { translate } = translator;
  const modal = new InteractionModal({
    timeout: Math.max(game.deadline - Date.now(), 0) + COMPONENTS_TIMEOUT_PADDING,
    title: translate('game.flag.modal_title'),
    run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
      const guess = String(args.guess || '');
      // (held for an Open in Activity press: it's on its way into a room)
      if (game.finished || game.carrying) {
        return respondEphemeral(modalContext, translate('game.flag.round_over'));
      }
      if (!game.matcher.isCorrect(game.country, guess)) {
        return respondEphemeral(modalContext, `${StatusEmojis.NO} ${translate('game.flag.wrong')}`);
      }
      await modalContext.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await endGame(game, RoundOutcomes.CORRECT, modalContext.user);
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


// plain text (same as the imagine game). detritus before beta.136 keyed a click's response listener by the clicked
// message, so a reply with components took over the game's buttons, fixed there but the warnings need none anyway
function respondEphemeral(ctx: ComponentContext | InteractionModalContext, content: string) {
  return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
    allowedMentions: {parse: []},
    content,
    flags: MessageFlags.EPHEMERAL,
  });
}


// a Play Again click that lost the race to another one already deferred, its thinking message becomes the warning
async function replyWarning(context: GameContext, text: string): Promise<void> {
  if (context instanceof ComponentContext && !context.responded) {
    await respondEphemeral(context, `${StatusEmojis.WARNING} ${text}`);
    return;
  }
  await editOrReply(context, await renderDisplay(context, {description: `${StatusEmojis.WARNING} ${text}`}));
}


async function onChatMessage(game: Game, message: Structures.Message): Promise<void> {
  if (message.channelId !== game.channelId || message.fromBot || game.finished || game.carrying) {
    return;
  }
  const content = message.content;
  // only short messages are guesses
  if (!content || MAX_GUESS_LENGTH < content.length) {
    return;
  }
  if (!game.matcher.isCorrect(game.country, content)) {
    return;
  }
  const emoji = StatusEmojis.YES.replace(/^<:|>$/g, '');
  message.react(emoji).catch(() => {});
  await endGame(game, RoundOutcomes.CORRECT, message.author);
}


// renders the game as it is when the edit runs (not when it was queued), one edit at a time
function refreshGame(game: Game): Promise<void> {
  game.edits = game.edits.then(async () => {
    if (game.aborted) {
      return;
    }
    // a prefixed trigger edited into a new run (that run aborts this game too, whichever notices first)
    if (isCommandRunCancelled(game.context)) {
      return abortGame(game, true);
    }
    const message = await renderDisplay(game.context, createGamePayload(game));
    // the flag is re-uploaded every edit, `attachments: []` stops the old copies from piling up
    await editOrReply(game.context, {...message, attachments: []});
  }).catch(() => {});
  return game.edits;
}


function scheduleHint(game: Game): void {
  if (MAX_POINTS - 1 <= game.hints) {
    return;
  }
  const at = game.startedAt + (game.hints + 1) * HINT_TIME;
  game.hintTimer.start(Math.max(at - Date.now(), 0), () => {
    if (game.finished) {
      return;
    }
    game.hints++;
    refreshGame(game);
    scheduleHint(game);
  });
}


// adds a correct answer's points to the scorer's global game points, never awaited: a slow or failed award can't hold up
// the game, its total only shows when the answer is back before the result's edit renders. The scorer goes as the
// acting user so the api knows them even if they never used a command
function awardPoints(game: Game, user: Structures.User, points: number): void {
  awardGamePoints({client: game.context.client, user}, {
    game: GamePointsGames.FLAG_GUESSER,
    guildId: game.context.guildId || null,
    points,
    source: 'chat',
    userId: user.id,
  }).then((response) => {
    game.pointsTotal = response.total;
  }).catch((error) => log.warn('flag guesser points award', error));
}


// An Open in Activity press taking this flag into a room: held out of the chat round while the launch is tried, then
// `settle` ends it as moved (the message says who took it, its answer stays hidden: it's still being played) or lets it
// go on. null when it's over or another press holds it. Hints and the timer keep going meanwhile, a flag that runs out
// while held ends as timed out and a later settle changes nothing
function holdForActivity(game: Game, user: Structures.User): ((moved: boolean) => void) | null {
  if (game.finished || game.aborted || game.carrying) {
    return null;
  }
  game.carrying = true;
  let settled = false;
  return (moved: boolean) => {
    if (settled) {
      return;
    }
    settled = true;
    game.carrying = false;
    if (moved) {
      endGame(game, RoundOutcomes.MOVED, user).catch(() => {});
    }
  };
}


async function endGame(game: Game, outcome: RoundOutcomes, scorer: Structures.User | null): Promise<void> {
  if (game.finished) {
    return;
  }
  // frees the channel before the result goes up, so its Play Again works right away
  cleanupGame(game);

  const { translate } = game.translator;
  const session = game.session;
  const country = `${countryEmoji(game.country)} **${countryName(game.country, game.translator.language)}**`;
  switch (outcome) {
    case RoundOutcomes.CORRECT: {
      const user = scorer!.id;
      session.streak = (session.streak && session.streak.userId === user) ? {count: session.streak.count + 1, userId: user} : {count: 1, userId: user};
      const bonus = (STREAK_BONUS_AT <= session.streak.count) ? 1 : 0;
      const points = roundPoints(game) + bonus;
      session.scores.set(user, (session.scores.get(user) || 0) + points);
      awardPoints(game, scorer!, points);
      game.result = displayDetails([
        `${StatusEmojis.YES} ${translate('game.flag.correct', {user: `<@${user}>`, country, points: translate('game.flag.points', {points})})}`,
        (bonus) ? `-# ${translate('game.flag.streak', {count: session.streak.count})}` : null,
      ]);
    }; break;
    case RoundOutcomes.MOVED: {
      // nobody named it here, like a skip
      session.streak = null;
      game.result = translate('game.flag.moved', {user: `<@${scorer!.id}>`});
    }; break;
    case RoundOutcomes.SKIPPED: {
      session.streak = null;
      game.result = translate('game.flag.skipped', {country});
    }; break;
    case RoundOutcomes.TIMED_OUT: {
      session.streak = null;
      game.result = translate('game.flag.times_up', {country});
    }; break;
  }
  await refreshGame(game);
}


async function failGame(game: Game, error: any): Promise<void> {
  cleanupGame(game);
  // required here, commands/errors imports utils (and this file with it) back
  const { createRunErrorPayload, warning }: typeof import('../../../commands/errors') = require('../../../commands/errors');
  const payload = await createRunErrorPayload(game.context as any, warning(game.translator.translate('game.flag.flag_failed')), error, game.translator);
  try {
    await editOrReply(game.context, await renderDisplay(game.context, {...payload, color: EmbedColors.ERROR}));
  } catch(error) {

  }
}
