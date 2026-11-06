import { Command, Interaction } from 'detritus-client';

import { utilitiesScreenshot } from '../../../api';
import { ScreenshotBrowsers } from '../../../constants';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'tools.screenshot';

export interface CommandArgs {
  browser?: ScreenshotBrowsers | null,
  height?: number,
  lightmode?: boolean,
  timeout?: number,
  url: string,
  wait?: number,
  width?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesScreenshot(context, {
    browser: args.browser || undefined,
    darkmode: !args.lightmode,
    height: args.height,
    safe: DefaultParameters.safe(context),
    timeout: args.timeout,
    url: args.url,
    wait: args.wait,
    width: args.width,
  });
  return mediaReply(context, response);
}
