import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editTag, editTagsDirectoryTag } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis, TagDirectoryCategories } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'tag.directory.edit';

export interface CommandArgsBefore {
  category?: TagDirectoryCategories,
  content?: string,
  description?: string,
  showContent?: boolean,
  tag: false | null | RestResponsesRaw.Tag,
  title?: string,
}

export interface CommandArgs {
  category?: TagDirectoryCategories,
  content?: string,
  description?: string,
  showContent?: boolean,
  tag: RestResponsesRaw.Tag,
  title?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const description: Array<string> = ['Ok, updated'];
  if (args.content) {
    if (args.content === args.tag.content) {
      description.push(translate('tag_directory_edit.tag_already_has_that_content'));
    } else {
      description.push(translate('tag_directory_edit.tag_s_content_has_been_updated'));
      await editTag(context, args.tag.id, {content: args.content});
    }
  }

  if (args.description || args.title || typeof(args.category) === 'number' || typeof(args.showContent) === 'boolean') {
    // just force update it
    const directory = await editTagsDirectoryTag(context, args.tag.id, {
      category: args.category,
      contentPublic: args.showContent,
      description: args.description,
      title: args.title,
    });
    if (typeof(args.showContent) === 'boolean') {
      description.push(translate((directory.content_public) ? 'tag_directory_edit.tag_s_content_is_now_public' : 'tag_directory_edit.tag_s_content_is_now_hidden'));
    }
    if (args.title) {
      description.push(translate('tag_directory_edit.tag_s_directory_title_has_been_updated'));
    }
    if (args.description) {
      description.push(translate('tag_directory_edit.tag_s_directory_description_has_been_updated'));
    }
    if (typeof(args.category) === 'number') {
      const key = (TagDirectoryCategories[directory.category] || TagDirectoryCategories[TagDirectoryCategories.OTHER]).toLowerCase();
      const category = translateMaybe(`choices.tag_directory_categories.${key}`, key);
      description.push(translate('tag_directory_edit.tag_s_directory_category_is_now', {category: Markup.bold(category)}));
    }
  }

  return displayReply(context, {description: description.join('\n')});
}
