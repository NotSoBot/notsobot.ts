import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { UserSettingsFallbacksMediaImageTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.fallbacks.media.image';

export interface CommandArgs {
  fallback?: UserSettingsFallbacksMediaImageTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let text: string = translate('settings_set_fallbacks_media_image.unknown_error_sorry');
  if (args.fallback === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.fallbacks_media_image) {
        case UserSettingsFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES: {
          text = translate('settings_set_fallbacks_media_image.image_manipulation_commands_will_fallback_to_searching');
        }; break;
        case UserSettingsFallbacksMediaImageTypes.IMAGINE: {
          text = translate('settings_set_fallbacks_media_image.image_manipulation_commands_will_fallback_to_generating');
        }; break;
        case UserSettingsFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES: {
          text = translate('settings_set_fallbacks_media_image.image_manipulation_commands_will_fallback_to_searching_2');
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      fallbacksMediaImage: args.fallback,
    });
    switch (settings.fallbacks_media_image) {
      case UserSettingsFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES: {
        text = translate('settings_set_fallbacks_media_image.ok_image_manipulation_commands_will_fallback_to');
      }; break;
      case UserSettingsFallbacksMediaImageTypes.IMAGINE: {
        text = translate('settings_set_fallbacks_media_image.ok_image_manipulation_commands_will_fallback_to_2');
      }; break;
      case UserSettingsFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES: {
        text = translate('settings_set_fallbacks_media_image.ok_image_manipulation_commands_will_fallback_to_3');
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
