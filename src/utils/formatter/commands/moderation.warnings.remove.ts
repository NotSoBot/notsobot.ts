import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildWarning } from '../../../api';
import { getApiError } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import { ApiErrorCodes, EmbedColors, StatusEmojis } from '../../../constants';
import GuildLoggingStore from '../../../stores/guildlogging';
import { getTranslator } from '../../i18n';
import { displayReply, isSnowflake } from '../../../utils';

import { GuildLoggingCustomEvents } from '../loggers';

import { formatWarningDetails } from './moderation.warnings';


export const COMMAND_ID = 'moderation.warnings.remove';

// warnings one command can remove
export const MAX_IDS = 10;

export interface CommandArgs {
  // warning ids, separated by spaces
  ids: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const ids = Array.from(new Set((args.ids || '').split(/[\s,]+/).filter((x) => x)));
  if (!ids.length) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_warnings_remove.needs_ids')}`});
  }
  if (MAX_IDS < ids.length) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_warnings_remove.too_many', {max: MAX_IDS.toLocaleString(language)})}`});
  }

  const removed: Array<RestResponsesRaw.GuildWarning> = [];
  const notFound: Array<string> = [];
  for (let id of ids) {
    if (!isSnowflake(id)) {
      notFound.push(id);
      continue;
    }
    try {
      const warning = await deleteGuildWarning(context, context.guildId!, id);
      removed.push(warning);
      GuildLoggingStore.logModeration(context.client, {
        guildId: context.guildId!,
        happened: Date.now(),
        name: GuildLoggingCustomEvents.GUILD_WARNING_REMOVE,
        payload: {moderator: context.user, user: context.client.users.get(warning.user_id) || null, warning},
      });
    } catch(error) {
      const information = await getApiError(error);
      if (information && information.code === ApiErrorCodes.UNKNOWN_GUILD_WARNING) {
        notFound.push(id);
        continue;
      }
      throw error;
    }
  }

  const description: Array<string> = [];
  if (removed.length) {
    description.push(translate('moderation_warnings_remove.removed'));
    // the whole reason, the lists only show its first line
    for (let warning of removed) {
      if (warning.reason) {
        description.push(`-> <@${warning.user_id}>`);
        description.push(Markup.codeblock(warning.reason));
      } else {
        description.push(`-> <@${warning.user_id}> • *${translate('moderation.unspecified_reason')}*`);
      }
      // the window doesn't matter for a removed one
      description.push(formatWarningDetails(translate, warning, Infinity));
    }
    description.push('');
  }
  if (notFound.length) {
    description.push(translate('moderation_mute.not_found'));
    description.push(`-> ${notFound.map((text) => Markup.escape.all(text)).join(', ')}`);
  }
  return displayReply(context, {color: EmbedColors.DEFAULT, description: description.join('\n').trim()});
}
