import { Command, Interaction } from 'detritus-client';

import { utilitiesFetchMedia, utilitiesMLMashup } from '../../../api';
import { EmojiKitchen, jobWaitForResult, mediaReply } from '../../../utils';


export const COMMAND_ID = 'tools.ml.mashup';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  model?: string,
  safe?: boolean,
  seed?: number,
  steps?: number,
  strength?: number,
  urls: Array<string>,
}

export async function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  if (args.urls && args.urls.length === 2 && !args.model) {
    // compare it to notsobot.com's emojis
    const codepoints = args.urls.map((x) => {
      return EmojiKitchen.twemojiUrlToCodepoint(x) || '';
    }).filter((x) => x);
    if (codepoints.length === 2) {
      const mashupUrl = EmojiKitchen.codepointsToUrl(codepoints[0], codepoints[1]);
      if (mashupUrl) {
        // download it
        return utilitiesFetchMedia(context, {url: mashupUrl});
      }
    }
  }
  const job = await utilitiesMLMashup(context, args).then((x) => jobWaitForResult(context, x));
  if (job.result.error) {
    throw new Error(`**Mashup Error**: ${job.result.error}`);
  }
  if (!job.result.response) {
    throw new Error('Mashup did not return a response (Should not happen, report this)');
  }
  return job.result.response;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
