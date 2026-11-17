import { Command, Interaction, Structures } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { fetchCommandsUsage } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import {
  DisplayPayload,
  Paginator,
  chunkArray,
  createUserString,
} from '../../../utils';


export const COMMAND_ID = 'server.commands.usage';

export const MAX_RESULTS = 100000;
export const RESULTS_PER_PAGE = 10;


export interface CommandArgsBefore {
  channel?: null | Structures.Channel,
  command?: '' | null | Command.Command,
  user?: null | Structures.Member | Structures.User,
}

export interface CommandArgs {
  channel?: Structures.Channel,
  // a command's id (`getCommandIdFromInvoker`), its prefixed and slash uses share it
  commandId?: string,
  user?: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);

  let channelId: string | undefined;
  if (context.guildId) {
    channelId = (args.channel) ? args.channel.id : undefined;
  } else {
    channelId = context.channelId;
  }

  // one request, the api takes up to `MAX_RESULTS`. Paging by `before` lost the other uses in the same second at every
  // page boundary (timestamps are whole seconds), and the total came from the last page's `before`, so it was only what
  // was older than everything shown
  const response = await fetchCommandsUsage(context, {
    channelId,
    commandId: args.commandId,
    guildId: context.guildId || undefined,
    limit: MAX_RESULTS,
    userId: (args.user) ? args.user.id : undefined,
  });
  const results: Array<RestResponsesRaw.CommandUsage> = response.results;
  const total = response.total;

  const pages = chunkArray<RestResponsesRaw.CommandUsage>(results, RESULTS_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const payload: DisplayPayload = {fields: []};
      payload.color = EmbedColors.DEFAULT;

      // if count matches result count, show different footer
      let footer = translate('moderation_commands_usage.commands_used', {count: total.count.toLocaleString(language)});
      if (pageLimit !== 1) {
        footer = translate('moderation_commands_usage.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
      }
      payload.footer = footer;

      // no results means no pages, `pages[0]` is undefined
      const usages = pages[pageNumber - 1];
      if (usages && usages.length) {
        const description: Array<string> = [];
        for (let i = 0; i < usages.length; i++) {
          const usage = usages[i];

          let noun: string;
          if (context.users.has(usage.user_id)) {
            const user = context.users.get(usage.user_id)!;
            noun = createUserString(usage.user_id, user);
          } else {
            // maybe fetch the user?
            const name = translate('moderation_commands_usage.unknown');
            noun = createUserString(usage.user_id, null, name);
          }
  
          const command = Markup.codestring(usage.command_id);
          const timestamp = Markup.timestamp(usage.timestamp * 1000, MarkupTimestampStyles.RELATIVE);

          description.push(translate('moderation_commands_usage.around', {command: command, index: Markup.bold(String(i + 1 + ((pageNumber - 1) * RESULTS_PER_PAGE))), timestamp: timestamp}));
          description.push(translate('moderation_commands_usage.by', {noun: noun}));
        }
        payload.description = description.join('\n');
      } else {
        payload.description = translate('moderation_commands_usage.no_commands_used');
      }

      return {display: payload};
    },
  });
  return await paginator.start();
}
