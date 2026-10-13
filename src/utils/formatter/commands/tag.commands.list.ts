import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildTagsCommands, fetchUserTagsCommands } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
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


export const COMMAND_ID = 'tag.commands.list';

export const RESULTS_PER_PAGE = 28;


export interface CommandArgs {
  showMeOnly?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

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
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        {
          const description: Array<string> = [];
          if (showMeOnly) {
            description.push(translate('tag_commands_list.showing_your_global_custom_commands'));
          } else {
            description.push(translate('tag_commands_list.showing_this_server_s_custom_commands'));
          }
          payload.description = description.join('\n');
        }

        let footer = (showMeOnly) ? translate('tag_commands_list.global_custom_commands') : translate('tag_commands_list.server_custom_commands')
        if (pageLimit !== 1) {
          footer = translate('tag_commands_list.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
        }
        payload.footer = translate('tag_commands_list.total_tags', {count: count.toLocaleString(language), footer: footer});

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

            payload.fields!.push({inline: true, name: '\u200b', value: description.join('\n')});
          }
        }

        return {display: payload};
      },
    });
    return await paginator.start();
  }

  const text = (showMeOnly) ? translate('tag_commands_list.you_don_t_have_any_global_custom') : translate('tag_commands_list.this_server_has_no_custom_commands');
  return displayReply(context, {description: text});
}
