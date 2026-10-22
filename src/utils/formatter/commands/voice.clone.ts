import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { createVoiceClone } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { getTranslator } from '../../i18n';
import { DiscordEmojis, StatusEmojis } from '../../../constants';

import { displayReply } from '../../../utils';


export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export const COMMAND_ID = 'voice.clone';

export interface CommandArgs {
  name?: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  // the user has to confirm they own the voice (or have its owner's permission) before the audio goes to elevenlabs
  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: async () => {
      try {
        // edits the response for both prefixed commands and interactions
        await displayReply(context, {description: translate('voice_clone.canceled_due_to_timeout')});
      } catch(e) {

      }
    },
  });

  components.createButton({
    label: translate('voice_clone.clone'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      // the upload takes longer than discord's 3 seconds to answer a click, answer it now and drop the buttons
      await displayReply(context, {description: `${translate('voice_clone.uploading')} ${DiscordEmojis.TYPING}`}, {replyTo: ctx});

      let description: string;
      try {
        const voice = await createVoiceClone(context, args);
        description = translate('voice_clone.cloned_voice_successfully', {name: Markup.codestring(voice.name)});
      } catch(error) {
        // max clones reached or an unsupported file, show why instead of leaving the buttons up
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

      await displayReply(context, {description: translate('voice_clone.ok_did_not_clone')}, {replyTo: ctx});
    },
  });

  const description = [
    `${StatusEmojis.WARNING} ${translate('voice_clone.confirm')}`,
    translate('voice_clone.warning_rights'),
  ];
  return displayReply(context, {components, description: description.join('\n')});
}
