import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { UserSettingsUploadThresholdTypes } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.file.upload.threshold';

export interface CommandArgs {
  threshold?: UserSettingsUploadThresholdTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  let text: string = translate('settings_set_file_upload_threshold.unknown_error_sorry');
  if (args.threshold === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.file_upload_threshold) {
        case UserSettingsUploadThresholdTypes.ALWAYS: {
          text = translate('settings_set_file_upload_threshold.your_current_setting_will_always_upload_files');
        }; break;
        case UserSettingsUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT: {
          text = translate('settings_set_file_upload_threshold.your_current_setting_will_only_upload_files');
        }; break;
        case UserSettingsUploadThresholdTypes.NEVER: {
          text = translate('settings_set_file_upload_threshold.your_current_setting_will_never_upload_files');
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      fileUploadThreshold: args.threshold,
    });
    switch (settings.file_upload_threshold) {
      case UserSettingsUploadThresholdTypes.ALWAYS: {
        text = translate('settings_set_file_upload_threshold.ok_will_always_upload_files_to_our');
      }; break;
      case UserSettingsUploadThresholdTypes.EXCEEDS_DISCORD_LIMIT: {
        text = translate('settings_set_file_upload_threshold.ok_will_only_upload_files_if_they');
      }; break;
      case UserSettingsUploadThresholdTypes.NEVER: {
        text = translate('settings_set_file_upload_threshold.ok_will_never_upload_files_to_our');
      }; break;
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
