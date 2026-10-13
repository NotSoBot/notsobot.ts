import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, Permissions } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { deleteTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { DateMomentLogFormat, EmbedColors, StatusEmojis } from '../../../constants';
import {
  DisplayPayload,
  createTimestampMomentFromGuild,
  createUserString,
  displayReply,
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
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_remove.not_enough_permissions_to_force_remove_this')}`});
      }
    } else {
      if (!hasPermissionsToForceRemove) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_remove.you_re_not_the_owner_of_this')}`});
      }

      const payload: DisplayPayload = {fields: []};
      payload.color = EmbedColors.DEFAULT;
      payload.title = translate('tag_remove.force_remove_tag');
      payload.description = translate('tag_remove.tag', {name: Markup.codestring(tag.name)});

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

        payload.fields!.push({name: translate('tag_remove.information'), value: description.join('\n')});
      }

      const components = new Components({timeout: 5 * (60 * 1000)});
      components.createButton({
        label: translate('tag_remove.continue'),
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          await deleteTag(context, {name: tag.name, serverId: context.guildId || context.channelId});
          payload.color = EmbedColors.LOG_CREATION;
          payload.title = translate('tag_remove.successfully_force_removed_tag');
          await displayReply(context, payload, {replyTo: ctx});
        },
      });

      components.createButton({
        label: translate('tag_remove.cancel'),
        style: MessageComponentButtonStyles.DANGER,
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          payload.color = EmbedColors.ERROR;
          payload.title = translate('tag_remove.cancelled_force_removal_of_tag');
          await displayReply(context, payload, {replyTo: ctx});
        },
      });

      const message = await displayReply(context, {...payload, components});
      components.onTimeout = async () => {
        try {
          payload.color = EmbedColors.ERROR;
          payload.footer = translate('tag_remove.request_expired_press_a_button_next_time');
          // edits the response for both prefixed commands and interactions
          await displayReply(context, payload);
        } catch(error) {

        }
      };
      return message;
    }
  }

  await deleteTag(context, {name: tag.name, serverId: context.guildId || context.channelId});
  return displayReply(context, {description: translate('tag_remove.removed_tag', {name: tag.name})});
}
