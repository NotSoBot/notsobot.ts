import { Command, Interaction, Structures } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import { fetchReminders } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import {
  DisplayPayload,
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  createUserString,
  getReminderMessage,
} from '../../../utils';


export const COMMAND_ID = 'reminder.list.server';

export const RESULTS_PER_PAGE = 8;

export interface CommandArgs {
  user?: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  if (context.inDm) {
    args.user = context.user;
  }

  const serverId = context.guildId || null;
  const guildId = serverId || 0;
  const userId = (args.user) ? args.user.id : undefined;

  const result = await fetchReminders(context, {guildId, userId});
  const results = result.reminders.reverse();

  const pages = chunkArray<RestResponsesRaw.Reminder>(results, RESULTS_PER_PAGE);
  const pageLimit = pages.length;
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const payload: DisplayPayload = {fields: []};
      payload.color = EmbedColors.DEFAULT;

      {
        if (args.user) {
          if (context.userId === args.user.id) {
            payload.title = translate('reminder_list_server.your_reminders_for_this_server');
          } else {
            payload.title = translate('reminder_list_server.s_reminders_for_this_server', {user: createUserString(args.user.id, args.user)});
          }
        } else {
          payload.title = translate('reminder_list_server.all_reminders_for_this_server');
        }
      }

      let footer = translate('reminder_list_server.reminders', {count: result.count.toLocaleString(language)});
      if (pageLimit !== 1) {
        footer = translate('reminder_list_server.page_of', {footer: footer, pageLimit: pageLimit, pageNumber: pageNumber});
      }
      payload.footer = footer;

      // no reminders means no pages, `pages[0]` is undefined
      const reminders = pages[pageNumber - 1];
      if (reminders && reminders.length) {
        const description: Array<string> = [];
        for (let i = 0; i < reminders.length; i++) {
          const reminder = reminders[i];
          const title = translate('reminder_list_server.message');

          let content: string;
          if (!reminder.content) {
            content = ''; // getReminderMessage(reminder.id);
          } else if (128 < reminder.content.length) {
            // maybe make this 69?
            content = `${Markup.codestring(reminder.content.slice(0, 126))}...`;
          } else {
            content = Markup.codestring(reminder.content);
          }

          const jumpLink = Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(reminder.guild_id, reminder.channel_id, reminder.message_id);
          const timestamp = Markup.timestamp(Date.parse(reminder.timestamp_start), MarkupTimestampStyles.RELATIVE);
          {
            let text = `${Markup.bold(String(i + 1 + ((pageNumber - 1) * RESULTS_PER_PAGE)))}: ${timestamp}`;
            if (!args.user) {
              let noun: string;
              if (context.users.has(reminder.user.id)) {
                const user = context.users.get(reminder.user.id)!;
                noun = createUserString(reminder.user.id, user);
              } else {
                const name = `${reminder.user.username}#${reminder.user.discriminator}`;
                noun = createUserString(reminder.user.id, null, name);
              }
              text = translate('reminder_list_server.by_id', {noun: noun, position: reminder.position, text: text});
            }
            description.push(`${text} (${Markup.url(title, jumpLink)})`);
          }
          if (content) {
            description.push(`-> ${content}`);
          }
        }
        payload.description = description.join('\n');
      } else {
        payload.description = translate('reminder_list_server.no_reminders_found');
      }

      return {display: payload};
    },
  });
  return await paginator.start();
}
