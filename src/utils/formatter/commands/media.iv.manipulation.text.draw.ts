import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationTextDraw } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaTextAlignments } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.text.draw';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'drawtext hello there -y h-th-20',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'drawtext img "hello there" Y=h-th-20 SIZE=64',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  align?: MediaTextAlignments,
  background?: string,
  color?: string,
  end?: number,
  font?: string,
  markup?: boolean,
  shadow?: string,
  size?: number,
  start?: number,
  stroke?: string,
  strokewidth?: number,
  text: string,
  url: string,
  width?: number,
  x?: string,
  y?: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationTextDraw(context, {
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
    end: args.end,
    start: args.start,
    url: args.url,
    x: args.x,
    y: args.y,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // a font that isn't bundled is one of their saved fonts, the route loads those (`loadfont`), so that runs as its own job
  if (args.font) {
    return null;
  }
  return Mediascript.line('drawtext', chain.key, Mediascript.encodeValue(args.text), {
    x: args.x,
    y: args.y,
    start: args.start,
    end: args.end,
    size: args.size,
    color: args.color,
    stroke: args.stroke,
    stroke_width: args.strokewidth,
    shadow: args.shadow,
    background: args.background,
    width: args.width,
    align: args.align,
    markup: args.markup || undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
