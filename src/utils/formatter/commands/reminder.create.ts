import moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { createReminder, editReminder } from '../../../api';
import { getTranslator } from '../../i18n';
import { ONE_DAY } from '../../../constants';
import { ReminderInterval } from '../../../listeners';
import { Parameters, displayReply } from '../../../utils';


export const COMMAND_ID = 'reminder.create';

export interface CommandArgs {
  result: Parameters.NLPTimestampResult,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { result } = args;
  const reminder = await createReminder(context, {
    channelId: context.channelId,
    content: result.content,
    guildId: context.guildId,
    messageId: (context instanceof Command.Context) ? context.messageId : null,
    timestampEnd: (result.end) ? result.end.getTime() : undefined,
    timestampStart: result.start.getTime(),
  });

  // cluster 0 schedules reminders, it gets this one from the api's REMINDER_CREATE event (insertReminder skips
  // it on other clusters and when it's already scheduled), this just saves it the wait when we're cluster 0
  if (context.cluster) {
    ReminderInterval.insertReminder(context.cluster, reminder);
  }

  const date = new Date(reminder.timestamp_start);

  let text: string;
  if (isFromInteraction) {
    text = translate('reminder_create.ok_reminding');
  } else {
    text = translate('reminder_create.ok_reminding_2', {user: context.user.mention});
  }

  // plain text on purpose, a discord relative timestamp would change to "x ago" and hide how long the reminder was set for
  text = `${text} ${moment(date).locale(language).fromNow()}`;
  if (ONE_DAY <= (date.getTime() - Date.now())) {
    text = `${text} (${Markup.timestamp(date)})`;
  }

  if (reminder.content) {
    if (128 < reminder.content.length) {
      text = `${text}: ${Markup.codestring(reminder.content.slice(0, 126))}...`;
    } else {
      text = `${text}: ${Markup.codestring(reminder.content)}`;
    }
  }

  const reply = await displayReply(context, {
    allowedMentions: {
      repliedUser: true,
      users: [context.userId],
    },
    description: text,
  });

  // a slash reminder has no command message, our response is the message it's about: its list entry links there and it
  // replies to it when it goes off (it used to be `null`, a `.../null` link). Ephemeral responses can't be linked or
  // replied to, those stay without one
  if (context instanceof Interaction.InteractionContext) {
    try {
      const response = await context.fetchResponse();
      if (!response.hasFlagEphemeral && response.channelId === reminder.channel_id) {
        await editReminder(context, reminder.id, {messageId: response.id});
      }
    } catch(error) {
      // the reminder still works, just without the link
    }
  }
  return reply;
}
