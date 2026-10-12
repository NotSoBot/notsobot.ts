import { Command, Interaction, Structures } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import { fetchUserReminders } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import {
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
  getReminderMessage,
} from '../../../utils';


export const COMMAND_ID = 'reminder.list.user';

export const RESULTS_PER_PAGE = 8;

export interface CommandArgs {
  global?: boolean,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const serverId = context.guildId || null;
  const guildId = (args.global) ? undefined : (serverId || 0);

  const result = await fetchUserReminders(context, context.user.id, {guildId});
  const results = result.reminders.reverse();

  const pages = chunkArray<RestResponsesRaw.Reminder>(results, RESULTS_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);
      if (args.global) {
        embed.setTitle(translate('reminder_list_me.all_of_your_reminders'));
      } else {
        embed.setTitle(translate('reminder_list_me.your_reminders_for_this_server'));
      }

      let footer = translate('reminder_list_me.reminders', {count: result.count.toLocaleString(language)});
      if (pageLimit !== 1) {
        footer = translate('reminder_list_me.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
      }
      embed.setFooter(footer);

      const reminders = pages[pageNumber - 1];
      if (reminders && reminders.length) {
        const description: Array<string> = [];
        for (let reminder of reminders) {
          const title = (reminder.guild_id === serverId) ? translate('reminder_list_me.message_in_this_server') : translate('reminder_list_me.message');
  
          let content: string;
          if (!reminder.content) {
            content = ''; //getReminderMessage(reminder.id);
          } else if (128 < reminder.content.length) {
            // maybe make this 69?
            content = `${Markup.codestring(reminder.content.slice(0, 126))}...`;
          } else {
            content = Markup.codestring(reminder.content);
          }
  
          const jumpLink = Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(reminder.guild_id, reminder.channel_id, reminder.message_id);
          const timestamp = Markup.timestamp(Date.parse(reminder.timestamp_start), MarkupTimestampStyles.RELATIVE);
          description.push(`${Markup.bold(String(reminder.position))}: ${timestamp} (${Markup.url(title, jumpLink)})`);
          if (content) {
            description.push(`-> ${content}`);
          }
        }
        embed.setDescription(description.join('\n'));
      } else {
        embed.setDescription(translate('reminder_list_me.no_reminders_found'));
      }

      return embed;
    },
  });
  return await paginator.start();
}
