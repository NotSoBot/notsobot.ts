import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { putGuildWarnings } from '../../../api';
import { getApiError } from '../../../api/errors';
import GuildLoggingStore from '../../../stores/guildlogging';
import { ApiErrorCodes, DateMomentLogFormat, EmbedColors, MAX_GUILD_WARNING_REASON_LENGTH, MAX_GUILD_WARNING_USERS, StatusEmojis } from '../../../constants';
import { Translator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import { DisplayPayload, Parameters, createTimestampMomentFromGuild, displayDetailsLine, displayReply, formatDuration, formatUserTag } from '../../../utils';

import { GuildLoggingCustomEvents } from '../loggers';

import { formatMember } from './moderation.mute';


export const COMMAND_ID = 'moderation.warn';

export interface CommandArgsBefore {
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayloadMembersOnly,
}

export type MemberCheckFailure = 'bot' | 'self' | 'your_role';

// why this member can't be warned (or null if they can), a warning isn't a discord action so only the moderator's role matters
export function checkMember(
  context: Command.Context | Interaction.InteractionContext,
  member: Structures.Member,
): MemberCheckFailure | null {
  if ((context.me && context.me.id === member.id) || context.userId === member.id) {
    return 'self';
  }
  if (member.bot) {
    return 'bot';
  }
  if (!context.member || !context.member.canEdit(member)) {
    return 'your_role';
  }
  return null;
}

// "Active: 2 • Total: 5", for a member's warnings
export function formatCounts(translator: Translator, counts: {active: number, total: number}): string {
  return displayDetailsLine([
    translator.translate('moderation_warnings.active', {count: counts.active.toLocaleString(translator.language)}),
    translator.translate('moderation_warnings.total', {count: counts.total.toLocaleString(translator.language)}),
  ]);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  const { payload } = args;
  if (payload.overLimit) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_warn.too_many_users', {max: MAX_GUILD_WARNING_USERS.toLocaleString(language)})}`});
  }

  const reason = payload.text.slice(0, MAX_GUILD_WARNING_REASON_LENGTH);

  const warnable: Array<Structures.Member> = [];
  const unable: Array<string> = [];
  for (let member of payload.membersOrUsers) {
    const failure = checkMember(context, member);
    if (failure) {
      const key = (failure === 'bot') ? 'moderation_warn.reason_bot' : `moderation_mute.reason_${failure}` as const;
      unable.push(`-> ${formatMember(member)}: ${translate(key)}`);
    } else {
      warnable.push(member);
    }
  }

  let counts: Record<string, {active: number, total: number}> = {};
  let window = 0;
  if (warnable.length) {
    try {
      const response = await putGuildWarnings(context, context.guildId!, {
        moderatorId: context.userId,
        reason: reason || null,
        userIds: warnable.map((member) => member.id),
      });
      counts = response.counts;
      window = response.window;
      for (let warning of response.warnings) {
        const member = warnable.find((member) => member.id === warning.user_id);
        if (member) {
          GuildLoggingStore.logModeration(context.client, {
            guildId: context.guildId!,
            happened: Date.now(),
            name: GuildLoggingCustomEvents.GUILD_WARNING_ADD,
            payload: {counts: counts[member.id] || {active: 1, total: 1}, moderator: context.user, user: member.user, warning},
          });
        }
      }
    } catch(error) {
      const information = await getApiError(error);
      if (information && information.code === ApiErrorCodes.MAX_GUILD_WARNINGS) {
        const full = (information.user_ids || []) as Array<string>;
        const members = warnable.filter((member) => full.includes(member.id));
        return displayReply(context, {
          description: [
            `${StatusEmojis.WARNING} ${translate('moderation_warn.max_warnings', {limit: String(information.limit)})}`,
            ...members.map((member) => `-> ${formatMember(member)}`),
          ].join('\n'),
        });
      }
      throw error;
    }
  }

  // same block as mute/kick/ban, in the member's language (or the server's), the reason goes last since it can be long
  const createDetails = (translator: Translator): string => {
    return [
      translator.translate('moderation_mute.moderator', {user: formatUserTag(context.user), user2: context.user.id}),
      translator.translate('moderation_mute.date', {timestamp: createTimestampMomentFromGuild(Date.now(), context.guildId).format(DateMomentLogFormat)}),
      translator.translate('moderation_mute.reason', {text: reason || translator.translate('moderation.unspecified_reason')}),
    ].join('\n');
  };
  const guild = context.guild;
  if (guild) {
    const audit = await getGuildTranslator(context);
    const details = createDetails(audit);
    for (let member of warnable) {
      try {
        const dm = await getTranslatorForUser(context, member.id);
        await member.createMessage([
          dm.translate('moderation_warn.you_have_been_warned_in', {guild: guild.id, name: Markup.escape.all(guild.name)}),
          '',
          dm.translate('moderation_mute.details', {reason: Markup.codeblock((dm.language === audit.language) ? details : createDetails(dm))}),
          formatCounts(dm, counts[member.id] || {active: 1, total: 1}),
        ].join('\n'));
      } catch(error) {
        // they have dms closed
      }
    }
  }

  const description: Array<string> = [];
  if (warnable.length) {
    description.push(translate('moderation_warn.warned'));
    for (let member of warnable) {
      description.push(`-> ${formatMember(member)} • ${formatCounts(translator, counts[member.id] || {active: 1, total: 1})}`);
    }
    if (reason) {
      description.push(translate('moderation_mute.reason', {text: Markup.escape.all(reason)}));
    }
    description.push(displayDetailsLine([translate('moderation_warnings.window', {duration: formatDuration(window * 1000, language)})], true));
    description.push('');
  }
  if (unable.length) {
    description.push(translate('moderation_warn.unable'));
    description.push(...unable);
    description.push('');
  }
  if (payload.notFound.length) {
    description.push(translate('moderation_mute.not_found'));
    description.push(`-> ${payload.notFound.map((text) => Markup.escape.all(text)).join(', ')}`);
  }

  const display: DisplayPayload = {
    color: EmbedColors.DEFAULT,
    description: description.join('\n').trim(),
  };
  return displayReply(context, display);
}
