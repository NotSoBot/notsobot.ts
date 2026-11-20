import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import { editGuildSettings } from '../../../api';
import { PostGalleryTypes } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'server.set.post.gallery';

export interface CommandArgs {
  clear?: boolean,
  type?: PostGalleryTypes | null,
}

// how a post with more than one media shows for members without their own setting: a gallery of up to ten, or one per
// page. cleared, a gallery. auto-embeds have their own in `server set auto-embed`
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  if (args.clear) {
    args.type = null;
  }

  let text: string = translate('settings_server_set_post_gallery.unknown_error');
  if (args.type === undefined) {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (guildSettings) {
      switch (guildSettings.settings.postGallery) {
        case PostGalleryTypes.GALLERY: text = translate('settings_server_set_post_gallery.gallery'); break;
        case PostGalleryTypes.PAGES: text = translate('settings_server_set_post_gallery.pages'); break;
        default: text = translate('settings_server_set_post_gallery.none'); break;
      }
    }
  } else {
    const { settings } = await editGuildSettings(context, context.guildId!, {postGallery: args.type});
    switch (settings.postGallery) {
      case PostGalleryTypes.GALLERY: text = translate('settings_server_set_post_gallery.updated_gallery'); break;
      case PostGalleryTypes.PAGES: text = translate('settings_server_set_post_gallery.updated_pages'); break;
      default: text = translate('settings_server_set_post_gallery.cleared'); break;
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
