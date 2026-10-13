import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { putTagsDirectoryTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'tag.directory.add';

export interface CommandArgsBefore {
  description?: string,
  tag: false | null | RestResponsesRaw.Tag,
  title?: string,
}

export interface CommandArgs {
  description?: string,
  tag: RestResponsesRaw.Tag,
  title?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  if (args.tag.is_on_directory) {
    // todo: get rid of this and instead add an update message
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_directory_add.tag_is_already_on_directory')}`})
  }

  const directory = await putTagsDirectoryTag(context, args.tag.id, {
    description: args.description,
    title: args.title,
  });

  return displayReply(context, {description: translate('tag_directory_add.ok_added_tag_to_the_tag_directory', {tag: Markup.codestring(args.tag.id)})});
}
