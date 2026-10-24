import { Command, Interaction, Structures } from 'detritus-client';
import {
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
  Markup,
} from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { utilitiesMLImagine } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import { getTranslator, randomThinkingText, TranslationKey, Translator } from '../../i18n';
import {
  DisplayPayload,
  displayDetail,
  displayDetails,
  displayDetailsLine,
  displayReply,
  displayTimestamp,
  editOrReply,
  isCommandRunCancelled,
  jobWaitForResponse,
  renderDisplay,
} from '../../../utils';


export const COMMAND_ID = 'fun.game.imagine';

// the original image and 9 recreations fill a message's 10 attachments
export const MAX_PLAYERS = 9;
export const MIN_PLAYERS = 2;
export const MAX_PROMPT_LENGTH = 300;

// a slash command's token can only edit its response for 15 minutes, the lobby, a slow secret image (up to the job
// wait time), the round and the vote all fit in that
export const LOBBY_TIME = 5 * 60 * 1000;
export const ROUND_TIME = 2 * 60 * 1000;
export const VOTE_TIME = 60 * 1000;
// buttons stay listening a little past their phase, so a click right at the end still gets an answer
const COMPONENTS_TIMEOUT_PADDING = 30 * 1000;

// no prompt argument, everyone in the channel can see a slash command's options (and a prefixed command's text), the
// host sets their own through the lobby's form instead
export interface CommandArgs {

}

type GameContext = Command.Context | Interaction.InteractionContext;

enum GamePhases {
  LOBBY = 'LOBBY',
  ROUND = 'ROUND',
  VOTING = 'VOTING',
  FINISHED = 'FINISHED',
}

interface GameImage {
  extension: string,
  prompt: string,
  spoiler: boolean,
  value: Buffer,
}

interface GamePlayer {
  // the preview they haven't confirmed yet, it's used for them if the round ends first
  draft: GameImage | null,
  // bumped for every prompt they send, older previews and generations that finish late are ignored
  draftId: number,
  // filled into the prompt form when they try again
  lastPrompt: string,
  submission: GameImage | null,
  userId: string,
}

interface Game {
  channelId: string,
  context: GameContext,
  deadline: number,
  // the submitted players in gallery order, set once the round ends
  entries: Array<GamePlayer>,
  // shown instead of the game once it ended without results (cancelled, never started, the secret image failed)
  ended: DisplayPayload | null,
  hostId: string,
  // a random prompt is a secret to the host too, a prompt they wrote makes them the judge
  hostPlays: boolean,
  phase: GamePhases,
  // in join order
  players: Map<string, GamePlayer>,
  reference: GameImage | null,
  referenceError: any,
  // bumped for every secret image that starts generating, so a slower older one can't replace a newer one
  referenceId: number,
  referencePromise: Promise<void>,
  // bumped for every prompt the host sets, only the latest one replaces the secret image (and only once it's made)
  secretPromptId: number,
  refreshing: Promise<void> | null,
  refreshQueued: boolean,
  startRequested: boolean,
  timer: Timers.Timeout,
  voteMessage: Structures.Message | null,
  // voter -> index in `entries`
  votes: Map<string, number>,
}

// one game per channel, so their buttons and messages don't get mixed up
const activeGames = new Map<string, Game>();


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const channelId = context.channelId || context.userId;
  // editing a prefixed trigger re-runs it, the game from the old run can't edit its message anymore
  const existing = activeGames.get(channelId);
  if (existing && isCommandRunCancelled(existing.context)) {
    cleanupGame(existing);
  }
  if (activeGames.has(channelId)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('fun.game_imagine.already_running')}`});
  }

  const game: Game = {
    channelId,
    context,
    deadline: Date.now() + LOBBY_TIME,
    entries: [],
    ended: null,
    hostId: context.userId,
    hostPlays: true,
    phase: GamePhases.LOBBY,
    players: new Map(),
    reference: null,
    referenceError: null,
    referenceId: 0,
    referencePromise: Promise.resolve(),
    secretPromptId: 0,
    refreshing: null,
    refreshQueued: false,
    startRequested: false,
    timer: new Timers.Timeout(),
    voteMessage: null,
    votes: new Map(),
  };
  game.players.set(game.hostId, createPlayer(game.hostId));
  activeGames.set(channelId, game);

  game.timer.start(LOBBY_TIME, () => {
    endGame(game, {description: translate('fun.game_imagine.lobby_expired')});
  });

  try {
    await updateGame(game);
  } catch(error) {
    cleanupGame(game);
    throw error;
  }

  // after the first render, so a quick failure's edit can't race the first response. it generates while people join and
  // is only shown once the round starts
  generateRandomReference(game);
}


function createPlayer(userId: string): GamePlayer {
  return {draft: null, draftId: 0, lastPrompt: '', submission: null, userId};
}


function imageFromResponse(response: RestResponsesRaw.FileResponse, prompt: string): GameImage {
  return {
    extension: response.file.metadata.extension || 'png',
    prompt,
    spoiler: response.file.has_nsfw,
    value: (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0),
  };
}


// one line of subtext, `-# ` only applies to the line it starts
function formatPrompt(prompt: string): string {
  return `-# ${Markup.escape.all(prompt.replace(/\s+/g, ' '))}`;
}


function imageFile(image: GameImage, name: string): RequestTypes.File {
  return {filename: `${name}.${image.extension}`, hasSpoiler: image.spoiler, value: image.value};
}


// `random` has the api write the prompt, it sends back what it wrote so it can be revealed at the end
async function generateImage(
  context: GameContext | ComponentContext,
  query: string,
): Promise<GameImage> {
  const job = await utilitiesMLImagine(context, {query, safe: true});
  const response = await jobWaitForResponse(context, job);
  const used = (response.arguments && typeof(response.arguments.prompt) === 'string') ? response.arguments.prompt : query;
  return imageFromResponse(response, used);
}


function generateRandomReference(game: Game): void {
  const referenceId = ++game.referenceId;
  game.reference = null;
  game.referenceError = null;
  game.referencePromise = (async () => {
    let image: GameImage;
    try {
      image = await generateImage(game.context, 'random');
    } catch(error) {
      if (referenceId !== game.referenceId) {
        return;
      }
      game.referenceError = error;
      // fails the lobby right away, a start that's waiting on it fails the game itself
      if (game.phase === GamePhases.LOBBY && !game.startRequested) {
        const { translate } = await getTranslator(game.context);
        await failGame(game, translate('fun.game_imagine.image_failed'), error);
      }
      return;
    }
    if (referenceId === game.referenceId) {
      game.reference = image;
    }
  })().catch(() => {});
}


function cleanupGame(game: Game): void {
  game.phase = GamePhases.FINISHED;
  game.timer.stop();
  if (activeGames.get(game.channelId) === game) {
    activeGames.delete(game.channelId);
  }
}


// every edit of the game message goes through here one at a time, rendering the latest state each time, so a slow
// edit can't land after a newer one (clicks only acknowledge, they don't edit the message themselves)
function refreshGame(game: Game): Promise<void> {
  game.refreshQueued = true;
  if (!game.refreshing) {
    game.refreshing = (async () => {
      while (game.refreshQueued) {
        game.refreshQueued = false;
        // a prefixed command's trigger was edited or deleted, the reply belongs to the newer run now
        if (isCommandRunCancelled(game.context)) {
          cleanupGame(game);
          break;
        }
        try {
          await updateGame(game);
        } catch(error) {

        }
      }
      game.refreshing = null;
    })();
  }
  return game.refreshing;
}


async function updateGame(game: Game): Promise<void> {
  const translator = await getTranslator(game.context);
  const message = await renderDisplay(game.context, createGamePayload(game, translator));
  // the image is re-uploaded every edit, `attachments: []` stops the old copies from piling up
  await editOrReply(game.context, {...message, attachments: []});
}


function endGame(game: Game, payload: DisplayPayload): Promise<void> {
  if (game.phase === GamePhases.FINISHED) {
    return Promise.resolve();
  }
  cleanupGame(game);
  game.ended = payload;
  return refreshGame(game);
}


async function failGame(game: Game, title: string, error: any): Promise<void> {
  // required here, commands/errors imports utils (and this file with it) back
  const { createRunErrorPayload, warning }: typeof import('../../../commands/errors') = require('../../../commands/errors');
  const translator = await getTranslator(game.context);
  const payload = await createRunErrorPayload(game.context, warning(title), error, translator);
  return endGame(game, {...payload, color: EmbedColors.ERROR});
}


function createGamePayload(game: Game, translator: Translator): DisplayPayload {
  const { translate } = translator;
  const title = translate('fun.game_imagine.title');
  if (game.ended) {
    return {...game.ended, title: game.ended.title || title};
  }

  switch (game.phase) {
    case GamePhases.LOBBY: {
      const players = Array.from(game.players.keys()).map((userId) => `<@${userId}>`);
      const note = (game.startRequested) ? (
        translate('fun.game_imagine.starting_when_ready')
      ) : (
        translate('fun.game_imagine.lobby_closes', {time: displayTimestamp(game.deadline)})
      );
      return {
        components: createLobbyComponents(game, translator),
        description: displayDetails([
          translate('fun.game_imagine.how_to_play'),
          (game.hostPlays) ? (
            translate('fun.game_imagine.prompt_random', {user: `<@${game.hostId}>`})
          ) : (
            translate('fun.game_imagine.prompt_by_host', {user: `<@${game.hostId}>`})
          ),
          '',
          `**${translate('fun.game_imagine.players', {count: game.players.size, max: MAX_PLAYERS})}**`,
          (players.length) ? players.join(', ') : translate('fun.game_imagine.no_players_yet'),
        ]),
        note,
        title,
      };
    };
    case GamePhases.ROUND: {
      const players = Array.from(game.players.values());
      const submitted = players.filter((player) => player.submission).map((player) => `<@${player.userId}>`);
      const waiting = players.filter((player) => !player.submission).map((player) => `<@${player.userId}>`);
      return {
        components: createRoundComponents(game, translator),
        description: displayDetails([
          translate('fun.game_imagine.recreate'),
          '',
          (submitted.length) ? displayDetail(translate('fun.game_imagine.submitted'), submitted.join(', ')) : null,
          (waiting.length) ? displayDetail(translate('fun.game_imagine.waiting_on'), waiting.join(', ')) : null,
        ]),
        files: [imageFile(game.reference!, 'secret')],
        note: translate('fun.game_imagine.round_ends', {time: displayTimestamp(game.deadline)}),
        title,
      };
    };
    case GamePhases.VOTING: {
      return {
        description: translate('fun.game_imagine.voting_below'),
        title,
      };
    };
    case GamePhases.FINISHED: {
      return createResultsPayload(game, translator, !game.voteMessage);
    };
  }
}


function createLobbyComponents(game: Game, translator: Translator): Components {
  const components = new Components({timeout: LOBBY_TIME + COMPONENTS_TIMEOUT_PADDING});

  components.createButton({
    label: `${translator.translate('fun.game_imagine.join')} (${game.players.size}/${MAX_PLAYERS})`,
    run: async (ctx: ComponentContext) => {
      if (game.phase !== GamePhases.LOBBY) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      const { translate } = await getTranslator(ctx);
      if (game.players.has(ctx.userId)) {
        return respondEphemeral(ctx, translate('fun.game_imagine.already_joined'));
      }
      if (!game.hostPlays && ctx.userId === game.hostId) {
        return respondEphemeral(ctx, translate('fun.game_imagine.host_is_judging'));
      }
      if (MAX_PLAYERS <= game.players.size) {
        return respondEphemeral(ctx, translate('fun.game_imagine.game_full', {max: MAX_PLAYERS}));
      }
      game.players.set(ctx.userId, createPlayer(ctx.userId));
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await refreshGame(game);
    },
  });

  components.createButton({
    label: translator.translate('fun.game_imagine.leave'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (game.phase !== GamePhases.LOBBY) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      if (!game.players.has(ctx.userId)) {
        const { translate } = await getTranslator(ctx);
        return respondEphemeral(ctx, translate('fun.game_imagine.not_joined'));
      }
      game.players.delete(ctx.userId);
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await refreshGame(game);
    },
  });

  components.createButton({
    disabled: game.startRequested,
    label: translator.translate('fun.game_imagine.start'),
    style: MessageComponentButtonStyles.SUCCESS,
    run: async (ctx: ComponentContext) => {
      if (game.phase !== GamePhases.LOBBY || game.startRequested) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      const { translate } = await getTranslator(ctx);
      if (ctx.userId !== game.hostId) {
        return respondEphemeral(ctx, translate('fun.game_imagine.only_host', {user: `<@${game.hostId}>`}));
      }
      if (game.players.size < MIN_PLAYERS) {
        return respondEphemeral(ctx, translate('fun.game_imagine.need_players', {count: MIN_PLAYERS}));
      }
      game.startRequested = true;
      // the image can take a bit, the lobby doesn't expire on them while it finishes (the job wait time still applies)
      game.timer.stop();
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      // shows that it's waiting on the image, if it isn't done yet
      if (!game.reference && !game.referenceError) {
        refreshGame(game);
      }
      await game.referencePromise;
      await startRound(game);
    },
  });

  components.createButton({
    disabled: game.startRequested,
    label: translator.translate('fun.game_imagine.set_prompt'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (game.phase !== GamePhases.LOBBY || game.startRequested) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      const hostTranslator = await getTranslator(ctx);
      if (ctx.userId !== game.hostId) {
        return respondEphemeral(ctx, hostTranslator.translate('fun.game_imagine.only_host', {user: `<@${game.hostId}>`}));
      }
      return ctx.respond(createSecretPromptModal(game, ctx, hostTranslator));
    },
  });

  components.createButton({
    label: translator.translate('common.cancel'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (game.phase === GamePhases.FINISHED) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      if (ctx.userId !== game.hostId) {
        const { translate } = await getTranslator(ctx);
        return respondEphemeral(ctx, translate('fun.game_imagine.only_host', {user: `<@${game.hostId}>`}));
      }
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      await endGame(game, {description: translator.translate('fun.game_imagine.cancelled')});
    },
  });

  return components;
}


// a modal is the only way to give the prompt without anyone else seeing it
function createSecretPromptModal(game: Game, ctx: ComponentContext, translator: Translator): InteractionModal {
  const { translate } = translator;
  const modal = new InteractionModal({
    timeout: Math.max(game.deadline - Date.now(), 0) + COMPONENTS_TIMEOUT_PADDING,
    title: translate('fun.game_imagine.secret_prompt_title'),
    run: (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
      return submitSecretPrompt(game, ctx, modalContext, String(args.prompt || '').trim());
    },
  });
  modal.createLabel({
    description: translate('fun.game_imagine.secret_prompt_description'),
    label: translate('fun.game_imagine.modal_prompt'),
  }).createInputText({
    customId: 'prompt',
    maxLength: MAX_PROMPT_LENGTH,
    required: false,
    style: MessageComponentInputTextStyles.PARAGRAPH,
    value: (!game.hostPlays && game.reference) ? game.reference.prompt : undefined,
  });
  return modal;
}


// the new image only replaces the current one once it's made, a blocked prompt just tells the host and keeps the old one
async function submitSecretPrompt(
  game: Game,
  ctx: ComponentContext,
  modalContext: InteractionModalContext,
  prompt: string,
): Promise<unknown> {
  const translator = await getTranslator(ctx);
  const { translate } = translator;
  if (game.phase !== GamePhases.LOBBY || game.startRequested) {
    return modalContext.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, await renderPlayerMessage(ctx, {
      description: translate('fun.game_imagine.already_started'),
    }, true));
  }

  const secretPromptId = ++game.secretPromptId;
  // empty goes back to a random prompt, the host plays again (if there's still room)
  if (!prompt) {
    game.hostPlays = true;
    if (!game.players.has(game.hostId) && game.players.size < MAX_PLAYERS) {
      game.players.set(game.hostId, createPlayer(game.hostId));
    }
    generateRandomReference(game);
    await modalContext.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, await renderPlayerMessage(ctx, {
      description: translate('fun.game_imagine.secret_prompt_random'),
    }, true));
    return refreshGame(game);
  }

  await modalContext.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, await renderPlayerMessage(ctx, {
    description: displayDetails([randomThinkingText(translate), formatPrompt(prompt)]),
  }, true));

  let image: GameImage;
  try {
    image = await generateImage(ctx, prompt);
  } catch(error) {
    const { createRunErrorPayload, warning }: typeof import('../../../commands/errors') = require('../../../commands/errors');
    const payload = await createRunErrorPayload(game.context, warning(translate('fun.game_imagine.secret_prompt_failed')), error, translator);
    return modalContext.editResponse(await renderPlayerMessage(ctx, {...payload, color: EmbedColors.ERROR}, false));
  }

  // they set another prompt meanwhile, or the game started with the old image
  if (secretPromptId !== game.secretPromptId || game.phase !== GamePhases.LOBBY || game.startRequested) {
    return modalContext.editResponse(await renderPlayerMessage(ctx, {
      description: translate('fun.game_imagine.secret_prompt_replaced'),
    }, false));
  }
  // a random image still generating doesn't replace it once it's done
  game.referenceId++;
  game.reference = image;
  game.referenceError = null;
  game.referencePromise = Promise.resolve();
  game.hostPlays = false;
  game.players.delete(game.hostId);
  await modalContext.editResponse(await renderPlayerMessage(ctx, {
    description: displayDetails([translate('fun.game_imagine.secret_prompt_set'), formatPrompt(image.prompt)]),
  }, false));
  return refreshGame(game);
}


async function startRound(game: Game): Promise<void> {
  // cancelled (or the lobby expired) while the image was generating
  if (game.phase !== GamePhases.LOBBY) {
    return;
  }
  if (game.referenceError || !game.reference) {
    const { translate } = await getTranslator(game.context);
    return failGame(game, translate('fun.game_imagine.image_failed'), game.referenceError || new Error('No image'));
  }
  game.phase = GamePhases.ROUND;
  game.deadline = Date.now() + ROUND_TIME;
  game.timer.stop();
  game.timer.start(ROUND_TIME, () => {
    startVoting(game).catch(() => {});
  });
  await refreshGame(game);
}


function createRoundComponents(game: Game, translator: Translator): Components {
  const components = new Components({timeout: ROUND_TIME + COMPONENTS_TIMEOUT_PADDING});
  components.createButton({
    label: translator.translate('fun.game_imagine.write_prompt'),
    run: async (ctx: ComponentContext) => {
      if (game.phase !== GamePhases.ROUND) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      const playerTranslator = await getTranslator(ctx);
      const player = game.players.get(ctx.userId);
      if (!player) {
        const key = (ctx.userId === game.hostId) ? 'fun.game_imagine.host_is_judging' : 'fun.game_imagine.not_joined';
        return respondEphemeral(ctx, playerTranslator.translate(key));
      }
      if (player.submission) {
        return respondEphemeral(ctx, playerTranslator.translate('fun.game_imagine.already_submitted'));
      }
      return ctx.respond(createPromptModal(game, player, ctx, playerTranslator, false));
    },
  });
  return components;
}


// `inPlace` updates the preview the form was opened from (trying again), instead of sending a new one
function createPromptModal(
  game: Game,
  player: GamePlayer,
  ctx: ComponentContext,
  translator: Translator,
  inPlace: boolean,
): InteractionModal {
  const { translate } = translator;
  const modal = new InteractionModal({
    timeout: Math.max(game.deadline - Date.now(), 0) + COMPONENTS_TIMEOUT_PADDING,
    title: translate('fun.game_imagine.modal_title'),
    run: (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
      return submitPrompt(game, player, ctx, modalContext, String(args.prompt || '').trim(), inPlace);
    },
  });
  modal.createLabel({
    description: translate('fun.game_imagine.modal_prompt_description'),
    label: translate('fun.game_imagine.modal_prompt'),
  }).createInputText({
    customId: 'prompt',
    maxLength: MAX_PROMPT_LENGTH,
    required: true,
    style: MessageComponentInputTextStyles.PARAGRAPH,
    value: player.lastPrompt || undefined,
  });
  return modal;
}


// a player's own messages render with their display setting, `ctx` is their button press (the one that opened the form)
// `ephemeral` for a new message, otherwise it's an edit of one and its old image is replaced instead of added to
async function renderPlayerMessage(ctx: ComponentContext, payload: DisplayPayload, ephemeral: boolean) {
  const message = await renderDisplay(ctx, payload);
  if (ephemeral) {
    message.flags = (message.flags || 0) | MessageFlags.EPHEMERAL;
  } else {
    message.attachments = [];
  }
  return message;
}


async function respondEphemeral(ctx: ComponentContext, description: string) {
  const message = await renderPlayerMessage(ctx, {description}, true);
  return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, message);
}


async function submitPrompt(
  game: Game,
  player: GamePlayer,
  ctx: ComponentContext,
  modalContext: InteractionModalContext,
  prompt: string,
  inPlace: boolean,
): Promise<unknown> {
  const translator = await getTranslator(ctx);
  const { translate } = translator;
  const type = (inPlace) ? InteractionCallbackTypes.UPDATE_MESSAGE : InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE;
  if (game.phase !== GamePhases.ROUND || player.submission) {
    const key = (player.submission) ? 'fun.game_imagine.already_submitted' : 'fun.game_imagine.round_over';
    return modalContext.respond(type, await renderPlayerMessage(ctx, {description: translate(key)}, !inPlace));
  }

  const draftId = ++player.draftId;
  player.lastPrompt = prompt;
  await modalContext.respond(type, await renderPlayerMessage(ctx, {
    description: displayDetails([randomThinkingText(translate), formatPrompt(prompt)]),
  }, !inPlace));

  let image: GameImage;
  try {
    // ran as the player, so it's their own api ratelimit (and premium) instead of the host's
    const job = await utilitiesMLImagine(ctx, {query: prompt, safe: true});
    image = imageFromResponse(await jobWaitForResponse(ctx, job), prompt);
  } catch(error) {
    if (player.draftId !== draftId) {
      return;
    }
    const { createRunErrorPayload, warning }: typeof import('../../../commands/errors') = require('../../../commands/errors');
    const payload = await createRunErrorPayload(game.context, warning(translate('fun.game_imagine.generation_failed')), error, translator);
    return modalContext.editResponse(await renderPlayerMessage(ctx, {
      ...payload,
      color: EmbedColors.ERROR,
      components: createPreviewComponents(game, player, draftId, translator, false),
    }, false));
  }

  // they sent another prompt while this one generated, that one's preview takes over
  if (player.draftId !== draftId) {
    return;
  }
  if (game.phase !== GamePhases.ROUND || player.submission) {
    return modalContext.editResponse(await renderPlayerMessage(ctx, {description: translate('fun.game_imagine.round_over')}, false));
  }
  player.draft = image;
  return modalContext.editResponse(await renderPlayerMessage(ctx, {
    components: createPreviewComponents(game, player, draftId, translator, true),
    description: displayDetails([translate('fun.game_imagine.preview'), formatPrompt(prompt)]),
    files: [imageFile(image, 'preview')],
  }, false));
}


function createPreviewComponents(
  game: Game,
  player: GamePlayer,
  draftId: number,
  translator: Translator,
  canUse: boolean,
): Components {
  const { translate } = translator;
  const components = new Components({timeout: Math.max(game.deadline - Date.now(), 0) + COMPONENTS_TIMEOUT_PADDING});

  if (canUse) {
    components.createButton({
      label: translate('fun.game_imagine.use_image'),
      style: MessageComponentButtonStyles.SUCCESS,
      run: async (ctx: ComponentContext) => {
        let key: TranslationKey = 'fun.game_imagine.submitted_wait';
        if (game.phase !== GamePhases.ROUND) {
          key = 'fun.game_imagine.round_over';
        } else if (player.submission) {
          key = 'fun.game_imagine.already_submitted';
        } else if (player.draftId !== draftId || !player.draft) {
          key = 'fun.game_imagine.outdated_preview';
        } else {
          player.submission = player.draft;
          player.draft = null;
        }
        await editOrReply(ctx, await renderPlayerMessage(ctx, {description: translate(key)}, false));
        if (key === 'fun.game_imagine.submitted_wait') {
          await onSubmitted(game);
        }
      },
    });
  }

  components.createButton({
    label: translate('fun.game_imagine.try_again'),
    style: (canUse) ? MessageComponentButtonStyles.SECONDARY : MessageComponentButtonStyles.PRIMARY,
    run: async (ctx: ComponentContext) => {
      if (game.phase !== GamePhases.ROUND || player.submission) {
        const key = (player.submission) ? 'fun.game_imagine.already_submitted' : 'fun.game_imagine.round_over';
        return editOrReply(ctx, await renderPlayerMessage(ctx, {description: translate(key)}, false));
      }
      return ctx.respond(createPromptModal(game, player, ctx, await getTranslator(ctx), true));
    },
  });

  return components;
}


async function onSubmitted(game: Game): Promise<void> {
  const everyone = Array.from(game.players.values()).every((player) => player.submission);
  if (everyone) {
    return startVoting(game);
  }
  return refreshGame(game);
}


async function startVoting(game: Game): Promise<void> {
  if (game.phase !== GamePhases.ROUND) {
    return;
  }
  game.timer.stop();
  // the round ran out, previews they didn't confirm are used as they are
  for (let player of game.players.values()) {
    if (!player.submission && player.draft) {
      player.submission = player.draft;
      player.draft = null;
    }
  }
  game.entries = Array.from(game.players.values()).filter((player) => player.submission);
  // nothing to vote on, the results go right on the game message
  if (game.entries.length < 2) {
    return finishGame(game);
  }

  game.phase = GamePhases.VOTING;
  game.deadline = Date.now() + VOTE_TIME;
  game.timer.start(VOTE_TIME, () => {
    finishGame(game).catch(() => {});
  });
  await refreshGame(game);

  // a new message so the gallery shows up at the bottom of the chat, the game message is up where it started
  const translator = await getTranslator(game.context);
  const message = await renderDisplay(game.context, createVotePayload(game, translator));
  try {
    if (game.context instanceof Command.Context) {
      game.voteMessage = await game.context.rest.createMessage(game.context.channelId, message);
    } else {
      game.voteMessage = await game.context.createMessage(message);
    }
  } catch(error) {
    const { translate } = translator;
    return failGame(game, translate('fun.game_imagine.vote_failed'), error);
  }
}


function createEntryLines(game: Game, translator: Translator, votes: Array<number> | null): Array<string> {
  return game.entries.map((player, index) => {
    const line = displayDetailsLine([
      `**${index + 1}.** <@${player.userId}>`,
      (votes) ? displayDetail(translator.translate('fun.game_imagine.votes'), votes[index]) : null,
    ]);
    return `${line}\n${formatPrompt(player.submission!.prompt)}`;
  });
}


function createVotePayload(game: Game, translator: Translator): DisplayPayload {
  const { translate } = translator;
  const components = new Components({timeout: VOTE_TIME + COMPONENTS_TIMEOUT_PADDING});
  for (let [ index, entry ] of game.entries.entries()) {
    components.createButton({
      label: String(index + 1),
      style: MessageComponentButtonStyles.SECONDARY,
      run: async (ctx: ComponentContext) => {
        if (game.phase !== GamePhases.VOTING) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }
        const { translate } = await getTranslator(ctx);
        if (entry.userId === ctx.userId) {
          return respondEphemeral(ctx, translate('fun.game_imagine.cannot_vote_self'));
        }
        // anyone watching can vote too, it only ends early once everyone in the game has
        game.votes.set(ctx.userId, index);
        await respondEphemeral(ctx, translate('fun.game_imagine.voted', {number: index + 1}));
        const voters = new Set([game.hostId, ...game.players.keys()]);
        if (Array.from(voters).every((userId) => game.votes.has(userId))) {
          await finishGame(game);
        }
      },
    });
  }

  return {
    components,
    description: displayDetails([
      translate('fun.game_imagine.vote_original'),
      '',
      ...createEntryLines(game, translator, null),
    ]),
    files: [imageFile(game.reference!, 'secret'), ...game.entries.map((player, index) => imageFile(player.submission!, String(index + 1)))],
    note: translate('fun.game_imagine.vote_ends', {time: displayTimestamp(game.deadline)}),
    // the original sits beside the text, the gallery under it is only the recreations, in their numbered order
    thumbnail: `attachment://secret.${game.reference!.extension}`,
    title: translate('fun.game_imagine.vote_title'),
  };
}


async function finishGame(game: Game): Promise<void> {
  if (game.phase !== GamePhases.ROUND && game.phase !== GamePhases.VOTING) {
    return;
  }
  cleanupGame(game);
  // the game message gets the winner, the vote message keeps the gallery with everyone's votes
  const refreshed = refreshGame(game);
  if (game.voteMessage) {
    const translator = await getTranslator(game.context);
    const message = await renderDisplay(game.context, createResultsPayload(game, translator, true));
    try {
      if (game.context instanceof Command.Context) {
        await game.voteMessage.edit({...message, attachments: []});
      } else {
        await game.context.editMessage(game.voteMessage.id, {...message, attachments: []});
      }
    } catch(error) {

    }
  }
  await refreshed;
}


function countVotes(game: Game): Array<number> {
  const votes = game.entries.map(() => 0);
  for (let index of game.votes.values()) {
    votes[index]++;
  }
  return votes;
}


// `withImages` for the message the results are shown in with the gallery, the game message has a short version when
// there was a vote message
function createResultsPayload(game: Game, translator: Translator, withImages: boolean): DisplayPayload {
  const { translate } = translator;
  const votes = countVotes(game);
  const most = Math.max(0, ...votes);

  let outcome: string;
  if (!game.entries.length) {
    outcome = translate('fun.game_imagine.no_submissions');
  } else if (game.entries.length === 1) {
    outcome = translate('fun.game_imagine.only_submission', {user: `<@${game.entries[0].userId}>`});
  } else if (!most) {
    outcome = translate('fun.game_imagine.no_votes');
  } else {
    const winners = game.entries.filter((player, index) => votes[index] === most).map((player) => `<@${player.userId}>`);
    const label = (winners.length === 1) ? translate('fun.game_imagine.winner') : translate('fun.game_imagine.tie');
    outcome = displayDetailsLine([displayDetail(label, winners.join(', ')), displayDetail(translate('fun.game_imagine.votes'), most)]);
  }

  const reference = game.reference!;
  const lines = [
    outcome,
    displayDetail(translate('fun.game_imagine.prompt_was'), Markup.escape.all(reference.prompt.replace(/\s+/g, ' '))),
  ];
  if (!withImages) {
    return {description: displayDetails([...lines, translate('fun.game_imagine.results_below')]), title: translate('fun.game_imagine.title')};
  }

  const showVotes = 2 <= game.entries.length;
  return {
    description: displayDetails([...lines, '', ...createEntryLines(game, translator, (showVotes) ? votes : null)]),
    files: [imageFile(reference, 'secret'), ...game.entries.map((player, index) => imageFile(player.submission!, String(index + 1)))],
    thumbnail: (game.entries.length) ? `attachment://secret.${reference.extension}` : null,
    title: translate('fun.game_imagine.results'),
  };
}
