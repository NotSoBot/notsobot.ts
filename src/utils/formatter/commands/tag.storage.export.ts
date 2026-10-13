import { Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTagStorage } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayReply, mediaReply } from '../../../utils';


export const COMMAND_ID = 'tag.storage.export';

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  // aliases share the storage of the tag they reference, the api checks this too
  const storageTag = args.tag.reference_tag || args.tag;
  if (!storageTag.user || storageTag.user.id !== context.userId) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_storage_export.only_the_owner_can_export_storage')}`});
  }

  const response = await fetchTagStorage(context, args.tag.id, {
    serverId: context.guildId || context.channelId,
  });
  return mediaReply(context, response, {
    content: translate('tag_storage_export.exported', {name: Markup.codestring(args.tag.name)}),
  });
}
