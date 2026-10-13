import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTagsServer } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import {
  DefaultParameters,
  DisplayPayload,
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserString,
  displayReply,
} from '../../../utils';


export const COMMAND_ID = 'tag.list.server';

export const MAX_FETCHES = 50;
export const RESULTS_PER_PAGE = 28;



export interface FetchTagsServerSearch {
  content?: string,
  name?: string,
  userId?: string,
}


export async function fetchTagsServerSearch(
  context: Command.Context | Interaction.InteractionContext,
  serverId: string,
  options: FetchTagsServerSearch = {},
): Promise<Array<RestResponsesRaw.Tag>> {
  let before: string | undefined;
  let count: number = 0;
  let fetched: number = 0;
  const chunks: Array<Array<RestResponsesRaw.Tag>> = [];
  for (let i = 0; i < MAX_FETCHES; i++) {
    const response = await fetchTagsServer(context, serverId, {
      before,
      content: options.content,
      name: options.name,
      userId: options.userId,
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

  return chunks.flat();
}


export interface CommandArgs {
  content?: string,
  name?: string,
  user?: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  if (args.user && args.user.bot) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_list_server.bots_do_not_have_tags')}`});
  }

  const serverId = context.guildId || context.channelId!;

  const tags = await fetchTagsServerSearch(context, serverId, {
    content: args.content,
    name: args.name,
    userId: (args.user) ? args.user.id : undefined,
  });

  const pages = chunkArray<RestResponsesRaw.Tag>(tags, RESULTS_PER_PAGE);
  if (pages.length) {
    const pageLimit = pages.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (pageNumber) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        if (args.content || args.content || args.user) {
          const description: Array<string> = [];
          if (args.user) {
            description.push(translate('tag_list_server.showing_tags_owned_by', {user: createUserString(args.user.id, args.user)}));
          }
          if (args.name) {
            description.push(translate('tag_list_server.filtering_for_tags_with_names_containing', {name: Markup.codestring(args.name)}));
          }
          if (args.content) {
            description.push(translate('tag_list_server.filtering_for_tags_with_content_containing', {content: Markup.codestring(args.content)}));
          }
          payload.description = description.join('\n');
        }

        let footer = translate('tag_list_server.server_tags');
        if (pageLimit !== 1) {
          footer = translate('tag_list_server.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
        }
        payload.footer = translate('tag_list_server.total_tags', {footer: footer, tags_count: tags.length.toLocaleString(language)});

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

            payload.fields!.push({inline: true, name: '\u200b', value: description.join('\n')});
          }
        }

        return {display: payload};
      },
    });
    return await paginator.start();
  }

  if (args.content || args.name || args.user) {
    return displayReply(context, {description: translate('tag_list_server.this_server_has_no_tags_matching_the')});
  }

  return displayReply(context, {description: translate('tag_list_server.this_server_has_no_tags')});
}
