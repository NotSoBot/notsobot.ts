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
  editOrReply,
} from '../..';



export const RESULTS_PER_PAGE = 28;


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { count, tags } = await fetchTagsServer(context, context.guildId || context.channelId!);

  const pages = chunkArray<RestResponsesRaw.Tag>(tags, RESULTS_PER_PAGE);
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        let footer = `Server Tags`;
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
                const { user } = tag;
                description.push(`**->** Made by <@${user.id}>`);
              }
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

  return editOrReply(context, 'This server has no tags');
}
