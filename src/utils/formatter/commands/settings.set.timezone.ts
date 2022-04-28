import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editUser } from '../../../api';
import {
  TimezonesToText,
} from '../../../constants';
import { editOrReply } from '../..';


export const COMMAND_ID = 'settings.set.timezone';

export interface CommandArgs {
  timezone?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const user = await editUser(context, context.userId, {timezone: args.timezone});

  let text: string;
  if (user.timezone) {
    let timezoneText: string = user.timezone;
    if (timezoneText in TimezonesToText) {
      timezoneText = (TimezonesToText as any)[user.timezone];
    }
    text = `Ok, set your timezone preference to ${Markup.bold(timezoneText)}`;
  } else {
    text = 'Ok, cleared out your default timezone preference';
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
