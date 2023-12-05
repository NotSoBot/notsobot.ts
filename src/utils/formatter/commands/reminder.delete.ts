import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { createReminder } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { Parameters, createTimestampMomentFromGuild, editOrReply, getReminderMessage } from '../../../utils';


export const COMMAND_ID = 'reminder.delete';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return editOrReply(context, {
    content: 'wip',
  });
}
