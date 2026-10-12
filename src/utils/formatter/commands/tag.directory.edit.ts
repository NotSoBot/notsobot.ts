import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag, editTagsDirectoryTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tag.directory.edit';

export interface CommandArgsBefore {
  content?: string,
  description?: string,
  tag: false | null | RestResponsesRaw.Tag,
  title?: string,
}

export interface CommandArgs {
  content?: string,
  description?: string,
  tag: RestResponsesRaw.Tag,
  title?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const description: Array<string> = ['Ok, updated'];
  if (args.content) {
    if (args.content === args.tag.content) {
      description.push(translate('tag_directory_edit.tag_already_has_that_content'));
    } else {
      description.push(translate('tag_directory_edit.tag_s_content_has_been_updated'));
      await editTag(context, args.tag.id, {content: args.content});
    }
  }

  if (args.description || args.title) {
    // just force update it
    const directory = await editTagsDirectoryTag(context, args.tag.id, {
      description: args.description,
      title: args.title,
    });
    if (args.title) {
      description.push(translate('tag_directory_edit.tag_s_directory_title_has_been_updated'));
    }
    if (args.description) {
      description.push(translate('tag_directory_edit.tag_s_directory_description_has_been_updated'));
    }
  }

  return editOrReply(context, description.join('\n'));
}
