import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';

import { moderationSafetyScan, search4Chan, search4ChanRandom } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, EmbedBrands, EmbedColors, StatusEmojis } from '../../../constants';
import { DefaultParameters, DisplayPayload, Paginator, displayReply, shuffleArray } from '../../../utils';


export const COMMAND_ID = 'search.4chan';

export interface CommandArgs {
  closed?: boolean,
  board?: string,
  randomize?: boolean,
  safe?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  // the `safe` option can only turn safe mode on, never off in a sfw channel
  const safe = !!args.safe || DefaultParameters.safe(context);
  // nsfw boards (like /b/) used to be shown anywhere when picked by name, only random boards checked the channel
  const board = await ((args.board) ? search4Chan(context, {board: args.board, safe}) : search4ChanRandom(context, {nsfw: !safe}));
  if (safe && board.nsfw) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.not_nsfw_channel')}`});
  }
  let threads: Array<RestResponsesRaw.Search4ChanThread> = board.threads;
  if (!args.closed) {
    threads = threads.filter((thread) => !thread.closed);
  }
  // checked after filtering, every thread being closed used to crash on `threads[0]`
  if (threads.length) {
    if (args.randomize) {
      shuffleArray(threads);
    }

    const filesCached: Record<string, RequestTypes.File | null> = {};
    // page => whether the thread was blocked by the safety scan
    const blockedCached: Record<number, boolean> = {};

    const pageLimit = threads.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: async (page) => {
        const thread = threads[page - 1];

        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        let footer = translate('search_4chan.4chan_s', {board: board.board});
        if (pageLimit !== 1) {
          footer = translate('search_4chan.page_of', {footer: footer, page: page, pageLimit: pageLimit});
        }
        // icon
        payload.footer = footer;

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
            payload.title = title.trim();
            payload.url = thread.url;
          }
        }

        const files: Array<RequestTypes.File> = [];
        let mediaFile: RequestTypes.File | null = null;
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

          // only show media we downloaded and scanned, a raw url would get embedded by discord without being scanned
          mediaFile = filesCached[url];
          if (mediaFile) {
            files.push(mediaFile);
            payload.image = `attachment://${mediaFile.filename}`;
          }
        }

        if (!(page in blockedCached)) {
          // the safety scan endpoint accepts at most 4000 characters of text
          const text = [thread.title, thread.comment].filter(Boolean).join('\n').trim().slice(0, 4000);
          if (text || mediaFile) {
            try {
              const response = await moderationSafetyScan(context, {
                files: (mediaFile) ? [mediaFile] : undefined,
                logFlags: true,
                safe: true,
                sourceUrl: thread.url,
                text: text || undefined,
              });
              blockedCached[page] = !!((response.media && response.media.unsafe) || (response.text && response.text.unsafe));
            } catch(error) {
              // fail closed, hide the thread if the safety scan fails
              console.error('Failed to scan 4chan thread', error);
              blockedCached[page] = true;
            }
          } else {
            blockedCached[page] = false;
          }
        }

        if (blockedCached[page]) {
          return {
            display: {
              color: EmbedColors.DEFAULT,
              description: `${StatusEmojis.WARNING} ${translate('search_4chan.thread_blocked')}`,
              footer,
            },
          };
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

          description.push(translate('search_4chan.created_at', {created_at_text: thread.created_at_text}));
          if (thread.edited_at) {
            description.push(translate('search_4chan.edited_at', {edited_at: thread.edited_at}));
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
              text = translate('search_4chan.id', {text: text, user: thread.user.id});
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
          payload.description = description.join('\n');
        }

        {
          const description: Array<string> = [];
          description.push(Markup.url('Board', board.url));
          description.push(Markup.url('Thread', thread.url));
          payload.fields!.push({name: 'Urls', value: description.join(', ')});
        }

        if (thread.media) {
          const filename = `${thread.media.name}.${thread.media.extension}`;
          payload.fields!.push({name: translate('search_4chan.media'), value: Markup.url(filename, thread.media.url)});
        }

        return {display: {...payload, files}};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_4chan.couldn_t_find_threads_for_that_board')});
}

