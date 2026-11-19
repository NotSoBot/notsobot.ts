import { Command, Interaction } from 'detritus-client';

import { mediaICreateText } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaTextAlignments } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.text';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'text hello there -font impact -color white -stroke black',
  inputs: [],
  script: [
    'text img "hello there" FONT=impact SIZE=96 COLOR=white STROKE=black',
    'render img image/png',
  ].join('\n'),
};

export interface CommandArgs {
  align?: MediaTextAlignments,
  background?: string,
  color?: string,
  font?: string,
  markup?: boolean,
  shadow?: string,
  size?: number,
  stroke?: string,
  strokewidth?: number,
  text: string,
  width?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaICreateText(context, {
    align: args.align,
    background: args.background,
    color: args.color,
    font: args.font,
    markup: args.markup,
    safe: DefaultParameters.safe(context),
    shadow: args.shadow,
    size: args.size,
    stroke: args.stroke,
    strokeWidth: args.strokewidth,
    text: args.text,
    width: args.width,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
