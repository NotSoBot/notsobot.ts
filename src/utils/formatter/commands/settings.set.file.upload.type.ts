import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { UserSettingsUploadTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.file.upload.type';

export interface CommandArgs {
  type?: UserSettingsUploadTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let text: string = translate('settings_set_file_upload_type.unknown_error_sorry');
  if (args.type === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.file_upload_type) {
        case UserSettingsUploadTypes.AUTOMATIC: {
          text = translate('settings_set_file_upload_type.your_current_setting_will_have_files_uploaded');
        }; break;
        case UserSettingsUploadTypes.TEMPORARY: {
          text = translate('settings_set_file_upload_type.your_current_setting_will_have_files_uploaded_2');
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      fileUploadType: args.type,
    });
    switch (settings.file_upload_type) {
      case UserSettingsUploadTypes.AUTOMATIC: {
        text = translate('settings_set_file_upload_type.ok_files_will_be_uploaded_to_our');
      }; break;
      case UserSettingsUploadTypes.TEMPORARY: {
        text = translate('settings_set_file_upload_type.ok_files_will_be_uploaded_to_our_2');
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
