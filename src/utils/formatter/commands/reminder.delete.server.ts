import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MarkupTimestampStyles, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { deleteReminder, fetchReminderPositional } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors, StatusEmojis } from '../../../constants';
import {
  Parameters,
  createTimestampMomentFromGuild,
  displayReply,
  getReminderMessage,
} from '../../../utils';


export const COMMAND_ID = 'reminder.delete.server';

export interface CommandArgs {
  position?: number | string,
  user: Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return displayReply(context, {description: 'wip'});
}
