import { Command, Interaction, Structures } from 'detritus-client';
import { ChannelTypes, InteractionCallbackTypes, MessageComponentButtonStyles, MessageFlags, Permissions } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { deleteTagsServer } from '../../../api';
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

import { exportTags } from './tag.export';
import { fetchTagsServerSearch, FetchTagsServerSearch } from './tag.list.server';


export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export const COMMAND_ID = 'tag.remove.all';


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
        return editOrReply(context, '⚠ Not enough permissions to force remove other people\'s tags!');
      }
    }
  }

  let filterText: string;
  if (args.user) {
    filterText = `(Out of ${createUserString(args.user.id, args.user)}'s tags)`;
  } else {
    filterText = '(Out of all of this server\'s tags)';
  }

  const fetchTagsServerSearchOptions = {
    content: args.content,
    name: args.name,
    userId: (args.user) ? args.user.id : undefined,
  };

  const tags = await fetchTagsServerSearch(context, serverId, fetchTagsServerSearchOptions);
  if (tags.length) {
    const components = new Components({
      timeout: MAX_TIME_TO_RESPOND,
      onTimeout: async () => {
        const message = response || context.response;
        if (message) {
          try {
            await message.edit({
              components: [],
              content: `Canceled removing of ${tags.length.toLocaleString()} tags due to timeout. ${filterText}`,
            });
          } catch(e) {

          }
        }
      },
    });

    components.createButton({
      label: 'Continue',
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        const { count } = await deleteTagsServer(context, serverId, fetchTagsServerSearchOptions);
        await ctx.editOrRespond({
          content: `Ok, successfully removed ${count.toLocaleString()} tags. ${filterText}`,
          components: [],
        });
      },
    });

    components.createButton({
      label: 'Cancel',
      style: MessageComponentButtonStyles.DANGER,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        await ctx.editOrRespond({
          content: `Ok, canceled removing of ${tags.length.toLocaleString()} tags. ${filterText}`,
          components: [],
        });
      },
    });

    let exportedTagsFile: {filename: string, value: string} | undefined;
    components.createButton({
      label: 'Export',
      style: MessageComponentButtonStyles.SECONDARY,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        let flags = 0;
        if (exportedTagsFile) {
          flags = MessageFlags.EPHEMERAL;
        } else {
          exportedTagsFile = exportTags(serverId, tags, fetchTagsServerSearchOptions);
        }
        return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
          content: `Successfully exported ${tags.length.toLocaleString()} tags. ${filterText}`,
          file: exportedTagsFile,
          flags,
        });
      },
    });

    const response = await editOrReply(context, {
      content: `Found ${tags.length.toLocaleString()} tags to delete. ${filterText}`,
      components,
    });
  } else if (args.content || args.name || args.user) {
    return editOrReply(context, 'This server has no tags matching the search options.');
  } else {
    return editOrReply(context, 'This server has no tags.');
  }
}
