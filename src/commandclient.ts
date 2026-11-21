import { Collections, Command, CommandAttributes, CommandClient, GatewayClientEvents, Interaction, Structures } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';

import { acknowledgeUserWarnings, fetchCommandsResponses } from './api';
import type { GuildSettingsRule } from './api/structures/guildsettings';
import { RestResponsesRaw } from './api/types';
import { CommandResults, clearCommandGate, getCommandGate, setCommandGate, setCommandResult } from './commandresults';
import { getSlashCommandIds } from './commands/interactions/basecommand';
import { replyWarning } from './commands/errors';
import { CommandMetadata } from './commands/prefixed/basecommand';
import { runWithCommandContext } from './sentry';

import CommandResponsesStore from './stores/commandresponses';
import DecoyStore from './stores/decoys';
import GuildSettingsStore from './stores/guildsettings';
import PremiumServersStore, { getServerPremiumUsers } from './stores/premiumservers';
import PremiumUsersStore from './stores/premiumusers';
import TagCustomCommandStore from './stores/tagcustomcommands';
import UserStore from './stores/users';
import UserSettingsStore from './stores/usersettings';

import {
  AutoEmbedReactions,
  DiscordReactionEmojis,
  EmbedColors,
  GuildFeatures,
  GuildRuleActions,
  GuildWarningAutoTriggers,
  UserFlags,
} from './constants';
import {
  Formatter,
  I18n,
  cancelCommandRun,
  displayReply,
  getCommandCategory,
  getCommandIdFromInvoker,
  isGuildRulesCommandId,
  resolveGuildRule,
  trackCommandRun,
  untrackCommandRun,
} from './utils';
import { AutoEmbedLink, AutoEmbedSources, findAutoEmbedLink, getAutoEmbedLink } from './utils/autoembed';
import { isPrefixCommandBlockedByCommandPermissions } from './utils/commandpermissions';



// command names/aliases that are also how a question starts, after a mention they go to the ai (`how` is wikihow's,
// `im` image search's). their commands still run with the regular prefix, or for anyone that can't use the ai
const MENTION_AI_WORDS = new Set(['how', 'im']);

export class NotSoCommandClient extends CommandClient {
  async onCommandCheck(context: Command.Context, command: Command.Command) {
    const contextMetadata = context.metadata = context.metadata || {};
    contextMetadata.started = Date.now();

    if (context.user.isClientOwner) {
      // the timezone and language come from these, so load them before any early return
      await UserSettingsStore.getOrFetch(context, context.userId);
      return true;
    }

    // blocked users and servers (and dm-disabled commands) are stopped without a word, see `onCommandCancel`
    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user) {
      return setCommandGate(context, {kind: 'user_fetch_failed'});
    }
    if (user.isBlocked) {
      return setCommandGate(context, {kind: 'user_blocked'});
    }

    // a warning from NotSoBot staff takes the place of this command, they run it again after reading it. not for the
    // custom command fallback (`onCommandCancel` says nothing for those), it runs for every unmatched message, or an
    // auto-embed (they only pasted a link)
    if (user.warningsPending.length && command.name && !getAutoEmbedLink(context)) {
      return setCommandGate(context, {kind: 'warnings_pending', warnings: user.warningsPending});
    }

    // load their settings into cache before any early return (dms, admins, rules), the timezone and parser
    // error language are read from the cache only
    await UserSettingsStore.getOrFetch(context, context.userId);

    if (context.inDm) {
      return (command.disableDm) ? setCommandGate(context, {kind: 'dm_disabled'}) : true;
    }

    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    // without settings (the fetch failed and there's no older copy) only admins get through, see the end
    if (settings && settings.isBlocked) {
      return setCommandGate(context, {kind: 'server_blocked'});
    }

    const { channel, member } = context;
    const commandId = getCommandIdFromInvoker(command);
    // an auto-embed runs `download`, but someone who blocked `embed` means no embeds either, so it has to get past both
    const embedCommandId = (getAutoEmbedLink(context)) ? Formatter.Commands.ToolsEmbed.COMMAND_ID : null;
    // the owner and admins skip the rules unless the server turned that off (for every rule or one)
    const isAdmin = !!member && (member.isOwner || member.canAdministrator);
    if (isAdmin && (!settings || isGuildRulesCommandId(commandId))) {
      return true;
    }

    // discord applies its command permissions (Integrations) to slash commands only, the server picks which of them
    // prefix commands follow (`/server-rules integrations`): by default the ones on their own slash command
    if (!isAdmin && settings && context.channel && member) {
      const mode = settings.prefixCommandPermissions;
      const applicationCommandIds = getSlashCommandIds(context.interactionCommandClient, commandId, guildId);
      if (await isPrefixCommandBlockedByCommandPermissions(context, guildId, applicationCommandIds, context.channel, member, mode)) {
        // `onCommandCancel` reacts like a rule
        return setCommandGate(context, {kind: 'command_permissions'});
      }
      if (embedCommandId) {
        const embedApplicationCommandIds = getSlashCommandIds(context.interactionCommandClient, embedCommandId, guildId);
        if (await isPrefixCommandBlockedByCommandPermissions(context, guildId, embedApplicationCommandIds, context.channel, member, mode)) {
          return setCommandGate(context, {kind: 'command_permissions'});
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
        // only rules with a message tell the user anything, see `onCommandCancel`. the rule is for the server's
        // auto-warn on blocked commands, its reason says which rule
        return setCommandGate(context, {kind: 'rule', message: match.rule.value.message || null, rule: match.rule});
      }
      if (embedCommandId) {
        // only a rule on `embed` itself counts: its category is `download`'s too, so a category or everything rule already
        // decided above, where a rule allowing `download` can win over a blocked category. whoever/wherever the rule
        // targets still goes first, so a channel that allows everything wins over `embed` blocked server-wide
        const embedMatch = resolveGuildRule(settings, GuildRuleActions.ACCESS, {
          category: getCommandCategory(this, embedCommandId),
          channel: channel || null,
          channelId: context.channelId,
          commandId: embedCommandId,
          isAdmin,
          member: member || null,
          userId: context.userId,
        });
        if (embedMatch && !embedMatch.rule.allows && embedMatch.rule.command === embedCommandId) {
          return setCommandGate(context, {kind: 'rule', message: embedMatch.rule.value.message || null, rule: embedMatch.rule});
        }
      }
      return true;
    }
    // couldn't load the server's settings and there's no older copy of them, so its rules can't be checked
    return setCommandGate(context, {kind: 'settings_fetch_failed'});
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
    // the only link in it is to a post on an auto-embed site, `getCommand` sends that link (not the text) to `download`
    const autoEmbed = await this.findAutoEmbedLink(context);
    if (autoEmbed) {
      const contextMetadata = context.metadata = context.metadata || {};
      contextMetadata.autoEmbed = autoEmbed;
      return {content: autoEmbed.url, prefix: ''};
    }
    return null;
  }

  // auto-embed (a premium server perk): the message's only link, if it's to a post on one of the sites the server turned on,
  // it has a premium server slot and we can post the download there. Or the poster has premium and turned the site on for
  // their own links, and the server allows that (or it's their DM with us). it runs for every message without a prefix, so the link check (no
  // awaits) goes first and the settings and premium slots/users come from what's already loaded
  async findAutoEmbedLink(context: Command.Context): Promise<AutoEmbedLink | null> {
    const { channel, message } = context;
    if (message.attachments.length || message.stickerItems.length) {
      return null;
    }
    const link = findAutoEmbedLink(message.content);
    if (!link) {
      return null;
    }
    // their DM with us: only their own setting counts. nobody can hide the link's preview on someone else's message in a
    // DM (no manage messages there), so ours goes under it like `.dl` would
    if (!context.guildId) {
      if (await this.hasAutoEmbedUserSite(context, link.site)) {
        return {...link, source: AutoEmbedSources.USER};
      }
      return null;
    }
    if (!channel) {
      return null;
    }
    // can't talk here at all, the server muted us in this channel on purpose, say nothing
    if (!channel.canMessage) {
      return null;
    }
    // already loaded by the prefix check
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
    if (!settings || settings.isBlocked || !settings.settings) {
      return null;
    }
    // the server's own setting first (its text setting goes with it), then the poster's. a server that has the site on but
    // lost its slot still lets the poster's own setting do it
    let source: AutoEmbedSources | null = null;
    if (settings.settings.autoEmbed.includes(link.site) && await this.hasAutoEmbedServerSlot(context, context.guildId)) {
      source = AutoEmbedSources.SERVER;
    } else if (settings.settings.autoEmbedMembers && await this.hasAutoEmbedUserSite(context, link.site)) {
      source = AutoEmbedSources.USER;
    }
    if (!source) {
      return null;
    }
    // it's on for this link but we can't do it properly: no file to post, or the link's own preview would stay under ours
    // (two embeds of the same post). the padlock tells their admins a permission is missing instead of silently nothing
    if (!channel.canAttachFiles || !channel.canManageMessages) {
      if (AutoEmbedReactions.MISSING_PERMISSIONS) {
        await Formatter.Commands.ToolsDownload.reactAutoEmbed(context, AutoEmbedReactions.MISSING_PERMISSIONS);
      }
      return null;
    }
    return {...link, source};
  }

  // someone gave the server a premium server slot and still has premium plus
  async hasAutoEmbedServerSlot(context: Command.Context, guildId: string): Promise<boolean> {
    // the slots aren't loaded or nobody gave it one, skip looking up the users
    if (!(await PremiumServersStore.load(context)) || !PremiumServersStore.has(guildId)) {
      return false;
    }
    return !!(await getServerPremiumUsers(context)).length;
  }

  // the poster has premium (any tier) and turned the site on for their own links. the premium check is in memory, so only
  // premium users posting a matching link get their settings looked up (cached for hours after). when the premium users
  // couldn't be loaded it's skipped rather than looking up everyone's settings
  async hasAutoEmbedUserSite(context: Command.Context, site: string): Promise<boolean> {
    if (!(await PremiumUsersStore.isPremium(context, context.userId))) {
      return false;
    }
    const userSettings = await UserSettingsStore.getOrFetch(context, context.userId);
    return !!(userSettings && userSettings.auto_embed && userSettings.auto_embed.includes(site));
  }

  async getCommand(attributes: CommandAttributes, context?: Command.Context): Promise<Command.Command | null> {
    let command: Command.Command | null = null;

    if (context && getAutoEmbedLink(context)) {
      // `attributes.content` is the link, which is what `download` takes
      return this.commands.find((x) => x.name === 'download') || null;
    }

    if (context) {
      const isMention = this.prefixes.mention.has(attributes.prefix);
      if (isMention) {
        command = await this.getMentionCommand(attributes, context);
      }
      let maybePassToAICommand = isMention;
      if (!maybePassToAICommand && !attributes.prefix) {
        const replyMessage = (context.message.messageReference && context.message.messageReference.message);
        maybePassToAICommand = !!(replyMessage && await isAIResponse(context, replyMessage));
      }
      if (!command && maybePassToAICommand && await this.canPassToAICommand(context)) {
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

  // a mention is the prefix that keeps working without the message content intent (discord still sends us the content
  // of messages that mention us), so after one a command's name (or a custom command's) runs it and anything else is a
  // question for the ai. a few command aliases are how sentences start (`@NotSoBot how do i...`), those stay questions
  // for anyone that can use the ai
  async getMentionCommand(attributes: CommandAttributes, context: Command.Context): Promise<Command.Command | null> {
    const firstWord = attributes.content.split(/\s/, 1)[0].toLowerCase();
    if (MENTION_AI_WORDS.has(firstWord)) {
      return null;
    }
    const command = await Promise.resolve(super.getCommand(attributes, context));
    if (command) {
      return command;
    }
    if (attributes.content && await this.mightHaveCustomCommand(context) && await this.hasCustomCommand(context, attributes.content)) {
      return this.commands.find((x) => !x.name) || null;
    }
    return null;
  }

  // the same lookup as the custom command fallback's `onBeforeRun`, the server's custom commands then the user's own
  async hasCustomCommand(context: Command.Context, text: string): Promise<boolean> {
    const { findTagFromText } = Formatter.Commands.TagShowCustomCommand;
    if (context.guildId) {
      const tags = await TagCustomCommandStore.maybeGetOrFetchGuildCommands(context, context.guildId);
      if (tags && findTagFromText(text, tags)) {
        return true;
      }
    }
    const tags = await TagCustomCommandStore.maybeGetOrFetchUserCommands(context, context.userId);
    return !!(tags && findTagFromText(text, tags));
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
        if (!hasPremium) {
          // it goes to the regular commands instead, the premium gate would be replied by any of them that cancels
          clearCommandGate(context);
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

  // an edit re-runs the command, so cancel the previous run of it (and its jobs) before it can reply over this one
  async handleContext(
    name: ClientEvents.MESSAGE_CREATE | ClientEvents.MESSAGE_UPDATE,
    event: GatewayClientEvents.MessageCreate | GatewayClientEvents.MessageUpdate,
    context: Command.Context,
  ) {
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
    // the custom command fallback runs for every unmatched prefixed message, those aren't commands. an auto-embed the
    // rules (or a block, or a pending warning) stopped was just someone posting a link: no reply, no auto-warn
    const gate = getCommandGate(context);
    if (!gate || !command.name || getAutoEmbedLink(context)) {
      return;
    }
    if (gate.kind === 'warnings_pending') {
      if (!context.canReply) {
        return;
      }
      try {
        const { translate } = await I18n.getTranslator(context);
        const notice = Formatter.Commands.OwnerWarn.createUserWarningsNotice(translate, gate.warnings);
        await displayReply(context, {color: EmbedColors.ERROR, description: notice.content});
        // only once it was shown, a failed reply leaves them pending for the next command
        await acknowledgeUserWarnings(context, context.userId, {warningIds: notice.warningIds});
      } catch(error) {

      }
      return;
    }
    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    const blockedByRule = (gate.kind === 'rule') ? gate.rule : null;
    const autoWarnRule = (blockedByRule) ? this.resolveBlockedCommandAutoWarn(context) : null;
    const deleteReplies = !!autoWarnRule && AutoWarn.deletesBlockedCommand(autoWarnRule);
    if (deleteReplies) {
      // nothing left to cancel, deleting the trigger shouldn't mark the blocked run as cancelled
      untrackCommandRun(context);
      AutoWarn.deleteTriggerLater(context.message);
    }
    // the rule's message, once per user in a channel every so often
    const ruleMessage = (gate.kind === 'rule') ? gate.message : null;
    let blockedMessage: null | string = null;
    if (ruleMessage && context.canReply) {
      const key = `${context.channelId}.${context.userId}`;
      if (!blockedMessageReplies.has(key)) {
        blockedMessageReplies.set(key, Date.now());
        blockedMessage = ruleMessage;
      }
    }
    if (autoWarnRule || blockedMessage) {
      await this.replyBlockedCommand(context, command.name, autoWarnRule, blockedMessage, blockedByRule).catch(() => null);
    }
    if (ruleMessage) {
      return;
    }
    // a rule without a message (or the slash version's discord permissions) and no auto-warn: react so the command
    // isn't silently ignored. blocked users and servers have their own gates
    if ((gate.kind === 'rule' || gate.kind === 'command_permissions') && !autoWarnRule) {
      await this.reactNotAllowed(context, command.name);
      return;
    }
    if (gate.kind !== 'settings_fetch_failed') {
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

  // the not allowed stop sign on a blocked command, once per user and command in a channel every few minutes so a busy
  // channel with a blocked command doesn't fill up with them
  async reactNotAllowed(context: Command.Context, commandName: string): Promise<void> {
    const { message } = context;
    if (message.deleted || !message.canReact || message.reactions.has(DiscordReactionEmojis.NOT_ALLOWED.id)) {
      return;
    }
    const key = `${context.channelId}.${context.userId}.${commandName}`;
    if (notAllowedReactions.has(key)) {
      return;
    }
    notAllowedReactions.set(key, Date.now());
    try {
      await message.react(`${DiscordReactionEmojis.NOT_ALLOWED.name}:${DiscordReactionEmojis.NOT_ALLOWED.id}`);
    } catch(error) {

    }
  }

  async onMessageCheck(context: Command.Context) {
    // ignore bots for automod
    if (context.user.bot) {
      return false;
    }

    // the server's decoy channel handles its own posts, no command, ai reply, auto-embed or mention auto-warn there:
    // anything I post in it would stay up after the poster is removed (and moderators testing it get nothing either)
    if (context.guildId && DecoyStore.getByChannel(context.channelId)) {
      return false;
    }

    // automod, in the background so commands in the message don't wait on it
    if (context.guildId && context.member) {
      this.autoWarnMentions(context).catch(() => null);
    }

    return true;
  }

  // the server's auto-warn for mentioning too many users and roles in one message (or an edit adding them)
  async autoWarnMentions(context: Command.Context): Promise<void> {
    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    const member = context.member!;
    const mentions = AutoWarn.countMessageMentions(context.message);
    // the owner and admins don't get warned for pinging people
    if (!mentions || member.isOwner || member.canAdministrator) {
      return;
    }
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (!settings) {
      return;
    }
    const rule = AutoWarn.resolveGuildWarningAuto(settings, GuildWarningAutoTriggers.MENTIONS, context.channel || null, context.channelId);
    if (!rule || mentions <= rule.limit!) {
      return;
    }
    const audit = await I18n.getGuildTranslator(context);
    const reason = AutoWarn.createAutoWarnReason(audit, rule, {mentions});
    const result = await AutoWarn.runAutoWarn(context, {member, messageId: context.messageId, reason, rule, settings});
    if (result && context.canReply) {
      await context.reply({
        allowedMentions: {parse: [], users: [member.id]},
        content: AutoWarn.formatAutoWarnNotice(audit, member, rule, result, reason),
      });
    }
  }

  // the server's auto-warn rule for a blocked command here, unless it skips them
  resolveBlockedCommandAutoWarn(context: Command.Context): RestResponsesRaw.GuildWarningAuto | null {
    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    const member = context.member;
    const settings = (context.guildId) ? GuildSettingsStore.get(context.guildId) : null;
    if (!member || member.bot || !settings) {
      return null;
    }
    const rule = AutoWarn.resolveGuildWarningAuto(settings, GuildWarningAutoTriggers.BLOCKED_COMMAND, context.channel || null, context.channelId);
    if (!rule || AutoWarn.isGuildWarningAutoExempt(settings, rule, member)) {
      return null;
    }
    return rule;
  }

  // one reply for a blocked command: the rule's message and the server's auto-warn notice (the dm might not get there),
  // whichever of them there is. It goes with their message when the auto-warn rule deletes it
  async replyBlockedCommand(
    context: Command.Context,
    commandName: string,
    rule: RestResponsesRaw.GuildWarningAuto | null,
    blockedMessage: null | string,
    blockedBy: GuildSettingsRule | null,
  ): Promise<void> {
    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    const member = context.member!;
    let notice: null | string = null;
    if (rule) {
      try {
        const settings = GuildSettingsStore.get(context.guildId!)!;
        const audit = await I18n.getGuildTranslator(context);
        const reason = AutoWarn.createAutoWarnReason(audit, rule, {
          blockedBy,
          command: commandName,
          guild: context.guild,
        });
        const result = await AutoWarn.runAutoWarn(context, {member, messageId: context.messageId, reason, rule, settings});
        if (result) {
          notice = AutoWarn.formatAutoWarnNotice(audit, member, rule, result, reason);
        }
      } catch(error) {
        // the rule's message still goes out
      }
    }

    let reply: Structures.Message | null = null;
    if (blockedMessage) {
      reply = await replyWarning(context, [blockedMessage, notice].filter(Boolean).join('\n\n'), {
        allowedMentions: (notice) ? {users: [member.id]} : undefined,
      });
    } else if (notice && context.canReply) {
      reply = await context.reply({
        allowedMentions: {parse: [], users: [member.id]},
        content: notice,
        messageReference: {
          channelId: context.channelId,
          failIfNotExists: false,
          guildId: context.guildId,
          messageId: context.messageId,
        },
      });
    }
    if (rule && AutoWarn.deletesBlockedCommand(rule)) {
      AutoWarn.deleteWithTrigger(context.messageId, reply);
    }
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

// `channel id.user id.command name` -> when we last reacted to them using a blocked command
const NOT_ALLOWED_REACTION_INTERVAL = 5 * 60 * 1000;
const notAllowedReactions = new Collections.BaseCollection<string, number>({expire: NOT_ALLOWED_REACTION_INTERVAL});

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
