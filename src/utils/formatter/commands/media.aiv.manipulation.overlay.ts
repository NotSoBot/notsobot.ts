import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationOverlay } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import type { OverlayPosition } from '../../parameters';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.tools.overlay';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'overlay -opacity 50',
  inputs: ['face', 'b1'],
  script: [
    'load FILE_1 img',
    'load FILE_2 other',
    'overlay img other 0 0 none 0.1 0 true 50',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  blend?: number,
  color?: string,
  noloop?: boolean,
  opacity?: number,
  position?: OverlayPosition,
  resize?: string,
  similarity?: number,
  urls: Array<string>,
  x?: string,
  y?: string,
}

// the endpoint's defaults, mediascript's `overlay` keeps its own (top left, its own size) for scripts
export const DEFAULT_X = '(mw / 2) - (ow / 2)';
export const DEFAULT_Y = '(mh / 2) - (oh / 2)';
export const DEFAULT_RESIZE = 'fit(mw, mh)';

// `-position` as the x/y/resize expressions the endpoint already takes: fitted into its cell and centred there
// (the cell's centre minus half the overlay). An explicit `-x`, `-y` or `-resize` still wins
export function positionExpressions(args: CommandArgs): {resize?: string, x?: string, y?: string} {
  if (!args.position) {
    return {resize: args.resize, x: args.x, y: args.y};
  }
  const {cell, columns, rows} = args.position;
  const column = (cell - 1) % columns;
  const row = Math.floor((cell - 1) / columns);
  return {
    resize: args.resize || `fit(mw / ${columns}, mh / ${rows})`,
    x: args.x || `(mw * ${column * 2 + 1} / ${columns * 2}) - (ow / 2)`,
    y: args.y || `(mh * ${row * 2 + 1} / ${rows * 2}) - (oh / 2)`,
  };
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { position, ...rest } = args;
  return mediaAIVManipulationOverlay(context, {
    safe: DefaultParameters.safe(context),
    ...rest,
    ...positionExpressions(args),
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  const { resize, x, y } = positionExpressions(args);
  const overlay = chain.load(args.urls[1]);
  return Mediascript.line('overlay', chain.key, overlay, {
    x: x || DEFAULT_X,
    y: y || DEFAULT_Y,
    color: args.color,
    similarity: args.similarity,
    blend: args.blend,
    loop: (args.noloop) ? false : undefined,
    opacity: args.opacity,
    resize: resize || DEFAULT_RESIZE,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
