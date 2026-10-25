import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors, StatusEmojis } from '../../../constants';
import { Translator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import { DisplayPayload, DisplayReplyOptions, Parameters, createTimestampMomentFromGuild, displayReply, formatDuration, formatUserTag } from '../../../utils';


// discord's limit for timeouts
export const MAX_DURATION = 28 * 24 * 60 * 60;
export const DEFAULT_DURATION = 60 * 60;

export interface CommandArgsBefore {
  duration?: number,
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  duration?: number,
  payload: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_ID = 'moderation.mute';

export type MemberCheckFailure = 'admin' | 'bot_role' | 'self' | 'your_role';

// shared with `unmute`, why we can't change this member's timeout (or null if we can)
export function checkMember(
  context: Command.Context | Interaction.InteractionContext,
  member: Structures.Member,
): MemberCheckFailure | null {
  if ((context.me && context.me.id === member.id) || context.userId === member.id) {
    return 'self';
  }
  // discord doesn't let anyone time out an administrator (or the owner)
  if (member.isOwner || member.canAdministrator) {
    return 'admin';
  }
  if (!context.me || !context.me.canEdit(member)) {
    return 'bot_role';
  }
  if (!context.member || !context.member.canEdit(member)) {
    return 'your_role';
  }
  return null;
}

export function formatMember(member: Structures.Member): string {
  return `${member.mention} ${Markup.spoiler(`(${member})`)}`;
}

export function formatError(error: any): string {
  return Markup.codestring(String((error && error.message) || error).slice(0, 100));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  // like a modal from the buttons under a warning, to respond through instead of editing the command's reply
  options: DisplayReplyOptions = {},
) {
  const { translate } = await getTranslator(context);
  const { payload } = args;

  const duration = (args.duration === undefined) ? DEFAULT_DURATION : args.duration;
  if (!duration || duration < 1 || MAX_DURATION < duration) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_mute.invalid_duration')}`}, options);
  }

  const until = new Date(Date.now() + duration * 1000);
  const timestamp = `<t:${Math.floor(until.getTime() / 1000)}:F> (<t:${Math.floor(until.getTime() / 1000)}:R>)`;
  // same block as kick/ban, built in a given language: the server's for the audit log (the whole server sees it), the member's
  // for their dm. the reason goes last since it can be multiple lines (discord caps audit log reasons at 512 characters, so
  // only the end of a long reason gets cut off)
  const createReason = (translator: Translator): string => {
    return [
      translator.translate('moderation_mute.moderator', {user: formatUserTag(context.user), user2: context.user.id}),
      translator.translate('moderation_mute.date', {timestamp: createTimestampMomentFromGuild(Date.now(), context.guildId).format(DateMomentLogFormat)}),
      translator.translate('moderation_mute.duration', {
        duration: formatDuration(duration * 1000, translator.language),
        until: createTimestampMomentFromGuild(until.getTime(), context.guildId).format(DateMomentLogFormat),
      }),
      translator.translate('moderation_mute.reason', {text: payload.text || translator.translate('moderation.unspecified_reason')}),
    ].join('\n').slice(0, 512);
  };
  const audit = await getGuildTranslator(context);
  const reason = createReason(audit);

  const muted: Array<Structures.Member> = [];
  const unable: Array<string> = [];
  for (let member of payload.membersOrUsers) {
    const failure = checkMember(context, member);
    if (failure) {
      unable.push(`-> ${formatMember(member)}: ${translate(`moderation_mute.reason_${failure}` as const)}`);
      continue;
    }
    // one failure (rate limit, 5xx, missing permissions) shouldn't stop the rest or the summary
    try {
      await member.edit({communicationDisabledUntil: until, reason});
      muted.push(member);
    } catch(error) {
      unable.push(`-> ${formatMember(member)}: ${translate('moderation_mute.reason_failed')} ${formatError(error)}`);
      continue;
    }
    if (context.guild) {
      try {
        // in their language (or the server's), not the moderator's
        const dm = await getTranslatorForUser(context, member.id);
        const dmReason = (dm.language === audit.language) ? reason : createReason(dm);
        await member.createMessage([
          dm.translate('moderation_mute.you_have_been_muted_in', {guild: context.guild.id, name: Markup.escape.all(context.guild.name), timestamp}),
          '',
          dm.translate('moderation_mute.details', {reason: Markup.codeblock(dmReason)}),
        ].join('\n'));
      } catch(error) {
        // they have dms closed
      }
    }
  }

  const description: Array<string> = [];
  if (muted.length) {
    description.push(translate('moderation_mute.muted_until', {timestamp}));
    for (let member of muted) {
      description.push(`-> ${formatMember(member)}`);
    }
    description.push('');
  }
  if (unable.length) {
    description.push(translate('moderation_mute.unable'));
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
  return displayReply(context, display, options);
}
