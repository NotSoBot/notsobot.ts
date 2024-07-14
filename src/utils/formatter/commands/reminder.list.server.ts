import { Command, Interaction, Structures } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import { fetchReminders } from '../../../api';
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


export const COMMAND_ID = 'reminder.list.server';

export const RESULTS_PER_PAGE = 8;

export interface CommandArgs {
  user?: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

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
      const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
      embed.setColor(EmbedColors.DEFAULT);

      {
        let noun: string;
        if (args.user) {
          if (context.userId === args.user.id) {
            noun = 'Your';
          } else {
            noun = `${createUserString(args.user.id, args.user)}'s`;
          }
        } else {
          noun = 'All';
        }
        embed.setTitle(`${noun} Reminders for this Server`);
      }

      let footer = `${result.count.toLocaleString()} Reminders`;
      if (pageLimit !== 1) {
        footer = `Page ${pageNumber}/${pageLimit} of ${footer}`;
      }
      embed.setFooter(footer);

      const reminders = pages[pageNumber - 1];
      if (reminders.length) {
        const description: Array<string> = [];
        for (let i = 0; i < reminders.length; i++) {
          const reminder = reminders[i];
          const title = 'Message';

          let content: string;
          if (!reminder.content) {
            content = getReminderMessage(reminder.id);
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
              text = `${text} by ${noun} (Id: ${reminder.position})`;
            }
            description.push(`${text} (${Markup.url(title, jumpLink)})`);
          }
          description.push(`-> ${content}`);
        }
        embed.setDescription(description.join('\n'));
      } else {
        embed.setDescription('No Reminders Found');
      }

      return embed;
    },
  });
  return await paginator.start();
}
