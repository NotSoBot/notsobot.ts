import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes, MarkupTimestampStyles, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { Components, ComponentContext, Embed, Markup } from 'detritus-client/lib/utils';
import { Endpoints } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { deleteReminder, fetchReminderPositional } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { BooleanEmojis, EmbedColors } from '../../../constants';
import {
  Parameters,
  createTimestampMomentFromGuild,
  createUserEmbed,
  editOrReply,
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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  return editOrReply(context, 'wip');
}
