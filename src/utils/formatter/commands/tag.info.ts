import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

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

  embed.setDescription(Markup.codeblock(tag.content));

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

    // look through cache, else use the tag object
    description.push(`**Global**: ${(tag.global) ? 'Yes' : 'No'}`);
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
