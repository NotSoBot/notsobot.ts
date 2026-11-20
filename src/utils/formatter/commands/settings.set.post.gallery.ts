import { Command, Interaction } from 'detritus-client';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { PostGalleryTypes } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.post.gallery';

export interface CommandArgs {
  clear?: boolean,
  type?: PostGalleryTypes | null,
}

// how a post with more than one media shows for them (`.embed`, `.download`, auto-embeds of their links): a gallery of
// up to ten, or one per page. cleared, it follows the server's, then a gallery
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  if (args.clear) {
    args.type = null;
  }

  let text: string = translate('settings_set_post_gallery.unknown_error');
  if (args.type === undefined) {
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (settings) {
      switch (settings.post_gallery) {
        case PostGalleryTypes.GALLERY: text = translate('settings_set_post_gallery.gallery'); break;
        case PostGalleryTypes.PAGES: text = translate('settings_set_post_gallery.pages'); break;
        default: text = translate('settings_set_post_gallery.none'); break;
      }
    }
  } else {
    const settings = await editUserSettings(context, context.userId, {postGallery: args.type});
    UserSettingsStore.insert(context.userId, settings);
    switch (settings.post_gallery) {
      case PostGalleryTypes.GALLERY: text = translate('settings_set_post_gallery.updated_gallery'); break;
      case PostGalleryTypes.PAGES: text = translate('settings_set_post_gallery.updated_pages'); break;
      default: text = translate('settings_set_post_gallery.cleared'); break;
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
