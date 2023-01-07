import { Command, Interaction, Structures } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { fetchTagsServer } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import {
  DefaultParameters,
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserEmbed,
  createUserString,
  editOrReply,
} from '../../../utils';

import { fetchTagsServerSearch, FetchTagsServerSearch } from './tag.list.server';


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
      tags,
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
  if (args.user && args.user.bot) {
    return editOrReply(context, '⚠ Bots do not have tags.');
  }

  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const serverId = context.guildId || context.channelId!;

  if (!args.user || (args.user && args.user.id !== context.userId)) {
    const hasPermissionsToForceRemove = context.user.isClientOwner || (context.member && context.member.canManageGuild);
    if (!hasPermissionsToForceRemove) {
      if (!args.user) {
        args.user = context.user;
      } else {
        return editOrReply(context, '⚠ Not enough permissions to export other people\'s tags!');
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
    return editOrReply(context, {
      content: `Successfully exported ${tags.length.toLocaleString()} tags.`,
      file,
    });
  }

  if (args.content || args.name || args.user) {
    return editOrReply(context, 'This server has no tags matching the search options.');
  }

  return editOrReply(context, 'This server has no tags.');
}
