import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTagsServer } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import {
  DefaultParameters,
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserString,
  displayReply,
} from '../../../utils';

import { FetchTagsServerSearch, fetchTagsServerSearch } from './tag.list.server';


export const COMMAND_ID = 'tag.export';


export function exportTags(
  serverId: string,
  tags: Array<RestResponsesRaw.Tag>,
  options: FetchTagsServerSearch = {},
): {filename: string, value: string} {
  let filename: string;
  if (options.content || options.name || options.userId) {
    filename = `tags-exported-${serverId}-${tags.length}-filtered-${Date.now()}.json`;
  } else {
    filename = `tags-exported-${serverId}-${tags.length}.json`;
  }

  return {
    filename,
    value: JSON.stringify({
      options: (Object.values(options).some(Boolean)) ? options : undefined,
      serverId,
      tags: tags.map((tag) => {
        if (tag.reference_tag && tag.reference_tag.server_id) {
          tag.reference_tag.content = '';
        }
        return tag;
      }),
      timestamp: Date.now(),
    }),
  };
}

export interface CommandArgs {
  content?: string,
  name?: string,
  user?: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  if (args.user && args.user.bot) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_export.bots_do_not_have_tags')}`});
  }

  const serverId = context.guildId || context.channelId!;

  if (!args.user || (args.user && args.user.id !== context.userId)) {
    let hasPermissionsToForceRemove = context.user.isClientOwner;
    if (!hasPermissionsToForceRemove) {
      if (context.member && context.member.canManageGuild) {
        hasPermissionsToForceRemove = true;
      } else if (context.inDm && context.channel && context.channel.ownerId === context.userId) {
        // most likely a group dm, check to see if is owner of it
        hasPermissionsToForceRemove = true;
      }
    }

    if (!hasPermissionsToForceRemove) {
      if (!args.user) {
        args.user = context.user;
      } else {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_export.not_enough_permissions_to_export_other_people')}`});
      }
    }
  }

  const fetchTagsServerSearchOptions = {
    content: args.content,
    name: args.name,
    userId: (args.user) ? args.user.id : undefined,
  };

  const tags = await fetchTagsServerSearch(context, serverId, fetchTagsServerSearchOptions);
  if (tags.length) {
    const file = exportTags(serverId, tags, fetchTagsServerSearchOptions);
    return displayReply(context, {description: translate('tag_export.successfully_exported_tags', {tags_count: tags.length.toLocaleString(language)}), files: [file]});
  }

  if (args.content || args.name || args.user) {
    return displayReply(context, {description: translate('tag_export.this_server_has_no_tags_matching_the')});
  }

  return displayReply(context, {description: translate('tag_export.this_server_has_no_tags')});
}
