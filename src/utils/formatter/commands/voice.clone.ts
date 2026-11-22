import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { createVoiceClone } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { Confirmer } from '../../confirmer';
import { Translator, getTranslator } from '../../i18n';
import { DiscordEmojis, StatusEmojis } from '../../../constants';

import { replyError } from '../../../commands/errors';
import { displayReply, slashCommandMention } from '../../../utils';

import { VoiceClonePlatformTypes, VoiceClonePlatforms, serverVoicesProblem, voiceCloneAccessProblem } from './voice.list';


export const MAX_TIME_TO_RESPOND = 2 * 60 * 1000;


export const COMMAND_ID = 'voice.clone';


// after a clone or an added clip: when the voice's clips kept less speech than its platform wants (the api trims everything
// that isn't talking), say how much and where to add more, a too-short clone sounding off otherwise reads as a bug
export function shortSpeechNote(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  voice: RestResponsesRaw.VoiceCloneSpeech,
  server: boolean,
): null | string {
  if (!(voice.speech_duration < voice.speech_recommended)) {
    return null;
  }
  const seconds = (ms: number) => (ms / 1000).toLocaleString(translator.language, {maximumFractionDigits: 1});
  return translator.translate('voice_clone.short_speech', {
    command: slashCommandMention(context, (server) ? 'tts voice-server sample' : 'tts voice sample'),
    recommended: seconds(voice.speech_recommended),
    seconds: seconds(voice.speech_duration),
  });
}

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
  const translator = await getTranslator(context);
  const { language, translate, translateMaybe } = translator;

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
  const confirmer = new Confirmer(context);
  const components = new Components({
    timeout: MAX_TIME_TO_RESPOND,
    onTimeout: () => confirmer.expire(async () => {
      try {
        // edits the response for both prefixed commands and interactions
        await displayReply(context, {description: translate('voice_clone.canceled_due_to_timeout')});
      } catch(e) {

      }
    }),
  });

  components.createButton({
    label: translate('voice_clone.clone'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      return confirmer.run(ctx, async () => {
        // the upload takes a while, say so and drop the buttons
        await displayReply(context, {description: `${translate('voice_clone.uploading')} ${DiscordEmojis.TYPING}`}, {replyTo: ctx});

        let description: string;
        try {
          const voice = await createVoiceClone(context, {...args, type: platformType});
          description = translate('voice_clone.cloned_voice_successfully', {name: Markup.codestring(voice.name)});
          const note = shortSpeechNote(context, translator, voice, !!args.server);
          if (note) {
            description += `\n${note}`;
          }
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
      });
    },
  });

  components.createButton({
    label: translate('common.cancel'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      return confirmer.cancel(ctx, async () => {
        await displayReply(context, {description: translate('voice_clone.ok_did_not_clone')}, {replyTo: ctx});
      });
    },
  });

  const description = [
    `${StatusEmojis.WARNING} ${translate('voice_clone.confirm')}`,
    translate('voice_clone.tip'),
    translate('voice_clone.warning_rights'),
  ];
  return displayReply(context, {components, description: description.join('\n')});
}
