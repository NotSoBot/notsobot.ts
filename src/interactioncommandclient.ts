import { InteractionCommandClient, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from './stores/guildsettings';
import ServerSettingsStore from './stores/serversettings';
import UserStore from './stores/users';
import UserSettingsStore from './stores/usersettings';

import {
  BaseInteractionCommand,
  BaseInteractionCommandOption,
  InteractionCommandMetadata,
} from './commands/interactions/basecommand';
import { GuildRuleActions, GuildWarningAutoTriggers } from './constants';
import {
  Formatter,
  I18n,
  describeGuildRule,
  editOrReply,
  getCommandCategory,
  getCommandIdFromInvoker,
  isGuildRulesCommandId,
  resolveGuildRule,
} from './utils';
import { acknowledgeUserWarnings } from './api';
import type { GuildSettingsRule } from './api/structures/guildsettings';
import { CommandResults, getCommandGate, getCommandGateMessage, setCommandGate, setCommandResult } from './commandresults';
import { runWithCommandContext } from './sentry';


// discord's limit for a whole command (names, descriptions and choice values of it, its options and its choices)
// each field counts as its longest version, the default text or any of its localizations
export const MAX_APPLICATION_COMMAND_SIZE = 8000;

export interface ApplicationCommandSize {
  index: number,
  name: string,
  size: number,
}

function longestText(x: Record<string, any>, key: 'description' | 'name'): number {
  let length = String(x[key] || '').length;
  const localized = x[`${key}_localizations`];
  if (localized) {
    for (let locale in localized) {
      length = Math.max(length, String(localized[locale] || '').length);
    }
  }
  return length;
}

// a command's size, counted the way discord counts it
export function getApplicationCommandSize(raw: Record<string, any>): number {
  let size = longestText(raw, 'name') + longestText(raw, 'description');
  if (raw.value !== undefined) {
    size += String(raw.value).length;
  }
  for (let child of [...(raw.options || []), ...(raw.choices || [])]) {
    size += getApplicationCommandSize(child);
  }
  return size;
}

export interface ApplicationCommandDuplicateName {
  index: number,
  locale: string,
  names: Array<string>,
  path: string,
  value: string,
}

// options of one command or subcommand have to have different names in every language, a translation that matches a
// sibling's (like `file` and `attachment` both being `datei`) makes discord refuse the whole upload
function findDuplicateOptionNames(
  raw: Record<string, any>,
  index: number,
  path: string,
  found: Array<ApplicationCommandDuplicateName>,
): void {
  const options: Array<Record<string, any>> = raw.options || [];
  const locales = new Set<string>(['default']);
  for (let option of options) {
    for (let locale in (option.name_localizations || {})) {
      locales.add(locale);
    }
  }
  for (let locale of locales) {
    const byValue: Record<string, Array<string>> = {};
    for (let option of options) {
      const localized = (locale !== 'default' && option.name_localizations) ? option.name_localizations[locale] : null;
      const value = localized || option.name;
      (byValue[value] = byValue[value] || []).push(option.name);
    }
    for (let value in byValue) {
      if (1 < byValue[value].length) {
        found.push({index, locale, names: byValue[value], path, value});
      }
    }
  }
  for (let option of options) {
    findDuplicateOptionNames(option, index, `${path} ${option.name}`, found);
  }
}


export class NotSoInteractionClient extends InteractionCommandClient {
  // the option names discord will refuse for matching a sibling option's name in some language
  getDuplicateOptionNames(): Array<ApplicationCommandDuplicateName> {
    const found: Array<ApplicationCommandDuplicateName> = [];
    let index = 0;
    for (let command of this.commands) {
      const raw = JSON.parse(JSON.stringify(command));
      findDuplicateOptionNames(raw, index, raw.name, found);
      index++;
    }
    return found;
  }

  // the commands discord will refuse to upload for being too big, in the order they're uploaded
  getOversizedCommands(limit: number = MAX_APPLICATION_COMMAND_SIZE): Array<ApplicationCommandSize> {
    const oversized: Array<ApplicationCommandSize> = [];
    let index = 0;
    for (let command of this.commands) {
      const raw = JSON.parse(JSON.stringify(command));
      const size = getApplicationCommandSize(raw);
      if (limit < size) {
        oversized.push({index, name: raw.name, size});
      }
      index++;
    }
    return oversized;
  }

  async handleApplicationCommandContext(
    context: Interaction.InteractionContext,
    data: Structures.InteractionDataApplicationCommand,
  ) {
    return runWithCommandContext(context, () => super.handleApplicationCommandContext(context, data));
  }

  async onCommandCheck(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
    const contextMetadata = context.metadata = context.metadata || {};
    contextMetadata.started = Date.now();

    if (context.user.isClientOwner) {
      return true;
    }

    const { translate } = await I18n.getTranslator(context);
    const user = await UserStore.getOrFetch(context, context.userId);
    if (!user) {
      return setCommandGate(context, {kind: 'user_fetch_failed', message: translate('blocked.user_fetch_failed')});
    }
    if (user.isBlocked) {
      let message = translate('blocked.user');
      if (user.blockedReason) {
        message = `${message} (${translate('logger.reason')}: \`${user.blockedReason}\`)`;
      }
      message += Formatter.Commands.OwnerBlockUser.displayBlockedUntil(translate, user.blockedUntil);
      return setCommandGate(context, {kind: 'user_blocked', message});
    }

    // a warning from NotSoBot staff takes the place of this command, they run it again after reading it
    if (user.warningsPending.length) {
      const notice = Formatter.Commands.OwnerWarn.createUserWarningsNotice(translate, user.warningsPending);
      return setCommandGate(context, {
        kind: 'warnings_pending',
        message: notice.content,
        warningIds: notice.warningIds,
        warnings: user.warningsPending,
      });
    }

    if (context.inDm) {
      if (context.channel && context.channel.ownerId) {
        const serverId = context.channelId!;
        const settings = await ServerSettingsStore.getOrFetch(context, serverId);
        if (settings && settings.blocked) {
          let message = translate('blocked.server');
          if (settings.blockedReason) {
            message = `${message} (${translate('logger.reason')}: \`${Markup.codestring(settings.blockedReason)}\`)`;
          }
          return setCommandGate(context, {kind: 'server_blocked', message});
        }
      }

      if (context.invoker.disableDm) {
        return setCommandGate(context, {kind: 'dm_disabled', message: translate('blocked.dm')});
      }
      return true;
    }

    const guildId = context.guildId!;
    const settings = await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings && settings.isBlocked) {
      // if we aren't able to fetch the settings, it will surpass the blocked setting cuz it's rare to block a guild
      let message = translate('blocked.server');
      if (settings.blockedReason) {
        message = `${message} (${translate('logger.reason')}: \`${Markup.codestring(settings.blockedReason)}\`)`;
      }
      message += Formatter.Commands.OwnerBlockUser.displayBlockedUntil(translate, settings.blockedUntil);
      return setCommandGate(context, {kind: 'server_blocked', message});
    }

    const { member } = context;
    const invoker = context.invoker as BaseInteractionCommand | BaseInteractionCommandOption;
    const commandId = getCommandIdFromInvoker(invoker);

    // the owner and admins skip the rules unless the server turned that off (for every rule or one)
    const isAdmin = !!member && (member.isOwner || member.canAdministrator);
    if (isAdmin && (!settings || isGuildRulesCommandId(commandId))) {
      return true;
    }

    if (settings) {
      const metadata = invoker.metadata as InteractionCommandMetadata | undefined;
      const match = resolveGuildRule(settings, GuildRuleActions.ACCESS, {
        category: getCommandCategory(context.commandClient, commandId, metadata && metadata.category),
        channel: context.channel || null,
        channelId: context.channelId || null,
        commandId,
        isAdmin,
        member: member || null,
        userId: context.userId,
      });
      if (match && !match.rule.allows) {
        if (invoker.blockedCommandShouldStillExecute) {
          // a modal has to be the first response, and it's private anyway
          if (!(invoker as any).respondsWithModal && !(context.command as any).respondsWithModal) {
            await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
              flags: MessageFlags.EPHEMERAL,
            });
          }
          return true;
        }
        // the rule is for the server's auto-warn on blocked commands, its reason says which rule
        const message = match.rule.value.message || translate('rules.blocked', {rule: describeGuildRule(translate, match.rule)});
        return setCommandGate(context, {kind: 'rule', message, rule: match.rule});
      }

      await UserSettingsStore.getOrFetch(context, context.userId);
      // load their settings into cache, todo: maybe only load it as needed?
      // loading as needed breaks the timestamp function in certain situations

      return true;
    }
    // Failed to fetch, got null, just block it lol
    return setCommandGate(context, {kind: 'settings_fetch_failed', message: translate('blocked.server_fetch_failed')});
  }

  async onCommandCancel(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
    setCommandResult(context, CommandResults.BLOCKED);
    const gate = getCommandGate(context);
    let content = getCommandGateMessage(context);
    if (!content) {
      const { translate } = await I18n.getTranslator(context);
      content = translate('blocked.generic');
    }
    const reply = await editOrReply(context, {
      allowedMentions: {parse: []},
      content,
      flags: MessageFlags.EPHEMERAL,
    });
    if (gate && gate.kind === 'warnings_pending' && gate.warningIds) {
      // only once it was shown, a failed reply leaves them pending for the next command
      await acknowledgeUserWarnings(context, context.userId, {warningIds: gate.warningIds}).catch(() => null);
    }
    if (gate && gate.kind === 'rule') {
      await this.autoWarnBlockedCommand(context, gate.rule).catch(() => null);
    }
    return reply;
  }

  // the server's auto-warn for running a command its rules block for them, told privately under the blocked reply
  async autoWarnBlockedCommand(context: Interaction.InteractionContext, blockedBy: GuildSettingsRule): Promise<void> {
    const AutoWarn = Formatter.Commands.ModerationAutowarn;
    const member = context.member;
    const settings = (context.guildId) ? GuildSettingsStore.get(context.guildId) : null;
    if (!member || !settings) {
      return;
    }
    const rule = AutoWarn.resolveGuildWarningAuto(settings, GuildWarningAutoTriggers.BLOCKED_COMMAND, context.channel || null, context.channelId || null);
    if (!rule) {
      return;
    }
    const details = {blockedBy, command: `/${context.invoker.fullName}`, guild: context.guild};
    const audit = await I18n.getGuildTranslator(context);
    const result = await AutoWarn.runAutoWarn(context, {member, reason: AutoWarn.createAutoWarnReason(audit, rule, details), rule, settings});
    if (result) {
      const translator = await I18n.getTranslator(context);
      const reason = AutoWarn.createAutoWarnReason(translator, rule, details, true);
      await context.createMessage({
        allowedMentions: {parse: []},
        content: AutoWarn.formatAutoWarnNotice(translator, member, rule, result, reason, true),
        flags: MessageFlags.EPHEMERAL,
      });
    }
  }
}
