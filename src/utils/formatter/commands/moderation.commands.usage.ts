import { Command, Interaction, Structures } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import { fetchCommandsUsage } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import {
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserEmbed,
  createUserString,
  editOrReply,
  getReminderMessage,
} from '../../../utils';


export const COMMAND_ID = 'moderation.commands.usage';

export const MAX_RESULTS = 100000;
export const RESULTS_PER_PAGE = 10;


export interface CommandArgsBefore {
  channel?: null | Structures.Channel,
  user?: null | Structures.Member | Structures.User,
}

export interface CommandArgs {
  channel?: Structures.Channel,
  user?: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let channelId: string | undefined;
  if (context.guildId) {
    channelId = (args.channel) ? args.channel.id : undefined;
  } else {
    channelId = context.channelId;
  }

  let finished = false;
  let before: number | undefined;

  let results: Array<RestResponsesRaw.CommandUsage> = [];
  let total = {count: 0, since: 0};

  while (!finished && results.length <= MAX_RESULTS) {
    const response = await fetchCommandsUsage(context, {
      before,
      channelId,
      guildId: context.guildId || undefined,
      limit: 10000,
      userId: (args.user) ? args.user.id : undefined,
    });
    total = response.total;
    if (response.results.length) {
      before = response.results[response.results.length - 1]!.timestamp;
      results = [...results, ...response.results];
    } else {
      finished = true;
    }
  }

  const pages = chunkArray<RestResponsesRaw.CommandUsage>(results, RESULTS_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);

      // if count matches result count, show different footer
      let footer = `${total.count.toLocaleString()} Commands Used`;
      if (pageLimit !== 1) {
        footer = `Page ${pageNumber}/${pageLimit} of ${footer}`;
      }
      embed.setFooter(footer);

      const usages = pages[pageNumber - 1];
      if (usages.length) {
        const description: Array<string> = [];
        for (let i = 0; i < usages.length; i++) {
          const usage = usages[i];

          let noun: string;
          if (context.users.has(usage.user_id)) {
            const user = context.users.get(usage.user_id)!;
            noun = createUserString(usage.user_id, user);
          } else {
            // maybe fetch the user?
            const name = `Unknown`;
            noun = createUserString(usage.user_id, null, name);
          }
  
          const command = Markup.codestring(usage.command_id);
          const timestamp = Markup.timestamp(usage.timestamp * 1000, MarkupTimestampStyles.RELATIVE);

          description.push(`${Markup.bold(String(i + 1 + ((pageNumber - 1) * RESULTS_PER_PAGE)))}: ${command} around ${timestamp}`);
          description.push(`-> by ${noun}`);
        }
        embed.setDescription(description.join('\n'));
      } else {
        embed.setDescription('No Commands Used');
      }

      return embed;
    },
  });
  return await paginator.start();
}
