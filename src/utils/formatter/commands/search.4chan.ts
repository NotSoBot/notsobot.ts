import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import { search4Chan, search4ChanRandom } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, EmbedBrands, EmbedColors } from '../../../constants';
import { DefaultParameters, Paginator, createUserEmbed, editOrReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.4chan';

export interface CommandArgs {
  closed?: boolean,
  board?: string,
  randomize?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const board = await ((args.board) ? search4Chan(context, {board: args.board}) : search4ChanRandom(context, {nsfw: !DefaultParameters.safe(context)}));
  if (board.threads.length) {
    let threads: Array<RestResponsesRaw.Search4ChanThread> = board.threads;
    if (!args.closed) {
      threads = threads.filter((thread) => !thread.closed);
    }
    if (args.randomize) {
      shuffleArray(threads);
    }

    const filesCached: Record<string, RequestTypes.File | null> = {};

    const pageLimit = threads.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const thread = threads[page - 1];

        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        let footer = `4chan's /${board.board}/`;
        if (pageLimit !== 1) {
          footer = `Page ${page}/${pageLimit} of ${footer}`;
        }
        // icon
        embed.setFooter(footer);

        {
          let title = '';
          if (thread.sticky) {
            title += DiscordEmojis.CHAN.STICKIED + ' ';
          }
          if (thread.closed) {
            title += DiscordEmojis.CHAN.CLOSED + ' ';
          }
          title += Markup.escape.all(thread.title);
          if (title) {
            embed.setTitle(title.trim());
            embed.setUrl(thread.url);
          }
        }

        const files: Array<RequestTypes.File> = [];
        if (thread.media && !thread.media.deleted) {
          let url: string;
          if (thread.media.extension === 'webm') {
            url = thread.media.thumbnail;
          } else {
            url = thread.media.url;
          }

          if (!(url in filesCached)) {
            try {
              const value = await context.rest.get(url);
              const filename = `${thread.created_at}.${thread.media.extension}`;
              filesCached[url] = {filename, value};
            } catch(error) {
              filesCached[url] = null;
            }
          }

          const file = filesCached[url];
          if (file) {
            files.push(file);
            url = `attachment://${file.filename}`;
          }

          embed.setImage(url);
        }

        {
          const description: Array<string> = [];

          {
            let text = `**R**: ${thread.replies.toLocaleString()}`;
            if (thread.images) {
              text = `${text} / **I**: ${thread.images.toLocaleString()}`;
            }
            description.push(text);
          }

          description.push(`**Created At**: ${thread.created_at_text}`);
          if (thread.edited_at) {
            description.push(`**Edited At**: ${thread.edited_at}`);
          }

          {
            let text = `${thread.user.name}`;
            if (thread.user.badge) {
              if (thread.user.id) {
                text = `${text} ## ${thread.user.id}`;
              }

              switch (thread.user.badge) {
                case 'mod': text = `${text} ${DiscordEmojis.CHAN.BADGE_MOD}`; break;
                default: text = `${text} (${thread.user.badge})`;
              }
            } else if (thread.user.id) {
              text = `${text} (ID: ${thread.user.id})`;
            }

            if (thread.user.country) {
              text = `${text} (${thread.user.country.name || thread.user.country.code})`;
            }

            description.push(`${text}:`);
          }

          if (thread.comment) {
            description.push('');
            description.push(Markup.escape.all(thread.comment));
          }
          embed.setDescription(description.join('\n'));
        }

        {
          const description: Array<string> = [];
          description.push(Markup.url('Board', board.url));
          description.push(Markup.url('Thread', thread.url));
          embed.addField('Urls', description.join(', '));
        }

        if (thread.media) {
          const filename = `${thread.media.name}.${thread.media.extension}`;
          embed.addField('Media', Markup.url(filename, thread.media.url));
        }

        return [embed, files];
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, 'Couldn\'t find threads for that board');
}

