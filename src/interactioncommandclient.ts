import { InteractionCommandClient, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags } from 'detritus-client/lib/constants';
import GuildSettingsStore from './stores/guildsettings';
import ServerSettingsStore from './stores/serversettings';
import UserStore from './stores/users';
import UserSettingsStore from './stores/usersettings';

import {
  BaseInteractionCommand,
  BaseInteractionCommandOption,
  InteractionCommandMetadata,
  answersItselfFirst,
  firstAnswerWaitLeft,
  haveInteractionChecksPassed,
  isBlockedUserInstallRun,
  keepFollowUpsPrivate,
  launchesActivity,
  markChecksIncomplete,
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
import { blockedGuildMessage, blockedServerMessage, blockedUserMessage } from './utils/componentchecks';
import { acknowledgeUserWarnings } from './api';
import type { GuildSettingsRule } from './api/structures/guildsettings';
import {
  CommandResults,
  getCommandGate,
  getCommandGateMessage,
  setCommandGate,
  setCommandReason,
  setCommandResult,
} from './commandresults';
import { runWithCommandContext } from './sentry';
import {
  INTERACTION_EXPIRED_AGE,
  getInteractionAge,
  recordExpiredResponse,
  startEarlyDefer,
} from './utils/interactiondeadline';


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


// commands answering with a modal can't be deferred (a modal is only ever a first response), and the ones that turned
// detritus' defer off (`triggerLoadingAfter` -1) answer on their own
function shouldDeferEarly(context: Interaction.InteractionContext): boolean {
  const invoker = context.invoker as any;
  const command = context.command as any;
  if (answersItselfFirst(context)) {
    return false;
  }
  const after = invoker.triggerLoadingAfter;
  return after !== undefined && 0 <= after;
}

// the defer for a command still unanswered at `INTERACTION_EARLY_DEFER_AGE`. past its checks it's the usual one (the
// user's response setting), still in them it's private: a gate's answer can be personal (staff warnings, a block
// reason) and the server's rules or a user install's turned off channel can still make the run private
async function deferEarly(context: Interaction.InteractionContext): Promise<void> {
  const invoker = context.invoker as any;
  if (haveInteractionChecksPassed(context)) {
    if (typeof(invoker.onLoadingTrigger) === 'function') {
      await Promise.resolve(invoker.onLoadingTrigger(context));
    } else {
      const ephemeral = invoker.triggerLoadingAsEphemeral || (context.command as any).triggerLoadingAsEphemeral;
      await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, (ephemeral) ? {flags: MessageFlags.EPHEMERAL} : undefined);
    }
    return;
  }
  await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
  keepFollowUpsPrivate(context);
}


// A command that answers by itself first (a modal, an activity launch: nothing may defer it) has discord's 3 seconds
// for all of it. What its checks read (the user, their settings, the server's, its command permissions) is asked for
// all at once and waited on for `FIRST_ANSWER_CHECKS_WAIT` in all: on a cold cache with a slow api each of those used to
// be waited on in turn (5 seconds for one alone), and neither the launch nor its fallback reply made it. What came in
// time is in the stores after this, the checks go on with that
async function loadFirstAnswerChecks(context: Interaction.InteractionContext): Promise<void> {
  const loads: Array<Promise<unknown>> = [
    UserStore.getOrFetch(context, context.userId),
    UserSettingsStore.getOrFetch(context, context.userId),
  ];
  if (context.guildId) {
    loads.push(GuildSettingsStore.getOrFetch(context, context.guildId));
    if (launchesActivity(context)) {
      // the server's command permissions (a user-install run where the server turned NotSoBot off): a launch asks in
      // its `run`, started here so its wait is this one (a modal never asks, it's private as it is)
      loads.push(isBlockedUserInstallRun(context));
    }
  } else if (context.channel && context.channel.ownerId && context.channelId) {
    loads.push(ServerSettingsStore.getOrFetch(context, context.channelId));
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    Promise.all(loads).catch(() => null),
    new Promise((resolve) => timeout = setTimeout(resolve, firstAnswerWaitLeft(context))),
  ]);
  if (timeout) {
    clearTimeout(timeout);
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
    return runWithCommandContext(context, async () => {
      // it reached us too late to answer (the host stalled, a gateway backlog): every response would 404 and the user
      // already sees it as failed, so it doesn't run at all instead of doing its work for no one (a ban, a song, a job)
      if (INTERACTION_EXPIRED_AGE <= getInteractionAge(context.interactionId)) {
        setCommandResult(context, CommandResults.CANCELLED);
        setCommandReason(context, 'interaction_expired');
        recordExpiredResponse();
        return;
      }
      const stopEarlyDefer = (shouldDeferEarly(context)) ? startEarlyDefer(context, () => deferEarly(context)) : null;
      try {
        return await super.handleApplicationCommandContext(context, data);
      } finally {
        if (stopEarlyDefer) {
          stopEarlyDefer();
        }
      }
    });
  }

  // an autocomplete that reached us too late isn't answered, discord already gave up on it
  async handleApplicationCommandAutoComplete(event: Parameters<InteractionCommandClient['handleApplicationCommandAutoComplete']>[0]) {
    if (INTERACTION_EXPIRED_AGE <= getInteractionAge(event.interaction.id)) {
      recordExpiredResponse();
      return;
    }
    return super.handleApplicationCommandAutoComplete(event);
  }

  async onCommandCheck(context: Interaction.InteractionContext, command: Interaction.InteractionCommand) {
    const contextMetadata = context.metadata = context.metadata || {};
    contextMetadata.started = Date.now();

    if (context.user.isClientOwner) {
      return true;
    }

    // answers by itself first (`loadFirstAnswerChecks`): from here on only what's in the stores, nothing waits on the
    // api again. A check whose data didn't come in time is skipped, the run is marked (`markChecksIncomplete`) and
    // posts nothing in the channel for it (the launch message)
    const quick = answersItselfFirst(context);
    let translate: I18n.Translator['translate'];
    let user: Awaited<ReturnType<typeof UserStore.getOrFetch>>;
    if (quick) {
      await loadFirstAnswerChecks(context);
      translate = I18n.getCachedTranslator(context).translate;
      user = UserStore.get(context.userId) || null;
      if (!user || !UserSettingsStore.has(context.userId)) {
        markChecksIncomplete(context);
      }
    } else {
      // at the same time, on a cold cache each is a request and all of it happens before the defer
      const [ translator, fetched ] = await Promise.all([
        I18n.getTranslator(context),
        UserStore.getOrFetch(context, context.userId),
      ]);
      translate = translator.translate;
      user = fetched;
    }
    // (not known in time for a `quick` one: the api turns a blocked user's activity away itself)
    if (!user && !quick) {
      return setCommandGate(context, {kind: 'user_fetch_failed', message: translate('blocked.user_fetch_failed')});
    }
    if (user && user.isBlocked) {
      return setCommandGate(context, {kind: 'user_blocked', message: blockedUserMessage(translate, user)});
    }

    // a warning from NotSoBot staff takes the place of this command, they run it again after reading it
    if (user && user.warningsPending.length) {
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
        const settings = (quick) ? ServerSettingsStore.get(serverId) || null : await ServerSettingsStore.getOrFetch(context, serverId);
        if (settings && settings.blocked) {
          return setCommandGate(context, {kind: 'server_blocked', message: blockedServerMessage(translate, settings)});
        }
      }

      if (context.invoker.disableDm) {
        return setCommandGate(context, {kind: 'dm_disabled', message: translate('blocked.dm')});
      }
      return true;
    }

    const guildId = context.guildId!;
    // (`getForUpdate`: what's cached, or the last copy known when the api is failing, like `getOrFetch` falls back to)
    const settings = (quick) ? GuildSettingsStore.getForUpdate(guildId) || null : await GuildSettingsStore.getOrFetch(context, guildId);
    if (settings && settings.isBlocked) {
      // if we aren't able to fetch the settings, it will surpass the blocked setting cuz it's rare to block a guild
      return setCommandGate(context, {kind: 'server_blocked', message: blockedGuildMessage(translate, settings)});
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
          // what a launch (which is never deferred) goes by to post nothing in the channel: `isPrivateRun`
          const contextMetadata = context.metadata = context.metadata || {};
          contextMetadata.blockedByRule = true;
          // a modal has to be the first response, and it's private anyway. the early defer (`deferEarly`) may have been
          // first, it's private while the checks run
          if (!answersItselfFirst(context) && !context.responded) {
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

      if (!quick) {
        await UserSettingsStore.getOrFetch(context, context.userId);
        // load their settings into cache, todo: maybe only load it as needed?
        // loading as needed breaks the timestamp function in certain situations
      }

      return true;
    }
    if (quick) {
      // the server's settings didn't come in time: its rules weren't looked at, the launch goes on and stays quiet
      markChecksIncomplete(context);
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
