import { Command, Interaction } from 'detritus-client';

import { utilitiesMLImagine, utilitiesMLInterrogate } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'tools.ml.reimagine';

export interface CommandArgs {
  add?: string,
  model?: string,
  query: string,
  safe?: boolean,
  seed?: number,
  steps?: number,
  url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let { prompt } = await utilitiesMLInterrogate(context, {url: args.url});
  if (args.add) {
    prompt = `${prompt}, ${args.add}`;
  }
  const response = await utilitiesMLImagine(context, {
    model: args.model,
    query: prompt,
    safe: args.safe,
    seed: args.seed,
    steps: args.steps,
  });
  return imageReply(context, response);
}
