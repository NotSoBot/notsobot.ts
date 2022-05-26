import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { createReminder } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { ONE_DAY } from '../../../constants';
import { Parameters, createTimestampMomentFromGuild, editOrReply, getReminderMessage } from '../../../utils';


export const COMMAND_ID = 'reminder.create';

export interface CommandArgs {
  result: Parameters.NLPTimestampResult,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { result } = args;
  const reminder = await createReminder(context, {
    channelId: context.channelId,
    content: result.content,
    guildId: context.guildId,
    messageId: (context instanceof Command.Context) ? context.messageId : null,
    timestampEnd: (result.end) ? result.end.getTime() : undefined,
    timestampStart: result.start.getTime(),
  });

  // maybe input it using broadcastEval

  const date = new Date(reminder.timestamp_start);
  const timestamp = createTimestampMomentFromGuild(reminder.timestamp_start, context.guildId);

  let text: string;
  if (context instanceof Command.Context) {
    text = `Ok, reminding ${context.user.mention}`;
  } else {
    text = `Ok, reminding`;
  }

  text = `${text} ${result.contentTimestamp || timestamp.fromNow()}`;
  if (result.contentTimestamp.toLowerCase().includes('tomorrow') || ONE_DAY <= (date.getTime() - Date.now())) {
    text = `${text} (${Markup.timestamp(date)})`;
  }
  if (!reminder.content) {
    text = `${text}: ${getReminderMessage(reminder.id)}`;
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
