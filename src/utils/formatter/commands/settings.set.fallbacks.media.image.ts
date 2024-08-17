import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';

import { editUserSettings } from '../../../api';
import { UserFallbacksMediaImageTypes } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.fallbacks.media.image';

export interface CommandArgs {
  fallback?: UserFallbacksMediaImageTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  let text: string = 'Unknown Error, Sorry';
  if (args.fallback === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.fallbacks_media_image) {
        case UserFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES: {
          text = 'Image Manipulation Commands will fallback to searching Google Images';
        }; break;
        case UserFallbacksMediaImageTypes.IMAGINE: {
          text = 'Image Manipulation Commands will fallback to generating an Image';
        }; break;
        case UserFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES: {
          text = 'Image Manipulation Commands will fallback to searching Duck Duck Go Images';
        }; break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {
      fallbacksMediaImage: args.fallback,
    });
    switch (settings.fallbacks_media_image) {
      case UserFallbacksMediaImageTypes.SEARCH_GOOGLE_IMAGES: {
        text = 'Ok, Image Manipulation Commands will fallback to searching Google Images now';
      }; break;
      case UserFallbacksMediaImageTypes.IMAGINE: {
        text = 'Ok, Image Manipulation Commands will fallback to generating an Image now';
      }; break;
      case UserFallbacksMediaImageTypes.SEARCH_DUCK_DUCK_GO_IMAGES: {
        text = 'Ok, Image Manipulation Commands will fallback to searching Duck Duck Go Images now';
      }; break;
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
