import { Command, Interaction, Structures } from 'detritus-client';
import { ChannelTypes, InteractionCallbackTypes, MessageComponentButtonStyles, MessageFlags, Permissions } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { deleteTagsServer, fetchTagsExport } from '../../../api';
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
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_remove_all.bots_do_not_have_tags')}`});
  }

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
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_remove_all.not_enough_permissions_to_force_remove_other')}`});
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
        try {
          // edits the response for both prefixed commands and interactions
          await displayReply(context, {
            description: translate('tag_remove_all.canceled_removing_of_tags_due_to_timeout', {filterText: filterText, tags_count: tags.length.toLocaleString(language)}),
          });
        } catch(e) {

        }
      },
    });

    components.createButton({
      label: translate('tag_remove_all.continue'),
      style: MessageComponentButtonStyles.DANGER,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        const { count } = await deleteTagsServer(context, serverId, fetchTagsServerSearchOptions);
        await displayReply(context, {
          description: translate('tag_remove_all.ok_successfully_removed_tags', {count: count.toLocaleString(language), filterText: filterText}),
        }, {replyTo: ctx});
      },
    });

    components.createButton({
      label: translate('tag_remove_all.cancel'),
      style: MessageComponentButtonStyles.SECONDARY,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }

        await displayReply(context, {
          description: translate('tag_remove_all.ok_canceled_removing_of_tags', {filterText: filterText, tags_count: tags.length.toLocaleString(language)}),
        }, {replyTo: ctx});
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

        const content = translate('tag_remove_all.successfully_exported_tags', {filterText: filterText, tags_count: tags.length.toLocaleString(language)});
        if (exportedTagsFile) {
          return ctx.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {content, file: exportedTagsFile, flags: MessageFlags.EPHEMERAL});
        }

        // the api builds and signs the export (so it can be imported later), that can take longer than discord waits
        // ephemeral like the cached reply above, the first press used to post every user's tags in the channel
        await ctx.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
        const response = await fetchTagsExport(context, serverId, fetchTagsServerSearchOptions);
        exportedTagsFile = {filename: response.filename, value: JSON.stringify(response.export)};
        return ctx.editOrRespond({content, file: exportedTagsFile, flags: MessageFlags.EPHEMERAL});
      },
    });

    return displayReply(context, {
      components,
      description: translate('tag_remove_all.found_tags_to_delete', {filterText: filterText, tags_count: tags.length.toLocaleString(language)}),
    });
  } else if (args.content || args.name || args.user) {
    return displayReply(context, {description: translate('tag_remove_all.this_server_has_no_tags_matching_the')});
  } else {
    return displayReply(context, {description: translate('tag_remove_all.this_server_has_no_tags')});
  }
}
