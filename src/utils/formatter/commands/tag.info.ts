import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import UserStore from '../../../stores/users';

import { RestResponsesRaw } from '../../../api/types';
import { DateMomentLogFormat, EmbedColors } from '../../../constants';
import {
  createTimestampMomentFromGuild,
  createUserEmbed,
  createUserString,
  editOrReply,
  fetchMemberOrUserById,
} from '../../../utils';


export const COMMAND_ID = 'tag.info';

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const { tag } = args;

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setTitle(tag.name);

  if (tag.reference_tag) {
    if (tag.reference_tag.is_on_directory) {
      // embed.setDescription(`Using a tag from the tag directory. https://notsobot.com/directories/tags/${tag.reference_tag.id}`);
      embed.setDescription([
        `Using tag ${Markup.codestring(tag.reference_tag.id)} from the tag directory.`,
        `-> Name: ${Markup.codestring(tag.reference_tag.name)}`,
      ].join('\n'));
    } else {
      let message = `Alias of tag ${Markup.codestring(tag.reference_tag.name)}`;

      const user = await UserStore.getOrFetch(context, tag.reference_tag.user.id);
      if (user && user.channelId === tag.reference_tag.server_id) {
        const owner = await fetchMemberOrUserById(context, tag.reference_tag.user.id);
        message = `${message} from ${createUserString(tag.reference_tag.user.id, owner, 'Deleted User?')}'s DMs`;
      }

      embed.setDescription(message);
    }
  } else {
    embed.setDescription(Markup.codeblock(tag.content));
  }

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

    description.push(`**Id**: ${Markup.codestring(tag.id)}`);

    // look through cache, else use the tag object
    description.push(`**NSFW**: ${(tag.nsfw) ? 'Yes' : 'No'}`);

    {
      const owner = await fetchMemberOrUserById(context, tag.user.id);
      description.push(`**Owner**: ${createUserString(tag.user.id, owner, 'Deleted User?')}`);
    }

    description.push(`**Uses**: ${tag.uses.toLocaleString()}`);

    embed.addField('Information', description.join('\n'));
  }

  return editOrReply(context, {embed});
}
