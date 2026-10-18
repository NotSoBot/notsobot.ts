import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import { getGuildTranslator, getTranslator } from '../../i18n';
import { DisplayPayload, Parameters, createTimestampMomentFromGuild, displayReply, formatUserTag } from '../../../utils';

import { checkMember, formatError, formatMember } from './moderation.mute';


export interface CommandArgsBefore {
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayloadMembersOnly,
}

export const COMMAND_ID = 'moderation.unmute';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const { payload } = args;

  // same block as kick/ban: in the server's language since the whole server sees it, and the reason goes last since it can be
  // multiple lines (discord caps audit log reasons at 512 characters, so only the end of a long reason gets cut off)
  const audit = await getGuildTranslator(context);
  const reason = [
    audit.translate('moderation_unmute.admin', {user: formatUserTag(context.user), user2: context.user.id}),
    audit.translate('moderation_unmute.timestamp', {timestamp: createTimestampMomentFromGuild(Date.now(), context.guildId).format(DateMomentLogFormat)}),
    audit.translate('moderation_unmute.reason', {text: payload.text || audit.translate('moderation.unspecified_reason')}),
  ].join('\n').slice(0, 512);

  const unmuted: Array<Structures.Member> = [];
  const unable: Array<string> = [];
  for (let member of payload.membersOrUsers) {
    if (!member.communicationDisabledUntilUnix || member.communicationDisabledUntilUnix <= Date.now()) {
      unable.push(`-> ${formatMember(member)}: ${translate('moderation_unmute.reason_not_muted')}`);
      continue;
    }
    const failure = checkMember(context, member);
    if (failure) {
      unable.push(`-> ${formatMember(member)}: ${translate(`moderation_mute.reason_${failure}` as const)}`);
      continue;
    }
    try {
      await member.edit({communicationDisabledUntil: null, reason});
      unmuted.push(member);
    } catch(error) {
      unable.push(`-> ${formatMember(member)}: ${translate('moderation_mute.reason_failed')} ${formatError(error)}`);
    }
  }

  const description: Array<string> = [];
  if (unmuted.length) {
    description.push(translate('moderation_unmute.unmuted'));
    for (let member of unmuted) {
      description.push(`-> ${formatMember(member)}`);
    }
    description.push('');
  }
  if (unable.length) {
    description.push(translate('moderation_unmute.unable'));
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
