import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import {
  TimezonesToText,
} from '../../../constants';
import { editOrReply } from '../..';


export const COMMAND_ID = 'settings timezone';

export interface CommandArgs {
  timezone?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const guild = await editGuildSettings(context, context.guildId!, {
    timezone: args.timezone,
  });

  let text: string;
  if (guild.timezone) {
    let timezoneText: string = guild.timezone;
    if (timezoneText in TimezonesToText) {
      timezoneText = (TimezonesToText as any)[guild.timezone];
    }
    text = `Ok, set your server\'s timezone preference to ${Markup.bold(timezoneText)}`;
  } else {
    text = 'Ok, cleared out your server\'s default timezone preference';
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
