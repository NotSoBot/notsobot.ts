import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  TimezonesToText,
} from '../../../constants';
import { editOrReply } from '../..';


export const COMMAND_ID = 'settings.server.set.timezone';

export interface CommandArgs {
  timezone?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
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
    text = translate('settings_server_set_timezone.ok_set_your_server_s_timezone_preference', {timezoneText: Markup.bold(timezoneText)});
  } else {
    text = translate('settings_server_set_timezone.ok_cleared_out_your_server_s_default');
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
