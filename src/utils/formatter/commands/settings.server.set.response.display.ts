import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import { editGuildSettings } from '../../../api';
import { GuildSettingsResponseDisplayTypes } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.server.set.response.display';

export interface CommandArgs {
  clear?: boolean,
  type?: GuildSettingsResponseDisplayTypes | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  if (args.clear) {
    args.type = null;
  }

  let text: string = translate('settings_server_set_response_display.unknown_error_sorry');
  if (args.type === undefined) {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (guildSettings) {
      switch (guildSettings.settings.responseDisplay) {
        case null: {
          text = translate('settings_server_set_response_display.this_server_does_not_have_a_response_display');
        }; break;
        case GuildSettingsResponseDisplayTypes.DEFAULT: {
          text = translate('settings_server_set_response_display.this_server_s_current_setting_will_display');
        }; break;
        case GuildSettingsResponseDisplayTypes.NO_EMBED: {
          text = translate('settings_server_set_response_display.this_server_s_current_setting_will_display_2');
        }; break;
        case GuildSettingsResponseDisplayTypes.LEGACY: {
          text = translate('settings_server_set_response_display.this_server_s_current_setting_will_display_3');
        }; break;
      }
    } else {
      text = translate('settings_server_set_response_display.error_fetching_this_server_s_current_response');
    }
  } else {
    const { settings } = await editGuildSettings(context, context.guildId!, {
      responseDisplay: args.type,
    });
    switch (settings.responseDisplay) {
      case null: {
        text = translate('settings_server_set_response_display.ok_cleared_out_this_server_s_response_display');
      }; break;
      case GuildSettingsResponseDisplayTypes.DEFAULT: {
        text = translate('settings_server_set_response_display.ok_will_display_this_server_s_responses');
      }; break;
      case GuildSettingsResponseDisplayTypes.NO_EMBED: {
        text = translate('settings_server_set_response_display.ok_will_display_this_server_s_responses_2');
      }; break;
      case GuildSettingsResponseDisplayTypes.LEGACY: {
        text = translate('settings_server_set_response_display.ok_will_display_this_server_s_responses_3');
      }; break;
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
