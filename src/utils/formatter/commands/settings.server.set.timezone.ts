import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import { editGuildSettings } from '../../../api';
import { getTranslator } from '../../i18n';
import { displayReply, timezoneCodeToText } from '../..';


export const COMMAND_ID = 'server.set.timezone';

export interface CommandArgs {
  clear?: boolean,
  timezone?: string | null,
}

// set it, clear it, or show the current one when nothing was given (this used to always send an edit,
// so `clear` did nothing and no arguments "cleared" a timezone that was never set)
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate, translateMaybe } = await getTranslator(context);

  const oldSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);

  let text: string;
  if (args.timezone || args.clear) {
    const timezone = (args.clear) ? null : args.timezone!;
    if (oldSettings && (oldSettings.timezone || null) === timezone) {
      if (timezone) {
        text = translateMaybe('settings_server_set_timezone.the_server_s_timezone_is_already', 'The server\'s timezone is already {timezoneText}')
          .replace('{timezoneText}', Markup.bold(timezoneCodeToText(timezone)));
      } else {
        text = translateMaybe('settings_server_set_timezone.the_server_does_not_have_a_timezone', 'The server does not have a timezone set');
      }
    } else {
      const guild = await editGuildSettings(context, context.guildId!, {timezone});
      if (guild.timezone) {
        text = translate('settings_server_set_timezone.ok_set_your_server_s_timezone_preference', {timezoneText: Markup.bold(timezoneCodeToText(guild.timezone))});
      } else {
        text = translate('settings_server_set_timezone.ok_cleared_out_your_server_s_default');
      }
    }
  } else if (oldSettings) {
    if (oldSettings.timezone) {
      text = translateMaybe('settings_server_set_timezone.the_server_s_current_timezone_is', 'The server\'s current timezone is {timezoneText}')
        .replace('{timezoneText}', Markup.bold(timezoneCodeToText(oldSettings.timezone)));
    } else {
      text = translateMaybe('settings_server_set_timezone.the_server_does_not_have_a_timezone', 'The server does not have a timezone set');
    }
  } else {
    text = translate('settings_set_timezone.error_fetching_your_current_timezone');
  }

  return displayReply(context, {description: text, ephemeral: true});
}
