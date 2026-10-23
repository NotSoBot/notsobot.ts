import { Collections, Command, CommandAttributes, CommandClient, GatewayClientEvents, Interaction, Structures } from 'detritus-client';
import { ClientEvents, LOCAL_GUILD_ID } from 'detritus-client/lib/constants';

import { fetchCommandsResponses } from './api';
import { CommandResults, setCommandResult } from './commandresults';
import { BaseInteractionCommand } from './commands/interactions/basecommand';
import { replyWarning } from './commands/errors';
import ReportMessagesListener from './listeners/reportmessages';
import { CommandMetadata } from './commands/prefixed/basecommand';
import { runWithCommandContext } from './sentry';

import CommandResponsesStore from './stores/commandresponses';
import GuildSettingsStore from './stores/guildsettings';
import PremiumServersStore from './stores/premiumservers';
import PremiumUsersStore from './stores/premiumusers';
import UserStore from './stores/users';
import UserSettingsStore from './stores/usersettings';

import {
  GuildFeatures,
  GuildRuleActions,
  UserFlags,
} from './constants';
import {
  Formatter,
  I18n,
  cancelCommandRun,
  getCommandCategory,
  getCommandIdFromInvoker,
  isGuildRulesCommandId,
  resolveGuildRule,
  trackCommandRun,
  untrackCommandRun,
} from './utils';



// detritus' fill() puts an empty collection in the cache before fetching, so commands that run while it's fetching
// (or after it failed, it was never removed) saw no slash command permission overrides at all
const applicationCommandPermissionFills = new Map<string, Promise<void>>();

async function fillApplicationCommandPermissions(context: Command.Context, guildId: string): Promise<void> {
  let promise = applicationCommandPermissionFills.get(guildId);
  if (!promise) {
    promise = (async () => {
      try {
        await context.client.applicationCommandPermissions.fill(guildId);
      } catch(error) {
        context.client.applicationCommandPermissions.delete(guildId);
        throw error;
      } finally {
        applicationCommandPermissionFills.delete(guildId);
      }
    })();
    applicationCommandPermissionFills.set(guildId, promise);
  }
  return promise;
}

export class NotSoCommandClient extends CommandClient {
  async onCommandCheck(context: Command.Context, command: Command.Command) {
    const contextMetadata = context.metadata = context.metadata || {};
    contextMetadata.started = Date.now();

    if (context.user.isClientOwner) {
      // the timezone and language come from these, so load them before any early return
      await UserSettingsStore.getOrFetch(context, context.userId);
      return true;
    }

    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user || user.blocked) {
      return false;
    }

    // load their settings into cache before any early return (dms, admins, rules), the timezone and parser
    // error language are read from the cache only
    await UserSettingsStore.getOrFetch(context, context.userId);

    if (context.inDm) {
      return !command.disableDm;
    }

    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    // without settings (the fetch failed and there's no older copy) only admins get through, see the end
    if (settings && settings.blocked) {
      return false;
    }

    const { channel, member } = context;
    const commandId = getCommandIdFromInvoker(command);
    // the owner and admins skip the rules unless the server turned that off (for every rule or one)
    const isAdmin = !!member && (member.isOwner || member.canAdministrator);
    if (isAdmin && (!settings || isGuildRulesCommandId(commandId))) {
      return true;
    }

    if (!isAdmin && context.interactionCommandClient && context.channel && member) {
      const interactionCommand = context.interactionCommandClient.commands.find((x): x is BaseInteractionCommand => {
        return x instanceof BaseInteractionCommand && x.commandIds.has(commandId);
      });
      if (interactionCommand) {
        try {
          await fillApplicationCommandPermissions(context, guildId);
        } catch(error) {
          
        }
        const applicationCommandPermissions = context.client.applicationCommandPermissions.get(guildId);
        if (applicationCommandPermissions && applicationCommandPermissions.length) {
          const applicationCommandIds = [
            interactionCommand.ids.get(LOCAL_GUILD_ID),
            interactionCommand.ids.get(guildId),
          ].filter(Boolean) as Array<string>;
          for (let applicationCommandId of applicationCommandIds) {
            const applicationCommandPermission = applicationCommandPermissions.get(applicationCommandId);
            if (applicationCommandPermission && !applicationCommandPermission.isAllowed(context.channel, member)) {
              return false;
            }
          }
        }
      }
    }

    if (settings) {
      const match = resolveGuildRule(settings, GuildRuleActions.ACCESS, {
        category: getCommandCategory(this, commandId, (command.metadata as CommandMetadata | undefined)?.category),
        channel: channel || null,
        channelId: context.channelId,
        commandId,
        isAdmin,
        member: member || null,
        userId: context.userId,
      });
      if (match && !match.rule.allows) {
        // only rules with a message tell the user anything, see `onCommandCancel`
        contextMetadata.blockedMessage = match.rule.value.message;
        return false;
      }
      return true;
    }
    // couldn't load the server's settings and there's no older copy of them, so its rules can't be checked
    contextMetadata.settingsFetchFailed = true;
    return false;
  }

  async getAttributes(context: Command.Context): Promise<CommandAttributes | null> {
    const attributes = await super.getAttributes(context);
    if (attributes) {
      return attributes;
    }
    if (context.message.messageReference) {
      const replyMessage = context.message.messageReference.message;
      if (replyMessage && await isAIResponse(context, replyMessage) && await this.canPassToAICommand(context)) {
        return {content: context.message.content.trim(), prefix: ''};
      }
    }
    return null;
  }

  async getCommand(attributes: CommandAttributes, context?: Command.Context): Promise<Command.Command | null> {
    let command: Command.Command | null = null;

    if (context) {
      let maybePassToAICommand = this.prefixes.mention.has(attributes.prefix);
      if (!maybePassToAICommand && !attributes.prefix) {
        const replyMessage = (context.message.messageReference && context.message.messageReference.message);
        maybePassToAICommand = !!(replyMessage && await isAIResponse(context, replyMessage));
      }
      if (maybePassToAICommand && await this.canPassToAICommand(context)) {
        command = this.getAICommand();
      }
    }
    if (!command) {
      command = await Promise.resolve(super.getCommand(attributes, context));
    }
    // the custom command fallback, only when there could be a custom command to find. every prefixed message that
    // matched nothing (`...`, `.-.`) used to go through the whole command check (looking up the user, their settings)
    if (!command && attributes.content && (!context || await this.mightHaveCustomCommand(context))) {
      command = this.commands.find((x) => !x.name) || null;
    }
    return command;
  }

  // the same rules as `TagCustomCommandStore.maybeGetOrFetch*Commands`, from what's already in memory: a server with
  // free custom commands or a premium server slot given to it, or a user with premium. anything that can't be told
  // (settings or the premium lists not loading) says yes and lets the real check decide
  async mightHaveCustomCommand(context: Command.Context): Promise<boolean> {
    if (context.guildId) {
      // already loaded by the prefix check
      const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
      if (!settings || settings.features.has(GuildFeatures.FREE_CUSTOM_COMMANDS)) {
        return true;
      }
      // whether the users that gave it the slot still have premium plus is checked by the real check
      if (!(await PremiumServersStore.load(context)) || PremiumServersStore.has(context.guildId)) {
        return true;
      }
    }
    if (context.user.isClientOwner) {
      return true;
    }
    return (await PremiumUsersStore.isPremium(context, context.userId)) !== false;
  }

  getAICommand(): Command.Command | null {
    return this.commands.find((x) => x.name === 'ai') || null;
  }

  // if a mention or a reply to an ai response should go to the ai command, which needs premium. getAttributes and
  // getCommand both ask for the same message, so the check (the ai command's `onBefore`) only runs once
  canPassToAICommand(context: Command.Context): Promise<boolean> {
    let check = aiCommandChecks.get(context);
    if (!check) {
      check = (async () => {
        const command = this.getAICommand();
        if (!command) {
          return false;
        }
        if (typeof(command.onBefore) !== 'function') {
          return true;
        }
        const hasPremium = !!(await Promise.resolve(command.onBefore(context)));
        if (!hasPremium && context.metadata) {
          // it goes to the regular commands instead, the premium reason would be replied by any of them that cancels
          delete context.metadata.reason;
          delete context.metadata.reasonIsPremiumRequired;
        }
        return hasPremium;
      })();
      aiCommandChecks.set(context, check);
    }
    return check;
  }

  // an update to an uncached message (like pinning or starting a thread on one from years ago) has nothing to compare
  // with, detritus counts it as a content edit if it was ever edited and the edit duration only compares the edit to
  // when it was sent, so the command would re-run on it today. only trust uncached ones that were edited just now
  isContentEdit(event: GatewayClientEvents.MessageUpdate): boolean {
    if (!super.isContentEdit(event)) {
      return false;
    }
    if (event.differences) {
      return true;
    }
    const { message } = event;
    return !!message && message.isEdited && Math.abs(Date.now() - message.editedAtUnix) <= this.maxEditDuration;
  }

  // a reply to one of our report dms goes to staff on the report, but only when it isn't a command (prefixed, a mention
  // or a blocked one). edits don't send it again
  async handle(
    name: ClientEvents.MESSAGE_CREATE | ClientEvents.MESSAGE_UPDATE,
    event: GatewayClientEvents.MessageCreate | GatewayClientEvents.MessageUpdate,
  ) {
    try {
      return await super.handle(name as ClientEvents.MESSAGE_CREATE, event as GatewayClientEvents.MessageCreate);
    } finally {
      const { message } = event;
      if (name === ClientEvents.MESSAGE_CREATE && message && message.inDm && message.messageReference) {
        const commandContext = commandContexts.get(message);
        if (!commandContext || !commandContext.command) {
          ReportMessagesListener.handleReply(message.client, message).catch((error) => {
            console.error(`Failed to handle report reply ${message.id} from ${message.author.id}`, error);
          });
        }
      }
    }
  }

  // an edit re-runs the command, so cancel the previous run of it (and its jobs) before it can reply over this one
  async handleContext(
    name: ClientEvents.MESSAGE_CREATE | ClientEvents.MESSAGE_UPDATE,
    event: GatewayClientEvents.MessageCreate | GatewayClientEvents.MessageUpdate,
    context: Command.Context,
  ) {
    commandContexts.set(context.message, context);
    return runWithCommandContext(context, async () => {
      // edits past the edit duration don't re-run anything, leave the old run alone
      if (!this.isWithinEditDuration(context.message)) {
        return super.handleContext(name, event, context);
      }
      trackCommandRun(context);
      try {
        return await super.handleContext(name, event, context);
      } finally {
        if (!context.command) {
          untrackCommandRun(context);
        }
      }
    });
  }

  async handleDelete(name: ClientEvents.MESSAGE_DELETE, deletePayload: {raw: {id: string}}) {
    cancelCommandRun(deletePayload.raw.id);
    return super.handleDelete(name, deletePayload);
  }

  async handleDeleteBulk(deletePayload: {raw: {ids: Array<string>}}) {
    for (let messageId of deletePayload.raw.ids) {
      cancelCommandRun(messageId);
    }
    return super.handleDeleteBulk(deletePayload);
  }

  // blocked commands don't tell the user anything, except when the rule that blocked it has a message (once per user in
  // a channel every so often) or we couldn't load the server's settings to check them (once per channel every so
  // often, so an api outage doesn't spam every channel)
  async onCommandCancel(context: Command.Context, command: Command.Command) {
    setCommandResult(context, CommandResults.BLOCKED);
    // the custom command fallback runs for every unmatched prefixed message, those aren't commands
    if (!context.metadata || !command.name) {
      return;
    }
    if (context.metadata.blockedMessage) {
      const key = `${context.channelId}.${context.userId}`;
      if (blockedMessageReplies.has(key) || !context.canReply) {
        return;
      }
      blockedMessageReplies.set(key, Date.now());
      try {
        await replyWarning(context, context.metadata.blockedMessage);
      } catch(error) {

      }
      return;
    }
    if (!context.metadata.settingsFetchFailed) {
      return;
    }
    const now = Date.now();
    const last = settingsFetchFailedReplies.get(context.channelId);
    if (last !== undefined && now - last < SETTINGS_FETCH_FAILED_REPLY_INTERVAL) {
      return;
    }
    settingsFetchFailedReplies.set(context.channelId, now);
    if (!context.canReply) {
      return;
    }
    try {
      const { translate } = await I18n.getTranslator(context);
      await replyWarning(context, translate('blocked.server_fetch_failed'));
    } catch(error) {

    }
  }

  async onMessageCheck(context: Command.Context) {
    // ignore bots for automod
    if (context.user.bot) {
      return false;
    }

    // do automod checks
    if (context.guildId) {

    }

    return true;
  }

  async onPrefixCheck(context: Command.Context) {
    if (!context.user.bot && context.guildId) {
      const guildId: string = context.guildId;
  
      const settings = await GuildSettingsStore.getOrFetch(context, guildId);
      if (settings && settings.prefixes.length) {
        return settings.prefixes.map(({prefix}) => prefix);
      }
    }
    return this.prefixes.custom;
  }
}



// channel id -> when we last said the server's settings couldn't be loaded
const SETTINGS_FETCH_FAILED_REPLY_INTERVAL = 60 * 1000;
const settingsFetchFailedReplies = new Collections.BaseCollection<string, number>({expire: SETTINGS_FETCH_FAILED_REPLY_INTERVAL});

// `channel id.user id` -> when we last showed them a block rule's message
const BLOCKED_MESSAGE_REPLY_INTERVAL = 30 * 1000;
const blockedMessageReplies = new Collections.BaseCollection<string, number>({expire: BLOCKED_MESSAGE_REPLY_INTERVAL});

// the context `handle` made for a message, to tell after it whether it matched a command
const commandContexts = new WeakMap<Structures.Message, Command.Context>();

// getAttributes and getCommand both check the same reply, only hit the api once per message
const aiResponseChecks = new WeakMap<Structures.Message, Promise<boolean>>();
// per context, an edit re-runs with a new one and could've added or removed the mention
const aiCommandChecks = new WeakMap<Command.Context, Promise<boolean>>();

function isAIResponse(context: Command.Context, message: Structures.Message): Promise<boolean> {
  let check = aiResponseChecks.get(context.message);
  if (!check) {
    check = checkIsAIResponse(context, message);
    aiResponseChecks.set(context.message, check);
  }
  return check;
}

async function checkIsAIResponse(context: Command.Context, message: Structures.Message): Promise<boolean> {
  if (!message.author.isMe) {
    return false;
  }
  if (message.interaction) {
    return message.interaction.name === 'ai';
  }
  // what this process saw itself, only messages from before it started (or past what it remembers) ask the api
  const commandId = CommandResponsesStore.getResponseCommandId(context.client, message.id);
  if (commandId !== undefined) {
    return commandId === Formatter.Commands.TagGenerate.COMMAND_ID;
  }
  // prefixed responses reply to the message that triggered them
  const { messageReference } = message;
  if (!messageReference || !messageReference.messageId) {
    return false;
  }
  try {
    const { results } = await fetchCommandsResponses(context, {
      channelId: message.channelId,
      triggerIds: [messageReference.messageId],
    });
    return results.some((result) => {
      return result.message_response_id === message.id && result.command_id === Formatter.Commands.TagGenerate.COMMAND_ID;
    });
  } catch(error) {
    return false;
  }
}
