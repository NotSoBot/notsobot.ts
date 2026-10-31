import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildWarnings } from '../../../api';
import { EmbedColors, MAX_GUILD_WARNING_USERS, StatusEmojis } from '../../../constants';
import GuildLoggingListener from '../../../listeners/guildlogging';
import { getTranslator } from '../../i18n';
import { Parameters, displayReply } from '../../../utils';

import { GuildLoggingCustomEvents } from '../loggers';

import { formatMember } from './moderation.mute';


export const COMMAND_ID = 'moderation.warnings.clear';

export interface CommandArgsBefore {
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayload,
}

// every warning the users have here, members that left included
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const { payload } = args;
  if (payload.overLimit) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_warn.too_many_users', {max: MAX_GUILD_WARNING_USERS.toLocaleString(language)})}`});
  }

  const description: Array<string> = [];
  if (payload.membersOrUsers.length) {
    const { deleted } = await deleteGuildWarnings(context, context.guildId!, {
      userIds: payload.membersOrUsers.map((memberOrUser) => memberOrUser.id),
    });
    description.push(translate('moderation_warnings_clear.cleared'));
    for (let memberOrUser of payload.membersOrUsers) {
      const text = (memberOrUser instanceof Structures.Member) ? formatMember(memberOrUser) : `${memberOrUser.mention} ${Markup.spoiler(`(${memberOrUser})`)}`;
      const count = deleted[memberOrUser.id] || 0;
      if (count) {
        GuildLoggingListener.logModeration(context.client, {
          guildId: context.guildId!,
          happened: Date.now(),
          name: GuildLoggingCustomEvents.GUILD_WARNINGS_CLEAR,
          payload: {count, moderator: context.user, user: (memberOrUser instanceof Structures.Member) ? memberOrUser.user : memberOrUser},
        });
      }
      description.push(`-> ${text} • ${translate('moderation_warnings_clear.removed', {count: count.toLocaleString(language)})}`);
    }
    description.push('');
  }
  if (payload.notFound.length) {
    description.push(translate('moderation_mute.not_found'));
    description.push(`-> ${payload.notFound.map((text) => Markup.escape.all(text)).join(', ')}`);
  }
  return displayReply(context, {color: EmbedColors.DEFAULT, description: description.join('\n').trim()});
}
