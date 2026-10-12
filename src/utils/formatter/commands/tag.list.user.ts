import { Command, Interaction, Structures } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { fetchTagsServer, fetchUserTags } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
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


export const COMMAND_ID = 'tag.list.user';

export const MAX_FETCHES = 50;
export const RESULTS_PER_PAGE = 28;


export interface CommandArgs {
  content?: string,
  global?: boolean,
  name?: string,
  user: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  if (args.user.bot) {
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag_list_user.bots_do_not_have_tags')}`);
  }

  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let before: string | undefined;
  let count: number = 0;
  let fetched: number = 0;
  const chunks: Array<Array<RestResponsesRaw.Tag>> = [];
  for (let i = 0; i < MAX_FETCHES; i++) {
    let response: RestResponsesRaw.FetchTags | RestResponsesRaw.FetchUserTags;
    if (args.global) {
      response = await fetchUserTags(context, args.user.id, {
        before,
        content: args.content,
        name: args.name,
      });
    } else {
      response = await fetchTagsServer(context, context.guildId || context.channelId!, {
        before,
        content: args.content,
        name: args.name,
        userId: args.user.id,
      });
    }

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

        if (args.content || args.name || args.user) {
          const description: Array<string> = [];
          if (args.user) {
            description.push((args.global) ? translate('tag_list_user.showing_global_tags_owned_by', {user: createUserString(args.user.id, args.user)}) : translate('tag_list_user.showing_server_tags_owned_by', {user: createUserString(args.user.id, args.user)}));
          }
          if (args.name) {
            description.push(translate('tag_list_user.filtering_for_tags_with_names_containing', {name: Markup.codestring(args.name)}));
          }
          if (args.content) {
            description.push(translate('tag_list_user.filtering_for_tags_with_content_containing', {content: Markup.codestring(args.content)}));
          }
          embed.setDescription(description.join('\n'));
        }

        let footer = (args.global) ? translate('tag_list_user.global_tags') : translate('tag_list_user.server_tags')
        if (pageLimit !== 1) {
          footer = translate('tag_list_user.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
        }
        embed.setFooter(translate('tag_list_user.total_tags', {count: count.toLocaleString(language), footer: footer}));

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

  if (args.user.id === context.userId) {
    return editOrReply(context, (args.global) ? translate('tag_list_user.you_don_t_have_any_global_tags') : translate('tag_list_user.you_don_t_have_any_tags_here'));
  }
  return editOrReply(context, (args.global) ? translate('tag_list_user.they_don_t_have_any_global_tags') : translate('tag_list_user.they_don_t_have_any_tags_here'));
}
