import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { createVoiceClone } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { getTranslator } from '../../i18n';
import { DiscordEmojis, StatusEmojis } from '../../../constants';

import { replyError } from '../../../commands/errors';
import { displayReply } from '../../../utils';

import { VoiceClonePlatformTypes, VoiceClonePlatforms, serverVoicesProblem, voiceCloneAccessProblem } from './voice.list';


export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export const COMMAND_ID = 'voice.clone';

export interface CommandArgs {
  name?: string,
  // ZONOS3 (our own servers, free) when left out, fish.audio needs plus or NotSoCredits and its tts spends them
  platform?: null | VoiceClonePlatforms,
  // the server it's used in gets the voice instead (needs Manage Server). Anyone can clone a few with ZONOS3 (free), the
  // api's limits grow with premium
  server?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  if (args.server) {
    const problem = serverVoicesProblem(context, true);
    if (problem) {
      return displayReply(context, {description: translate(problem)});
    }
  }
  const platformType = VoiceClonePlatformTypes[args.platform || VoiceClonePlatforms.ZONOS3];
  // fish.audio needs plus or NotSoCredits, checked before they confirm instead of after
  const accessProblem = await voiceCloneAccessProblem(context, !!args.server, platformType);
  if (accessProblem) {
    return replyError(context, accessProblem);
  }

  // the user has to confirm they own the voice (or have its owner's permission) before the audio is cloned
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
        const voice = await createVoiceClone(context, {...args, type: platformType});
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
    style: MessageComponentButtonStyles.SECONDARY,
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
