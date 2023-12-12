import { Command, Interaction, Structures } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { fetchGuildTagsCommands, fetchUserTagsCommands } from '../../../api';
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


export const COMMAND_ID = 'tag.commands.list';

export const RESULTS_PER_PAGE = 28;


export interface CommandArgs {
  showMeOnly?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const showMeOnly = context.inDm || args.showMeOnly;

  const serverId = (showMeOnly) ? context.userId : context.guildId!;
  const fetchTags = (showMeOnly) ? fetchUserTagsCommands : fetchGuildTagsCommands;

  const { count, tags } = await fetchTags(context, serverId);

  const pages = chunkArray<RestResponsesRaw.Tag>(tags, RESULTS_PER_PAGE);
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        {
          const description: Array<string> = [];
          if (showMeOnly) {
            description.push('Showing your Global Custom Commands');
          } else {
            description.push('Showing this Server\'s Custom Commands');
          }
          embed.setDescription(description.join('\n'));
        }

        let footer = (showMeOnly) ? 'Global Custom Commands' : 'Server Custom Commands'
        if (pageLimit !== 1) {
          footer = `Page ${pageNumber}/${pageLimit} of ${footer}`;
        }
        embed.setFooter(`${footer} (${count.toLocaleString()} Total Tags)`);

        const page = pages[pageNumber - 1];

        {
          for (let i = 0; i < page.length; i += RESULTS_PER_PAGE / 2) {
            const description: Array<string> = [];

            const section = page.slice(i, i + RESULTS_PER_PAGE / 2);
            for (let x = 0; x < section.length; x++) {
              const tag = section[x];
              description.push(`**${(i + x + 1) + ((pageNumber - 1) * RESULTS_PER_PAGE)}**. ${Markup.escape.all(tag.name)}`);

              /*
              {
                const timestamp = createTimestampMomentFromGuild(tag.edited || tag.created, context.guildId);
                description.push(`**->** ${(tag.edited) ? 'Edited' : 'Created'} ${timestamp.fromNow()}`);
              }
              */
            }

            embed.addField('\u200b', description.join('\n'), true);
          }
        }

        return embed;
      },
    });
    return await paginator.start();
  }

  const text = (showMeOnly) ? 'You don\t have any Global Custom Commands' : 'This Server has no Custom Commands';
  return editOrReply(context, text);
}
