import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.download.quality';

export interface CommandArgs {
  clear?: boolean,
  quality?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.quality || args.clear) {
    if (args.clear) {
      args.quality = null;
    }
    if (oldSettings && oldSettings.download_quality === args.quality) {
      if (oldSettings.download_quality) {
        text = translate('settings_set_download_quality.your_download_quality_preference_is_already', {download_quality: Markup.bold(oldSettings.download_quality)});
      } else {
        text = translate('settings_set_download_quality.you_currently_do_not_have_a_download');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        downloadQuality: args.quality,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.download_quality) {
        text = translate('settings_set_download_quality.ok_set_your_download_quality_preference_to', {download_quality: Markup.bold(settings.download_quality)});
      } else {
        text = translate('settings_set_download_quality.ok_cleared_out_your_download_quality_preference');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.download_quality) {
        text = translate('settings_set_download_quality.your_current_download_quality_preference_is', {download_quality: Markup.bold(oldSettings.download_quality)});
      } else {
        text = translate('settings_set_download_quality.you_currently_do_not_have_a_download');
      }
    } else {
      text = translate('settings_set_download_quality.error_fetching_your_current_download_quality_preference');
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
