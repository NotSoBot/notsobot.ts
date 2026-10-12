import { Command, Interaction, Structures } from 'detritus-client';
import { ChannelTypes, InteractionCallbackTypes, MessageComponentButtonStyles, MessageFlags, Permissions } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { deleteTagsServer } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
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
  const { language, translate, translateMaybe } = await getTranslator(context);
  if (args.user && args.user.bot) {
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag_remove_all.bots_do_not_have_tags')}`);
  }

  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const serverId = context.guildId || context.channelId!;

  if (!args.user || (args.user && args.user.id !== context.userId)) {
    let hasPermissionsToForceRemove = context.user.isClientOwner;
    if (!hasPermissionsToForceRemove) {
      if (context.member && context.member.canAdministrator) {//(context.member.canManageGuild || context.member.canBanMembers))
        hasPermissionsToForceRemove = true;
      } else if (context.inDm && context.channel && context.channel.ownerId === context.userId) {
        // most likely a group dm, check to see if is owner of it
        hasPermissionsToForceRemove = true;
      }
    }

    if (!hasPermissionsToForceRemove) {
      if (args.user) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag_remove_all.not_enough_permissions_to_force_remove_other')}`);
      }
      args.user = context.user;
    }
  }

  let filterText: string;
  if (args.user) {
    filterText = translate('tag_remove_all.out_of_s_tags', {user: createUserString(args.user.id, args.user)});
  } else {
    filterText = translate('tag_remove_all.out_of_all_of_this_server_s');
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
              content: translate('tag_remove_all.canceled_removing_of_tags_due_to_timeout', {filterText: filterText, tags_count: tags.length.toLocaleString(language)}),
            });
          } catch(e) {

          }
        }
      },
    });

    components.createButton({
      label: translate('tag_remove_all.continue'),
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        const { count } = await deleteTagsServer(context, serverId, fetchTagsServerSearchOptions);
        await ctx.editOrRespond({
          content: translate('tag_remove_all.ok_successfully_removed_tags', {count: count.toLocaleString(language), filterText: filterText}),
          components: [],
        });
      },
    });

    components.createButton({
      label: translate('tag_remove_all.cancel'),
      style: MessageComponentButtonStyles.DANGER,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        await ctx.editOrRespond({
          content: translate('tag_remove_all.ok_canceled_removing_of_tags', {filterText: filterText, tags_count: tags.length.toLocaleString(language)}),
          components: [],
        });
      },
    });

    let exportedTagsFile: {filename: string, value: string} | undefined;
    components.createButton({
      label: translate('tag_remove_all.export'),
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
          content: translate('tag_remove_all.successfully_exported_tags', {filterText: filterText, tags_count: tags.length.toLocaleString(language)}),
          file: exportedTagsFile,
          flags,
        });
      },
    });

    const response = await editOrReply(context, {
      content: translate('tag_remove_all.found_tags_to_delete', {filterText: filterText, tags_count: tags.length.toLocaleString(language)}),
      components,
    });
  } else if (args.content || args.name || args.user) {
    return editOrReply(context, translate('tag_remove_all.this_server_has_no_tags_matching_the'));
  } else {
    return editOrReply(context, translate('tag_remove_all.this_server_has_no_tags'));
  }
}
