import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.file.vanity';

export interface CommandArgs {
  clear?: boolean,
  vanity?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.vanity || args.clear) {
    if (args.clear) {
      args.vanity = null;
    }
    if (oldSettings && oldSettings.file_upload_vanity === args.vanity) {
      if (oldSettings.file_upload_vanity) {
        text = translate('settings_set_file_vanity.your_file_upload_vanity_is_already', {file_upload_vanity: Markup.bold(oldSettings.file_upload_vanity)});
      } else {
        text = translate('settings_set_file_vanity.you_currently_do_not_have_a_file');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        vanity: args.vanity,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.file_upload_vanity) {
        text = translate('settings_set_file_vanity.ok_set_your_file_upload_vanity_to', {file_upload_vanity: Markup.bold(settings.file_upload_vanity)});
      } else {
        text = translate('settings_set_file_vanity.ok_cleared_out_your_file_upload_vanity');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.file_upload_vanity) {
        text = translate('settings_set_file_vanity.your_current_file_upload_vanity_is', {file_upload_vanity: Markup.bold(oldSettings.file_upload_vanity)});
      } else {
        text = translate('settings_set_file_vanity.you_currently_do_not_have_a_file');
      }
    } else {
      text = translate('settings_set_file_vanity.error_fetching_your_current_file_upload_vanity');
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
