import { Command, Interaction } from 'detritus-client';
import { Markup, intToHex } from 'detritus-client/lib/utils';

import { mediaIVManipulationColorRemove } from '../../../api';
import { getTranslator } from '../../i18n';
import { DefaultParameters, jobReply } from '../../../utils';

import * as ToolsColor from './tools.color';


export const COMMAND_ID = 'media.iv.tools.color.remove';
export const IS_PIPEABLE = true;

// percentages, ffmpeg's colorkey similarity is 0.01 to 1
export const DEFAULT_THRESHOLD = 10;
export const MAX_THRESHOLD = 100;
export const MIN_THRESHOLD = 1;


export interface CommandArgs {
  // anything `.color` takes, the most used color of the first frame when empty
  color?: string,
  threshold?: number,
  url: string,
}

export async function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let color: string | undefined;
  if (args.color && args.color.trim()) {
    const value = ToolsColor.parseColor(args.color);
    if (value === null) {
      const { translate } = await getTranslator(context);
      throw new Error(translate('tools_color.unknown_color', {color: Markup.codestring(args.color.slice(0, 64))}));
    }
    color = intToHex(value, true);
  }

  const threshold = Math.min(Math.max(args.threshold ?? DEFAULT_THRESHOLD, MIN_THRESHOLD), MAX_THRESHOLD);
  return mediaIVManipulationColorRemove(context, {
    color,
    safe: DefaultParameters.safe(context),
    similarity: threshold / 100,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
