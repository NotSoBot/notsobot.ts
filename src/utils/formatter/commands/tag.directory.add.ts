import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { putTagsDirectoryTag } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis, TagDirectoryCategories } from '../../../constants';
import { displayReply } from '../../../utils';


export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export const COMMAND_ID = 'tag.directory.add';

export interface CommandArgsBefore {
  category?: TagDirectoryCategories,
  description?: string,
  tag: false | null | RestResponsesRaw.Tag,
  title?: string,
}

export interface CommandArgs {
  category?: TagDirectoryCategories,
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

  const tagText = Markup.codestring(args.tag.name);

  // the user has to confirm they made the tag's content (or have its owner's permission) before it goes public
  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: async () => {
      try {
        // edits the response for both prefixed commands and interactions
        await displayReply(context, {description: translate('tag_directory_add.canceled_due_to_timeout', {tag: tagText})});
      } catch(e) {

      }
    },
  });

  components.createButton({
    label: translate('tag_directory_add.add'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      let description: string;
      try {
        await putTagsDirectoryTag(context, args.tag.id, {
          category: args.category,
          description: args.description,
          title: args.title,
        });
        description = translate('tag_directory_add.ok_added_tag_to_the_tag_directory', {tag: Markup.codestring(args.tag.id)});
      } catch(error) {
        // already listed (or no longer the user's), show why instead of leaving the buttons up
        const apiError = await getApiError(error);
        if (!apiError) {
          throw error;
        }
        const key = getApiErrorTranslationKey(apiError.code);
        description = `${StatusEmojis.WARNING} ${(key) ? translateMaybe(key, apiError.message) : apiError.message}`;
      }
      await displayReply(context, {description}, {replyTo: ctx});
    },
  });

  components.createButton({
    label: translate('common.cancel'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      await displayReply(context, {description: translate('tag_directory_add.ok_did_not_add', {tag: tagText})}, {replyTo: ctx});
    },
  });

  const description = [
    `${StatusEmojis.WARNING} ${translate('tag_directory_add.confirm', {tag: tagText})}`,
    translate('tag_directory_add.warning_rights'),
  ];
  return displayReply(context, {components, description: description.join('\n')});
}
