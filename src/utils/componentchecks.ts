import type { Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags } from 'detritus-client/lib/constants';
import { Markup, ComponentContext } from 'detritus-client/lib/utils';

import { acknowledgeUserWarnings } from '../api';
import type { GuildSettings } from '../api/structures/guildsettings';
import type { ServerSettings } from '../api/structures/serversettings';
import type { UserFull } from '../api/structures/user';
import { GuildRuleActions } from '../constants';
import GuildSettingsStore from '../stores/guildsettings';
import ServerSettingsStore from '../stores/serversettings';
import UserStore from '../stores/users';

// a cycle (the formatter imports utils), only read at runtime
import { displayBlockedUntil } from './formatter/commands/owner.block.user';
import { createUserWarningsNotice } from './formatter/commands/owner.warn';
import { describeGuildRule, getCommandCategory, resolveGuildRule } from './guildrules';
import { Translator, getCachedTranslator } from './i18n';


// What a command's checks (`onCommandCheck` in interactioncommandclient.ts) say to someone NotSoBot blocked, or in a
// server it blocked. The buttons below say the same

export function blockedUserMessage(translate: Translator['translate'], user: UserFull): string {
  let message = translate('blocked.user');
  if (user.blockedReason) {
    message = `${message} (${translate('logger.reason')}: \`${user.blockedReason}\`)`;
  }
  return message + displayBlockedUntil(translate, user.blockedUntil);
}

export function blockedGuildMessage(translate: Translator['translate'], settings: GuildSettings): string {
  let message = translate('blocked.server');
  if (settings.blockedReason) {
    message = `${message} (${translate('logger.reason')}: \`${Markup.codestring(settings.blockedReason)}\`)`;
  }
  return message + displayBlockedUntil(translate, settings.blockedUntil);
}

export function blockedServerMessage(translate: Translator['translate'], settings: ServerSettings): string {
  let message = translate('blocked.server');
  if (settings.blockedReason) {
    message = `${message} (${translate('logger.reason')}: \`${Markup.codestring(settings.blockedReason)}\`)`;
  }
  return message;
}


// the server's own rule (ACCESS) against `commandId` for whoever pressed, in the channel the button is in
function blockingRule(context: ComponentContext | Interaction.InteractionContext, settings: GuildSettings, commandId: string) {
  const member = context.member || null;
  const match = resolveGuildRule(settings, GuildRuleActions.ACCESS, {
    category: getCommandCategory(context.client.commandClient, commandId),
    channel: context.channel || null,
    channelId: context.channelId || null,
    commandId,
    // the owner and admins skip the rules the server lets them
    isAdmin: !!member && (member.isOwner || member.canAdministrator),
    member,
    userId: context.userId,
  });
  return (match && !match.rule.allows) ? match.rule : null;
}


export interface ComponentAccess {
  // NotSoBot blocked them or the server: what to tell them (privately), the button does nothing
  blocked: string | null,
  // one of the server's rules keeps `commandId` from them here: what a command blocked the same way says
  rule: string | null,
  // warnings from NotSoBot staff they haven't seen: shown in place of what the button does, like a command's
  // (`onCommandCheck`), then marked seen (`answerWarningsPending`)
  warnings: {content: string, warningIds: Array<string>} | null,
}

/**
 * A button that does what a command does (launching the activity, the in-chat Flag Guesser's): the checks every command
 * goes through before it runs, which a press skipped. Only from what's in memory, never the api: a launch has to be the
 * press's first answer within discord's 3 seconds. Someone whose block isn't known here is let through, the api turns
 * them away when the activity signs in. `commandId`: the command the button belongs to, what the server's rules name
 */
export function checkComponentAccess(context: ComponentContext, commandId: string): ComponentAccess {
  const access: ComponentAccess = {blocked: null, rule: null, warnings: null};
  if (context.user.isClientOwner) {
    return access;
  }
  const { translate } = getCachedTranslator(context);
  const user = UserStore.get(context.userId);
  if (user && user.isBlocked) {
    access.blocked = blockedUserMessage(translate, user);
    return access;
  }
  if (user && user.warningsPending.length) {
    access.warnings = createUserWarningsNotice(translate, user.warningsPending);
  }
  if (!context.guildId) {
    // a group dm counts as a server (its settings are by the channel)
    const channel = context.channel;
    const settings = (channel && channel.ownerId && context.channelId) ? ServerSettingsStore.get(context.channelId) : null;
    if (settings && settings.blocked) {
      access.blocked = blockedServerMessage(translate, settings);
    }
    return access;
  }
  // what's cached, or the last copy known while the api is failing
  const settings = GuildSettingsStore.getForUpdate(context.guildId);
  if (!settings) {
    return access;
  }
  if (settings.isBlocked) {
    access.blocked = blockedGuildMessage(translate, settings);
    return access;
  }
  const rule = blockingRule(context, settings, commandId);
  if (rule) {
    access.rule = rule.value.message || translate('rules.blocked', {rule: describeGuildRule(translate, rule)});
  }
  return access;
}

/**
 * Whether one of the server's rules keeps `commandId` from whoever pressed, asked of the api when the server's settings
 * aren't in memory. For after the press was answered (whether a launch gets its message in the channel), never before.
 * Settings that can't be had count as blocked: nothing is posted on a guess. A command's run too, for a command other
 * than its own (the launch message names `/editor`, whichever command launched)
 */
export async function isComponentRuleBlocked(
  context: ComponentContext | Interaction.InteractionContext,
  commandId: string,
): Promise<boolean> {
  if (!context.guildId || context.user.isClientOwner) {
    return false;
  }
  let settings: GuildSettings | null = null;
  try {
    settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
  } catch {
    return true;
  }
  if (!settings || settings.isBlocked) {
    return true;
  }
  return !!blockingRule(context, settings, commandId);
}


/**
 * The staff warnings `checkComponentAccess` found, as the press's private first answer in place of what the button
 * does (the same notice a command shows, nothing in it waits on the api), then marked seen. Like a command, only once
 * it was shown: a failed answer leaves them for the next press or command
 */
export async function answerWarningsPending(
  context: ComponentContext,
  warnings: NonNullable<ComponentAccess['warnings']>,
): Promise<void> {
  await context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
    allowedMentions: {parse: []},
    content: warnings.content,
    flags: MessageFlags.EPHEMERAL,
  });
  await acknowledgeUserWarnings(context, context.userId, {warningIds: warnings.warningIds}).catch(() => null);
}
