import { Command, Interaction } from 'detritus-client';

import { mediaICreateLucia, mediaICreateLuciaPortrait } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply, mediaReply } from '../../../utils';

import { createMentionsReplacer } from './fun.quote';


export const COMMAND_ID = 'media.i.create.lucia';

// the api's limits
export const MAX_TEXT_LENGTH = 200;
export const MAX_TITLE_LENGTH = 50;
export const MAX_NAME_LENGTH = 32;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'lucia Hop on Deadlock',
  inputs: [],
  script: [
    'lucia img Hop on Deadlock',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  // who "will appreciate this" (Default: Lucia)
  name?: string,
  // an image or video for the portrait (Lucia's without one), one that moves makes the card move
  portrait?: null | string,
  text: string,
  // the headline (Default: PLAY WITH <name>)
  title?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // it's drawn, a mention has to be the name it shows as: `<@123>` is `@name`, and just `name` as who will appreciate
  // it. A name can be longer than its mention was, so the limits are applied again after
  const replaceMentions = await createMentionsReplacer(context, [args.text, args.title || '', args.name || '']);
  const options: RestOptions.MediaICreateLucia = {
    name: replaceMentions(args.name || '', true).slice(0, MAX_NAME_LENGTH) || undefined,
    safe: DefaultParameters.safe(context),
    text: replaceMentions(args.text).slice(0, MAX_TEXT_LENGTH),
    title: replaceMentions(args.title || '').slice(0, MAX_TITLE_LENGTH) || undefined,
  };
  if (args.portrait) {
    // a job, a gif or video portrait renders every frame of the card
    const job = await mediaICreateLuciaPortrait(context, {...options, url: args.portrait});
    return jobReply(context, job);
  }
  const response = await mediaICreateLucia(context, options);
  return mediaReply(context, response);
}
