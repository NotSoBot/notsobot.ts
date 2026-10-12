import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, Permissions } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup } from 'detritus-client/lib/utils';

import { deleteTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { DateMomentLogFormat, EmbedColors, StatusEmojis } from '../../../constants';
import {
  createTimestampMomentFromGuild,
  createUserEmbed,
  createUserString,
  editOrReply,
  fetchMemberOrUserById,
} from '../../../utils';


export const COMMAND_ID = 'tag.remove';

export interface CommandArgsBefore {
  force?: boolean,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  force?: boolean,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { tag } = args;
  if (tag.user.id !== context.userId) {
    let hasPermissionsToForceRemove = context.user.isClientOwner;
    if (!hasPermissionsToForceRemove) {
      if (tag.global) {
        hasPermissionsToForceRemove = false;
      } else if (context.member && (context.member.canManageGuild || context.member.canBanMembers)) {
        hasPermissionsToForceRemove = true;
      } else if (context.inDm && context.channel && context.channel.ownerId === context.userId) {
        // most likely a group dm, check to see if is owner of it
        hasPermissionsToForceRemove = true;
      }
    }

    if (args.force) {
      if (!hasPermissionsToForceRemove) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag_remove.not_enough_permissions_to_force_remove_this')}`);
      }
    } else {
      if (!hasPermissionsToForceRemove) {
        return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag_remove.you_re_not_the_owner_of_this')}`);
      }

      const embed = createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);
      embed.setTitle(translate('tag_remove.force_remove_tag'));
      embed.setDescription(translate('tag_remove.tag', {name: Markup.codestring(tag.name)}));

      {
        const description: Array<string> = [];

        {
          const timestamp = createTimestampMomentFromGuild(tag.created, context.guildId);
          description.push(translate('tag_remove.created', {timestamp: timestamp.locale(language).fromNow()}));
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        if (tag.edited) {
          const timestamp = createTimestampMomentFromGuild(tag.edited, context.guildId);
          description.push(translate('tag_remove.edited', {timestamp: timestamp.locale(language).fromNow()}));
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }

        description.push(translate('tag_remove.nsfw', {nsfw: (tag.nsfw) ? translate('common.yes') : translate('common.no')}));

        {
          const owner = await fetchMemberOrUserById(context, tag.user.id);
          description.push(translate('tag_remove.owner', {user: createUserString(tag.user.id, owner, translate('tag.deleted_user'))}));
        }

        description.push(translate('tag_remove.uses', {uses: tag.uses.toLocaleString(language)}));

        embed.addField(translate('tag_remove.information'), description.join('\n'));
      }

      const components = new Components({timeout: 5 * (60 * 1000)});
      components.createButton({
        label: translate('tag_remove.continue'),
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          await deleteTag(context, {name: tag.name, serverId: context.guildId || context.channelId});
          embed.setColor(EmbedColors.LOG_CREATION);
          embed.setTitle(translate('tag_remove.successfully_force_removed_tag'));
          await ctx.editOrRespond({components: [], embed});
        },
      });

      components.createButton({
        label: translate('tag_remove.cancel'),
        style: MessageComponentButtonStyles.DANGER,
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          embed.setColor(EmbedColors.ERROR);
          embed.setTitle(translate('tag_remove.cancelled_force_removal_of_tag'));
          await ctx.editOrRespond({components: [], embed});
        },
      });

      const message = await editOrReply(context, {components, embed});
      components.onTimeout = async () => {
        try {
          embed.setColor(EmbedColors.ERROR);
          embed.setFooter(translate('tag_remove.request_expired_press_a_button_next_time'));
          if (context instanceof Interaction.InteractionContext) {
            await context.editResponse({components: [], embed});
          } else {
            if (message && message.canEdit) {
              await message.edit({components: [], embed});
            }
          }
        } catch(error) {

        }
      };
      return message;
    }
  }

  await deleteTag(context, {name: tag.name, serverId: context.guildId || context.channelId});
  return editOrReply(context, translate('tag_remove.removed_tag', {name: tag.name}));
}
