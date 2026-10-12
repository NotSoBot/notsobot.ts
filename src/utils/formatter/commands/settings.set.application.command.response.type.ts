import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { UserSettingsApplicationCommandResponseTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.application.command.response.type';

export interface CommandArgs {
  type?: UserSettingsApplicationCommandResponseTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let text: string = translate('settings_set_application_command_response_type.unknown_error_sorry');
  if (args.type === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.application_command_response_type) {
        case UserSettingsApplicationCommandResponseTypes.AUTOMATIC: {
          text = translate('settings_set_application_command_response_type.your_current_setting_will_have_application_commands');
        }; break;
        case UserSettingsApplicationCommandResponseTypes.EPHEMERAL: {
          text = translate('settings_set_application_command_response_type.your_current_setting_will_have_application_commands_2');
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      applicationCommandResponseType: args.type,
    });
    switch (settings.application_command_response_type) {
      case UserSettingsApplicationCommandResponseTypes.AUTOMATIC: {
        text = translate('settings_set_application_command_response_type.ok_application_commands_will_automatically_choose_if');
      }; break;
      case UserSettingsApplicationCommandResponseTypes.EPHEMERAL: {
        text = translate('settings_set_application_command_response_type.ok_application_commands_will_always_respond_ephemerally');
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
