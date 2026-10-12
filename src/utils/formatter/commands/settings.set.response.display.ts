import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { UserSettingsResponseDisplayTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.response.display';

export interface CommandArgs {
  clear?: boolean,
  type?: UserSettingsResponseDisplayTypes | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  if (args.clear) {
    args.type = null;
  }

  let text: string = translate('settings_set_response_display.unknown_error_sorry');
  if (args.type === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.response_display) {
        case null: {
          text = translate('settings_set_response_display.you_currently_do_not_have_a_response_display');
        }; break;
        case UserSettingsResponseDisplayTypes.DEFAULT: {
          text = translate('settings_set_response_display.your_current_setting_will_display_responses_with');
        }; break;
        case UserSettingsResponseDisplayTypes.NO_EMBED: {
          text = translate('settings_set_response_display.your_current_setting_will_display_responses_without');
        }; break;
        case UserSettingsResponseDisplayTypes.LEGACY: {
          text = translate('settings_set_response_display.your_current_setting_will_display_responses_in');
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      responseDisplay: args.type,
    });
    UserSettingsStore.insert(context.userId, settings);
    switch (settings.response_display) {
      case null: {
        text = translate('settings_set_response_display.ok_cleared_out_your_response_display');
      }; break;
      case UserSettingsResponseDisplayTypes.DEFAULT: {
        text = translate('settings_set_response_display.ok_will_display_responses_with_our_latest');
      }; break;
      case UserSettingsResponseDisplayTypes.NO_EMBED: {
        text = translate('settings_set_response_display.ok_will_display_responses_without_using_embeds');
      }; break;
      case UserSettingsResponseDisplayTypes.LEGACY: {
        text = translate('settings_set_response_display.ok_will_display_responses_in_our_legacy');
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
