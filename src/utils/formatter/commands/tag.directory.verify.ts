import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { createTagsDirectoryTagVerification, deleteTagsDirectoryTagVerification } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import { StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';


export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export const COMMAND_ID = 'tag.directory.verify';

export interface CommandArgsBefore {
  cancel?: boolean,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  cancel?: boolean,
  tag: RestResponsesRaw.Tag,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate, translateMaybe } = await getTranslator(context);
  const tagText = Markup.codestring(args.tag.name);

  if (args.cancel) {
    // the api errors if it isn't pending (or is already verified), the command error handler translates those
    await deleteTagsDirectoryTagVerification(context, args.tag.id);
    return displayReply(context, {description: translate('tag_directory_verify.ok_canceled_pending_request', {tag: tagText})});
  }

  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: async () => {
      try {
        // edits the response for both prefixed commands and interactions
        await displayReply(context, {description: translate('tag_directory_verify.canceled_due_to_timeout', {tag: tagText})});
      } catch(e) {

      }
    },
  });

  components.createButton({
    label: translate('tag_directory_verify.request'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      let description: string;
      try {
        await createTagsDirectoryTagVerification(context, args.tag.id);
        description = translate('tag_directory_verify.ok_requested', {tag: tagText});
      } catch(error) {
        // already pending/verified (or no longer on the directory), show why instead of leaving the buttons up
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
    label: translate('tag_directory_verify.cancel'),
    style: MessageComponentButtonStyles.DANGER,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      await displayReply(context, {description: translate('tag_directory_verify.ok_did_not_request', {tag: tagText})}, {replyTo: ctx});
    },
  });

  const description = [
    `${StatusEmojis.WARNING} ${translate('tag_directory_verify.confirm_request', {tag: tagText})}`,
    translate('tag_directory_verify.warning_rights'),
    translate('tag_directory_verify.warning_locks'),
    translate('tag_directory_verify.warning_staff'),
    translate('tag_directory_verify.benefit_premium'),
    translate('tag_directory_verify.warning_cancel', {command: Markup.codestring('/tag directory verify cancel: True')}),
  ];
  return displayReply(context, {components, description: description.join('\n')});
}
