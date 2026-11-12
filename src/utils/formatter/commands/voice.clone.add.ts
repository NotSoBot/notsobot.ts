import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { voiceCloneAdd } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { replyError } from '../../../commands/errors';
import { getTranslator } from '../../i18n';
import { DiscordEmojis, StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';

import { MAX_TIME_TO_RESPOND } from './voice.clone';
import { fetchVoices, findVoice, serverVoicesProblem, voiceCloneAccessProblem } from './voice.list';


export const COMMAND_ID = 'voice.clone.add';

export interface CommandArgs {
  // one of the server's voices instead of the user's (needs Manage Server)
  server?: boolean,
  url: string,
  voice: string,
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
  // plus or NotSoCredits, checked before they confirm instead of after
  const accessProblem = await voiceCloneAccessProblem(context, !!args.server);
  if (accessProblem) {
    return replyError(context, accessProblem);
  }

  const { limit, voices } = await fetchVoices(context, args.server);
  if (!voices.length) {
    if (args.server) {
      return displayReply(context, {description: translate('voice_server.no_voices', {max: limit ?? 0})});
    }
    return displayReply(context, {description: translate('voice_clone_add.you_have_no_cloned_voices')});
  }

  const result = findVoice(voices, args.voice);
  if (!result) {
    return displayReply(context, {description: translate('voice_clone_add.no_cloned_voices_found_matching_that')});
  }

  const voiceText = Markup.codestring(result.name);

  // same confirmation as `tts voice create`, the new audio is sent to elevenlabs too
  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: async () => {
      try {
        // edits the response for both prefixed commands and interactions
        await displayReply(context, {description: translate('voice_clone_add.canceled_due_to_timeout', {name: voiceText})});
      } catch(e) {

      }
    },
  });

  components.createButton({
    label: translate('voice_clone_add.add'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      // the upload takes longer than discord's 3 seconds to answer a click, answer it now and drop the buttons
      await displayReply(context, {description: `${translate('voice_clone.uploading')} ${DiscordEmojis.TYPING}`}, {replyTo: ctx});

      let description: string;
      try {
        const voice = await voiceCloneAdd(context, result.id, args);
        description = translate('voice_clone_add.successfully_added_another_audio_file_to_voice', {name: Markup.codestring(voice.name)});
      } catch(error) {
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

      await displayReply(context, {description: translate('voice_clone_add.ok_did_not_add', {name: voiceText})}, {replyTo: ctx});
    },
  });

  const description = [
    `${StatusEmojis.WARNING} ${translate('voice_clone_add.confirm', {name: voiceText})}`,
    translate('voice_clone.warning_rights'),
  ];
  return displayReply(context, {components, description: description.join('\n')});
}
