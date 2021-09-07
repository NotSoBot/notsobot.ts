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
  createUserString,
  editOrReply,
} from '../../../utils';


export const MAX_FETCHES = 10;
export const RESULTS_PER_PAGE = 28;


export interface CommandArgs {
  query?: string,
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

  let before: string | undefined;
  let count: number = 0;
  let fetched: number = 0;
  const chunks: Array<Array<RestResponsesRaw.Tag>> = [];
  for (let i = 0; i < MAX_FETCHES; i++) {
    const response = await fetchTagsServer(context, serverId, {
      before,
      query: args.query,
      userId: (args.user) ? args.user.id : undefined,
    });

    count = response.count;
    if (response.tags.length) {
      fetched += response.tags.length;
      chunks.push(response.tags);
      before = response.tags[response.tags.length - 1].id;
    } else {
      break;
    }

    if (count <= fetched) {
      break;
    }
  }
  const tags = chunks.flat();

  const pages = chunkArray<RestResponsesRaw.Tag>(tags, RESULTS_PER_PAGE);
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        if (args.query || args.user) {
          const description: Array<string> = [];
          if (args.user) {
            description.push(`Showing tags owned by ${createUserString(args.user.id, args.user)}`);
          }
          if (args.query) {
            description.push(`Filtering for tags containing ${Markup.codestring(args.query)}`);
          }
          embed.setDescription(description.join('\n'));
        }

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
