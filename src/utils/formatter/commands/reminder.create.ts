import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { createReminder } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { ONE_DAY } from '../../../constants';
import { ReminderInterval } from '../../../listeners';
import { Parameters, createTimestampMomentFromContext, editOrReply, getReminderMessage } from '../../../utils';


export const COMMAND_ID = 'reminder.create';

export interface CommandArgs {
  result: Parameters.NLPTimestampResult,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
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

  if (context.manager) {
    await context.manager.broadcastEval(ReminderInterval.broadcastEvalInsert, reminder);
  } else if (context.cluster) {
    ReminderInterval.insertReminder(context.cluster, reminder);
  }

  const date = new Date(reminder.timestamp_start);
  const timestamp = createTimestampMomentFromContext(reminder.timestamp_start, context);

  let text: string;
  if (isFromInteraction) {
    text = `Ok, reminding`;
  } else {
    text = `Ok, reminding ${context.user.mention}`;
  }

  //text = `${text} ${Markup.timestamp(date, MarkupTimestampStyles.RELATIVE)}`;
  text = `${text} ${timestamp.fromNow()}`;
  if (ONE_DAY <= (date.getTime() - Date.now())) {
    text = `${text} (${Markup.timestamp(date)})`;
  }

  /*
  // old, use above
  text = `${text} ${result.contentTimestamp || timestamp.fromNow()}`;
  if (result.contentTimestamp.toLowerCase().includes('tomorrow') || ONE_DAY <= (date.getTime() - Date.now())) {
    text = `${text} (${Markup.timestamp(date)})`;
  }
  */

  if (!reminder.content) {
    //text = `${text}: ${getReminderMessage(reminder.id)}`;
  } else if (128 < reminder.content.length) {
    text = `${text}: ${Markup.codestring(reminder.content.slice(0, 126))}...`;
  } else {
    text = `${text}: ${Markup.codestring(reminder.content)}`;
  }

  return editOrReply(context, {
    content: text,
    allowedMentions: {
      repliedUser: true,
      users: [context.userId],
    },
  });
}
