import { Collections, Command, Interaction, Structures } from 'detritus-client';
import {
  InteractionCallbackTypes,
  MarkupTimestampStyles,
  MessageComponentButtonStyles,
  Permissions,
} from 'detritus-client/lib/constants';
import { ComponentContext, Components, InteractionModalContext, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { formatPermissions, replyWarning } from '../../../commands/errors';
import GuildSettingsStore from '../../../stores/guildsettings';
import ServerExecutionsStore from '../../../stores/serverexecutions';
import { I18n, displayDetail, displayDetailsLine, displayReply, formatUserForAuditLog } from '../../../utils';


export const COMMAND_ID = 'moderation.prune';
// shown in the `-in` permission errors
const COMMAND_NAME = 'prune';

export const MAX_FETCHES = 10;
export const MAX_MESSAGE_LIFE = 4 * 1000;
export const MAX_MESSAGES_BEFORE_CONFIRMATION = 15;
export const MAX_TIME_TO_RESPOND = 60 * 1000;
export const TWO_WEEKS_IN_MILLISECONDS = 2 * 7 * 24 * 60 * 60 * 1000;
export const TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY = TWO_WEEKS_IN_MILLISECONDS - 200;


export interface CommandArgsBefore {
  after?: string,
  amount: number,
  attachments?: boolean,
  before?: string,
  bots?: boolean,
  embeds?: boolean,
  from?: Array<Structures.Member | Structures.User>,
  images?: boolean,
  in?: Structures.Channel,
  until?: string,
  with?: string,
  yes?: boolean,
}

export interface CommandArgs {
  after?: string,
  amount: number,
  attachments?: boolean,
  before?: string,
  bots?: boolean,
  embeds?: boolean,
  from?: Array<Structures.Member | Structures.User>,
  images?: boolean,
  in?: Structures.Channel,
  // not a command arg, warn's prune modal goes back to a time instead of a message, it becomes `until`
  since?: number,
  until?: string,
  with?: string,
}


export interface PruneOptions {
  // extra check on top of `shouldDelete`, used by `clean` to only pick our messages and command invocations
  filter?: (message: Structures.Message) => boolean,
  // makes `amount` count groups instead of messages, returns the id of the message/interaction that started the
  // message's group (like a command message and its responses), which is also the oldest message the group can have
  group?: (message: Structures.Message) => string,
  // `prune.found_partial` but for when `amount` counts groups
  partialKey?: I18n.TranslationKey,
  // a button press (or a modal submitted from one) on another command's reply to answer through, like warn's prune
  // button, instead of editing that reply. Only our response there is cleared and it isn't about the command's message,
  // so it goes back from now
  replyTo?: ComponentContext | InteractionModalContext,
  // delete without the continue/cancel confirmation when finding this many or fewer (and the whole range was walked),
  // `prune` leaves it unset so it always asks
  skipConfirmationUpTo?: number,
  // delete whatever was found without the confirmation, even a partial search, `prune -yes`
  skipConfirmation?: boolean,
}


// what `amount` limits: matched messages, or groups of them when `group` is given
export class PruneCounter {
  amount: number;
  group?: (message: Structures.Message) => string;
  groups = new Set<bigint>();
  messages = 0;

  constructor(amount: number, group?: (message: Structures.Message) => string) {
    this.amount = amount;
    this.group = group;
  }

  get found(): number {
    return (this.group) ? this.groups.size : this.messages;
  }

  get isFull(): boolean {
    return this.amount <= this.found;
  }

  // whether a matched message fits, once full only messages of groups we already have are taken
  take(message: Structures.Message): boolean {
    if (this.group) {
      const groupId = BigInt(this.group(message));
      if (!this.groups.has(groupId)) {
        if (this.isFull) {
          return false;
        }
        this.groups.add(groupId);
      }
      return true;
    }
    if (this.isFull) {
      return false;
    }
    this.messages++;
    return true;
  }

  // when walking backwards, whether anything older than `messageId` could still be taken
  isDone(messageId: string): boolean {
    if (!this.isFull) {
      return false;
    }
    if (this.group) {
      // a group's id is its oldest message, so it's complete once we've walked down to it
      const id = BigInt(messageId);
      for (let groupId of this.groups) {
        if (groupId < id) {
          return false;
        }
      }
    }
    return true;
  }
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  options: PruneOptions = {},
) {
  const translator = await I18n.getTranslator(context);
  const { language, translate } = translator;
  const bulk = new Collections.BaseCollection<string, Structures.Message>();
  const manual = new Collections.BaseCollection<string, Structures.Message>();

  const channelId = (args.in) ? args.in.id : context.channelId!;

  // command permissions are only checked in the channel the command was used in, so check the `in` channel ourselves
  if (args.in && args.in.id !== context.channelId) {
    // use the cached channel, slash command resolved channels don't include permission overwrites
    const channel = context.channels.get(args.in.id);
    if (!channel || !context.guildId || channel.guildId !== context.guildId || !context.member) {
      return replyWarning(context, translate('errors.channel_not_found'));
    }
    const command = `${Markup.codestring(COMMAND_NAME)} -> ${channel.mention}`;

    const requiredUser = [Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY, Permissions.MANAGE_MESSAGES];
    const failedUser = requiredUser.filter((permission) => !channel.can(permission, context.member!));
    if (failedUser.length) {
      return replyWarning(context, translate('errors.prefix_user_missing_permissions', {
        command,
        permissions: formatPermissions(failedUser, translator),
      }));
    }

    const requiredBot = [Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY, Permissions.MANAGE_MESSAGES];
    const failedBot = requiredBot.filter((permission) => !channel.can(permission));
    if (failedBot.length) {
      return replyWarning(context, translate('errors.prefix_bot_missing_permissions', {
        command,
        permissions: formatPermissions(failedBot, translator),
      }));
    }
  }

  // bulk deleting needs Manage Messages even for our own messages, `clean` can run without it
  const cachedChannel = context.channels.get(channelId);
  const canBulkDelete = !context.inDm && (!cachedChannel || cachedChannel.can(Permissions.MANAGE_MESSAGES));
  // `from` also takes our responses to their commands, the id of the command use each one was taken for
  const commandIds = new Map<string, string>();
  const prefixes = (args.from && args.from.length) ? await getCommandPrefixes(context) : null;
  const isMatch = (message: Structures.Message) => {
    if (options.filter && !options.filter(message)) {
      return false;
    }
    if (shouldDelete(message, args)) {
      return true;
    }
    const commandId = (prefixes) ? getMatchedCommandId(context, prefixes, message, args) : null;
    if (commandId) {
      commandIds.set(message.id, commandId);
      return true;
    }
    return false;
  };
  // `amount` still counts their messages, with a command's responses going along with it
  const group = options.group || ((prefixes) ? (message: Structures.Message) => commandIds.get(message.id) || message.id : undefined);
  const counter = new PruneCounter(args.amount, group);
  // answering through `replyTo` leaves the command's message alone, but our response there (the confirmation, edited
  // into the result) still clears like the command's
  const toClear = (...messages: Array<Structures.Message | null | void>): Array<ClearableResponse> => {
    return (options.replyTo) ? [options.replyTo] : messagesToClear(context, ...messages);
  };

  const isExecuting = ServerExecutionsStore.getOrCreate((context.guildId || context.channelId)!);
  if (isExecuting.prune) {
    return displayReply(context, {description: translate('prune.in_progress')}, {replyTo: options.replyTo});
  }

  // set when we walk back far enough to hit the `until` message, meaning everything in the range was found
  let reachedUntil = false;
  // set when walking forwards with `after` reaches the upper bound
  let reachedEnd = false;
  // set once `amount` is reached and nothing older can be part of what we've taken
  let reachedAmount = false;
  // set when walking backwards hits the start of the channel, so a search with nothing found didn't stop early
  let reachedStart = false;
  // how many messages in the range were looked at, shown when nothing was found before we stopped searching
  let checked = 0;
  // the filters this prune was given, listed on the confirmation
  let filters = '';

  isExecuting.prune = true;
  try {
    if (args.since && !args.until) {
      args.until = snowflakeFromTimestamp(args.since);
    }

    let after: string | undefined;
    if (args.after) {
      after = args.after;
    }

    let before: string;
    if (args.before) {
      before = args.before;
    } else if (context instanceof Command.Context && !options.replyTo) {
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId && messageReference.channelId === channelId) {
        // we do not want to delete the referenced message, right?
        args.before = before = messageReference.messageId; //String(BigInt(messageReference.messageId) + 1n);
      } else {
        before = context.messageId;
      }
    } else {
      before = snowflakeFromNow();
    }
    // before the upper bound below fills in `before`, so only a given `before` (or the replied to message) is listed
    filters = formatPruneFilters(context, args, channelId, translator);
    // always filter by the upper bound so `-after` (which walks forwards) never picks up the command message or anything newer
    if (!args.before) {
      args.before = before;
    }
    const upperBound = BigInt(before);

    if (after) {
      // messages older than 2 weeks can't be bulk deleted, so skip ahead to the 2 week mark instead of stopping on the first page
      const twoWeeksAgo = snowflakeFromTimestamp(Date.now() - TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY);
      if (BigInt(after) < BigInt(twoWeeksAgo)) {
        after = twoWeeksAgo;
      }
    }

    let until: bigint | undefined;
    if (args.until) {
      until = BigInt(args.until);
      // nothing to walk if the range is empty
      if (BigInt(before) <= until) {
        reachedUntil = true;
      }
      // when walking forwards, start at the until message instead of fetching older pages we'd skip anyway
      if (after && BigInt(after) < until - 1n) {
        after = String(until - 1n);
      }
    }

    // always fetch instead of walking the cached messages first, the cache is in insertion order (an edit re-caches an old
    // message at the end) and has gaps from expiry, so hitting an old cached message would stop at `until` early
    let tries = 0;
    while (!reachedUntil && !reachedEnd && !reachedAmount && tries++ < MAX_FETCHES) {
      let messages: Array<Structures.Message>;
      if (after) {
        const cache = await context.rest.fetchMessages(channelId, {after, limit: 100});
        messages = cache.toArray().reverse();
        if (cache.length) {
          after = cache.first()!.id;
          before = messages[0]!.id;
        }
        // walked past the upper bound (or hit the newest message), nothing newer to look at
        if (messages.length < 100 || upperBound <= BigInt(after)) {
          reachedEnd = true;
        }
      } else {
        const cache = await context.rest.fetchMessages(channelId, {before, limit: 100});
        messages = cache.toArray();
        // hit the start of the channel, so everything after `until` has been seen
        if (messages.length < 100) {
          reachedStart = true;
          if (until !== undefined) {
            reachedUntil = true;
          }
        }
      }
      if (!messages.length) {
        break;
      }
      for (let message of messages) {
        // when walking backwards, everything past `until` is older, so stop fetching entirely
        if (!after && until !== undefined && BigInt(message.id) < until) {
          reachedUntil = true;
          break;
        }
        checked++;
        if (isMatch(message) && counter.take(message)) {
          if (canBulkDelete && shouldBulkDelete(message.createdAtUnix)) {
            bulk.set(message.id, message);
          } else {
            manual.set(message.id, message);
          }
        }
        if (!after) {
          before = message.id;
        }
        // with groups, keep walking back for the older messages of the groups we have (like the command message)
        if ((after) ? counter.isFull : counter.isDone(message.id)) {
          reachedAmount = true;
          break;
        }
      }
      if (!shouldBulkDelete(Snowflake.timestamp(before))) {
        // check before date to see if it was made before 2 weeks (temporarily)
        break;
      }
    }
  } catch(error) {
    isExecuting.prune = false;
    throw error;
  }

  if (bulk.length === 2) {
    for (let [messageId, message] of bulk) {
      manual.set(message.id, message);
    }
    bulk.clear();
  }

  const total = bulk.length + manual.length;
  // finding fewer than `amount` is expected once we've walked the whole range (hit `until`, or the upper bound with `after`)
  const isComplete = counter.isFull || reachedUntil || reachedEnd;
  const timeout = new Timers.Timeout();
  if (total) {
    const skipConfirmation = options.skipConfirmation || (
      options.skipConfirmationUpTo !== undefined && total <= options.skipConfirmationUpTo && isComplete
    );
    if (skipConfirmation) {
      try {
        const message = await displayReply(context, {description: translate('prune.starting', {count: total.toLocaleString(language)})}, {replyTo: options.replyTo});
        const deletedTotal = await deleteMessages(context, channelId, bulk, manual);
        // edits the starting response
        if (deletedTotal === total) {
          await displayReply(context, {description: translate('prune.deleted', {count: deletedTotal.toLocaleString(language)})}, {replyTo: options.replyTo});
        } else {
          await displayReply(context, {description: translate('prune.deleted_partial', {count: deletedTotal.toLocaleString(language), total: total.toLocaleString(language)})}, {replyTo: options.replyTo});
        }
        await clearMessages(timeout, toClear(message));
      } catch(error) {
        await displayReply(context, {description: translate('prune.errored', {error: String(error)})}, {replyTo: options.replyTo});
      } finally {
        isExecuting.prune = false;
      }
    } else {
      // keep holding the prune lock until continue/cancel is pressed (or nobody answers), otherwise another large prune
      // could be started while this one is waiting on confirmation
      let responded = false;
      const components = new Components({
        timeout: MAX_TIME_TO_RESPOND,
        onTimeout: () => {
          if (!responded) {
            isExecuting.prune = false;
          }
        },
      });
      components.createButton({
        label: translate('common.continue'),
        style: MessageComponentButtonStyles.DANGER,
        run: async (ctx: ComponentContext) => {
          if (responded || !timeout.hasStarted || ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }
          responded = true;
          timeout.stop();

          try {
            await displayReply(context, {description: translate('prune.starting', {count: total.toLocaleString(language)})}, {replyTo: ctx});
            const deletedTotal = await deleteMessages(context, channelId, bulk, manual);
            if (deletedTotal === total) {
              await displayReply(context, {description: translate('prune.deleted', {count: deletedTotal.toLocaleString(language)})}, {replyTo: ctx});
            } else {
              await displayReply(context, {description: translate('prune.deleted_partial', {count: deletedTotal.toLocaleString(language), total: total.toLocaleString(language)})}, {replyTo: ctx});
            }
          } catch(error) {
            await displayReply(context, {description: translate('prune.errored', {error: String(error)})}, {replyTo: ctx});
          } finally {
            isExecuting.prune = false;
          }

          await clearMessages(timeout, toClear(message));
        },
      });

      components.createButton({
        label: translate('common.cancel'),
        style: MessageComponentButtonStyles.SECONDARY,
        run: async (ctx: ComponentContext) => {
          if (responded || !timeout.hasStarted || ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }
          responded = true;
          timeout.stop();

          isExecuting.prune = false;
          await displayReply(context, {description: translate('prune.canceled', {count: total.toLocaleString(language)})}, {replyTo: ctx});
          // the command's message right away, then the confirmation. With `replyTo` there's only the confirmation
          if (options.replyTo) {
            await clearMessages(timeout, toClear());
          } else {
            await clearMessages(timeout, toClear(), 0);
            await clearMessages(timeout, (message) ? [message] : []);
          }
        },
      });

      let content: string;
      if (isComplete) {
        content = translate('prune.found', {count: total.toLocaleString(language)});
      } else {
        content = translate(options.partialKey || 'prune.found_partial', {
          count: total.toLocaleString(language),
          found: counter.found.toLocaleString(language),
          requested: args.amount.toLocaleString(language),
        });
      }
      if (filters) {
        content += `\n${filters}`;
      }

      const message = await displayReply(context, {components, description: content}, {replyTo: options.replyTo}).catch((error) => {
        isExecuting.prune = false;
        throw error;
      });
      clearMessages(timeout, toClear(message), MAX_TIME_TO_RESPOND).then(() => {
        // the confirmation expired without an answer
        if (!responded) {
          responded = true;
          isExecuting.prune = false;
        }
      });
    }
  } else {
    isExecuting.prune = false;
    // say how far we looked when the search stopped (fetch limit or 2 week mark) before covering the whole range
    const description = (isComplete || reachedStart) ? translate('prune.none') : translate('prune.none_partial', {
      count: checked.toLocaleString(language),
    });
    const message = await displayReply(context, {description, ephemeral: true}, {replyTo: options.replyTo});
    clearMessages(timeout, toClear(message));
  }
}


export async function deleteMessages(
  context: Command.Context | Interaction.InteractionContext,
  channelId: string,
  bulk: Collections.BaseCollection<string, Structures.Message>,
  manual: Collections.BaseCollection<string, Structures.Message>,
): Promise<number> {
  const bulkToDelete = bulk.filter((message) => message.canDelete && !message.deleted).map((message) => message.id);
  const manualToDelete = manual.filter((message) => message.canDelete && !message.deleted).map((message) => message.id);
  const deletedTotal = bulkToDelete.length + manualToDelete.length;

  // audit log reasons are in the server's language since the whole server sees them
  const { translate } = I18n.getCachedGuildTranslator(context);
  const reason = translate('prune.audit_reason', {count: deletedTotal.toLocaleString(), user: formatUserForAuditLog(context.user)});

  for (let i = 0; i < bulkToDelete.length; i += 100) {
    const messageIds = bulkToDelete.slice(i, i + 100);
    if (messageIds.length === 1) {
      await context.rest.deleteMessage(channelId, messageIds[0], {reason});
    } else {
      await context.rest.bulkDeleteMessages(channelId, messageIds, {reason});
    }
  }

  for (let messageId of manualToDelete) {
    await context.rest.deleteMessage(channelId, messageId, {reason});
  }

  return deletedTotal;
}

// a message, or the response of the interaction answered through `replyTo`
export type ClearableResponse = Structures.Message | ComponentContext | InteractionModalContext;

export async function clearMessages(timeout: Timers.Timeout, messages: Array<ClearableResponse>, timeToWait = MAX_MESSAGE_LIFE): Promise<void> {
  return new Promise((resolve) => {
    timeout.start(timeToWait, async () => {
      try {
        for (let message of messages) {
          if (!(message instanceof Structures.Message)) {
            await message.deleteResponse();
          } else if (message.canDelete && !message.deleted) {
            await message.delete();
          }
        }
      } catch(error) {
        // /shrug
      }
      resolve();
    });
  });
}

// a subtext line of the filters a prune was given, labeled with the localized slash option names
export function formatPruneFilters(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  channelId: string,
  translator: I18n.Translator,
): string {
  const { translate } = translator;
  const messageLink = (messageId: string) => `https://discord.com/channels/${context.guildId || '@me'}/${channelId}/${messageId}`;
  return displayDetailsLine([
    (args.from) && displayDetail(translate('commands.moderation.prune.from.name'), args.from.map((user) => user.mention).join(', ')),
    (args.with) && displayDetail(translate('commands.moderation.prune.with.name'), Markup.codestring(args.with)),
    (args.in && args.in.id !== context.channelId) && displayDetail(translate('commands.moderation.prune.in.name'), args.in.mention),
    (args.after) && displayDetail(translate('commands.moderation.prune.after.name'), messageLink(args.after)),
    (args.before) && displayDetail(translate('commands.moderation.prune.before.name'), messageLink(args.before)),
    (args.until) && displayDetail(translate('commands.moderation.prune.until.name'), (args.since) ? (
      Markup.timestamp(new Date(args.since), MarkupTimestampStyles.RELATIVE)
    ) : messageLink(args.until)),
    (args.bots) && translate('commands.moderation.prune.bots.name'),
    (args.attachments) && translate('commands.moderation.prune.attachments.name'),
    (args.embeds) && translate('commands.moderation.prune.embeds.name'),
    (args.images) && translate('commands.moderation.prune.images.name'),
  ], true);
}

// mention prefixes plus the server's custom prefixes (or the defaults)
export async function getCommandPrefixes(
  context: Command.Context | Interaction.InteractionContext,
): Promise<Array<string>> {
  const { commandClient } = context;
  if (!commandClient) {
    return [];
  }
  const prefixes: Array<string> = Array.from(commandClient.prefixes.mention);
  const settings = (context.guildId) ? await GuildSettingsStore.getOrFetch(context, context.guildId) : null;
  if (settings && settings.prefixes.length) {
    prefixes.push(...settings.prefixes.map(({prefix}) => prefix));
  } else {
    prefixes.push(...commandClient.prefixes.custom);
  }
  return prefixes.map((prefix) => prefix.toLowerCase()).filter((prefix) => !!prefix);
}

// whether this text starts with one of our prefixes followed by an actual command name (so `...lol` isn't one with a `.` prefix)
export function isCommandContent(
  context: Command.Context | Interaction.InteractionContext,
  prefixes: Array<string>,
  content: string,
): boolean {
  const { commandClient } = context;
  if (!commandClient) {
    return false;
  }
  const insensitive = content.trim().toLowerCase();
  for (let prefix of prefixes) {
    if (insensitive.startsWith(prefix)) {
      const rest = insensitive.slice(prefix.length).trim();
      if (rest && commandClient.commands.some((command) => !!command.getName(rest))) {
        return true;
      }
    }
  }
  return false;
}


// the id of the command use this message of ours responds to, when that command matches `args` like a message would (a
// slash command being a message from its user without any content). The response itself only has to be in the range
export function getMatchedCommandId(
  context: Command.Context | Interaction.InteractionContext,
  prefixes: Array<string>,
  message: Structures.Message,
  args: CommandArgs,
): string | null {
  if (!args.from) {
    return null;
  }
  const isOurs = message.author.id === context.client.userId || (!!message.webhookId && message.webhookId === context.applicationId);
  if (!isOurs || !shouldDelete(message, {after: args.after, amount: args.amount, before: args.before, until: args.until})) {
    return null;
  }

  // slash command/context menu/component responses and their followups, a modal's belongs to who opened it
  const metadata = message.interactionMetadata;
  const interaction = (metadata) ? (metadata.triggeringInteractionMetadata || metadata) : message.interaction;
  if (interaction) {
    if (args.with || args.bots || args.attachments || args.embeds || args.images) {
      return null;
    }
    return (args.from.some((user) => user.id === interaction.user.id)) ? interaction.id : null;
  }

  // prefixed command responses reply to the command message
  const { messageReference } = message;
  if (!messageReference || !messageReference.messageId || messageReference.channelId !== message.channelId) {
    return null;
  }
  const command = message.referencedMessage || context.messages.get(messageReference.messageId);
  if (!command || command.author.bot || !isCommandContent(context, prefixes, command.content)) {
    return null;
  }
  return (shouldDelete(command, args)) ? command.id : null;
}

export function shouldBulkDelete(timestamp: number): boolean {
  return Date.now() - timestamp < TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY;
}

export function shouldDelete(message: Structures.Message, args: CommandArgs): boolean {
  if (!message.canDelete) {
    return false;
  }

  if (args.after || args.before) {
    const messageId = BigInt(message.id);

    if (args.after && messageId <= BigInt(args.after)) {
      return false;
    }

    if (args.before && BigInt(args.before) <= messageId) {
      return false;
    }
  }

  if (args.until && BigInt(message.id) < BigInt(args.until)) {
    return false;
  }

  if (args.from && !args.from.some((user) => message.author.id === user.id)) {
    return false;
  }

  if (args.with && !message.content.toLowerCase().includes(args.with.toLowerCase())) {
    return false;
  }

  // the content filters stack with each other (and with `from`/`with`), `-bots -images` only deletes bot messages with images
  if (args.bots && !(message.author.bot || message.fromWebhook)) {
    return false;
  }

  if (args.attachments && !message.attachments.length) {
    return false;
  }

  if (args.embeds && !message.embeds.length) {
    return false;
  }

  if (args.images && !hasImage(message)) {
    return false;
  }

  return true;
}

export function hasImage(message: Structures.Message): boolean {
  if (message.attachments.some((attachment) => attachment.isImage || attachment.isVideo)) {
    return true;
  }
  return message.embeds.some((embed) => !!(embed.image || embed.thumbnail || embed.video));
}


export function messagesToClear(
  context: Command.Context | Interaction.InteractionContext,
  ...messages: Array<Structures.Message | null | void>
): Array<Structures.Message> {
  // only clear up messages from prefixed commands, interaction responses are left alone
  if (!(context instanceof Command.Context)) {
    return [];
  }
  return [context.message, ...messages].filter((message) => !!message) as Array<Structures.Message>;
}

export const DISCORD_EPOCH = 1420070400000;

export function snowflakeFromNow(): string {
  return snowflakeFromTimestamp(Date.now());
}

export function snowflakeFromTimestamp(timestamp: number): string {
  return (BigInt(timestamp - DISCORD_EPOCH) << BigInt(22)).toString();
}
