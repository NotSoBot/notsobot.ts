import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, Permissions } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup } from 'detritus-client/lib/utils';

import { deleteTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { BooleanEmojis, DateMomentLogFormat, EmbedColors } from '../../../constants';
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
        return editOrReply(context, `${BooleanEmojis.WARNING} Not enough permissions to force remove this tag!`);
      }
    } else {
      if (!hasPermissionsToForceRemove) {
        return editOrReply(context, `${BooleanEmojis.WARNING} You\'re not the owner of this tag!`);
      }

      const embed = createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);
      embed.setTitle(`Force Remove Tag?`);
      embed.setDescription(`Tag: ${Markup.codestring(tag.name)}`);

      {
        const description: Array<string> = [];

        {
          const timestamp = createTimestampMomentFromGuild(tag.created, context.guildId);
          description.push(`**Created**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }
        if (tag.edited) {
          const timestamp = createTimestampMomentFromGuild(tag.edited, context.guildId);
          description.push(`**Edited**: ${timestamp.fromNow()}`);
          description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
        }

        description.push(`**NSFW**: ${(tag.nsfw) ? 'Yes' : 'No'}`);

        {
          const owner = await fetchMemberOrUserById(context, tag.user.id);
          description.push(`**Owner**: ${createUserString(tag.user.id, owner, 'Deleted User?')}`);
        }

        description.push(`**Uses**: ${tag.uses.toLocaleString()}`);

        embed.addField('Information', description.join('\n'));
      }

      const components = new Components({timeout: 5 * (60 * 1000)});
      components.createButton({
        label: 'Continue',
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          await deleteTag(context, {name: tag.name, serverId: context.guildId || context.channelId});
          embed.setColor(EmbedColors.LOG_CREATION);
          embed.setTitle('Successfully Force Removed Tag');
          await ctx.editOrRespond({components: [], embed});
        },
      });

      components.createButton({
        label: 'Cancel',
        style: MessageComponentButtonStyles.DANGER,
        run: async (ctx: ComponentContext) => {
          if (ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }

          embed.setColor(EmbedColors.ERROR);
          embed.setTitle('Cancelled Force Removal of Tag');
          await ctx.editOrRespond({components: [], embed});
        },
      });

      const message = await editOrReply(context, {components, embed});
      components.onTimeout = async () => {
        try {
          embed.setColor(EmbedColors.ERROR);
          embed.setFooter('Request expired, press a button next time');
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
  return editOrReply(context, `Removed tag ${tag.name}`);
}
