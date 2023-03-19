import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';

import { fetchUserReminders } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { Parameters, createTimestampMomentFromGuild, editOrReply, getReminderMessage } from '../../../utils';


export const COMMAND_ID = 'reminder.list.user';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const result = await fetchUserReminders(context, context.userId);
  const reminders = result.reminders.reverse();

  const embed = new Embed();
  embed.setTitle('wip');
  {
    const description: Array<string> = [];
    for (let reminder of reminders) {
      const jumpLink = Endpoints.Routes.URL + Endpoints.Routes.MESSAGE(reminder.guild_id, reminder.channel_id, reminder.message_id);
      const timestamp = Markup.timestamp(Date.parse(reminder.timestamp_start), MarkupTimestampStyles.RELATIVE);
      description.push(`${Markup.bold(String(reminder.position))}: ${Markup.url('Message', jumpLink)} ${timestamp}`);
      description.push(`-> ${(Markup.escape.all(reminder.content) || 'N/A').slice(0, 69)}`);
    }
    embed.setDescription(description.join('\n'));
  }
  embed.setFooter(`${result.count.toLocaleString()} Reminders`);
  return editOrReply(context, {embed});
}
