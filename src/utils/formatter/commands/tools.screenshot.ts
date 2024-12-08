import { Command, Interaction } from 'detritus-client';

import { utilitiesScreenshot } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'tools.screenshot';

export interface CommandArgs {
  height?: number,
  lightmode?: boolean,
  safe?: boolean,
  timeout?: number,
  url: string,
  width?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesScreenshot(context, {
    darkmode: !args.lightmode,
    height: args.height,
    safe: args.safe,
    timeout: args.timeout,
    url: args.url,
    width: args.width,
  });
  return mediaReply(context, response);
}
