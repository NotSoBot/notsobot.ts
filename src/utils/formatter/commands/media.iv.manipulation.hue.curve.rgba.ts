import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueCurveRGBA } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';;
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.hue.curve.rgba';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'huecurvergba -red 0,1 1,1',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'huecurvergba img red 0,1 1,1',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  all?: Array<[number, number]>,
  alpha?: Array<[number, number]>,
  blue?: Array<[number, number]>,
  green?: Array<[number, number]>,
  red?: Array<[number, number]>,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueCurveRGBA(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  const curve = (channel: string, points: Array<[number, number]>) => {
    return Mediascript.line('huecurvergba', chain.key, channel, ...points.map(([x, y]) => `${x},${y}`));
  };
  const given = (points?: Array<[number, number]>) => !!(points && points.length);

  // the route does every channel in one pass, red/green/blue without their own curve use `all`'s. a line here is
  // one channel, so with `all` and any of those the three each get their own (or `all`'s) curve
  const lines: Array<string> = [];
  const rgb = [['red', args.red], ['green', args.green], ['blue', args.blue]] as const;
  if (given(args.all) && rgb.some(([_, points]) => given(points))) {
    for (let [channel, points] of rgb) {
      lines.push(curve(channel, given(points) ? points! : args.all!));
    }
  } else {
    if (given(args.all)) {
      lines.push(curve('all', args.all!));
    }
    for (let [channel, points] of rgb) {
      if (given(points)) {
        lines.push(curve(channel, points!));
      }
    }
  }
  if (given(args.alpha)) {
    lines.push(curve('alpha', args.alpha!));
  }
  // the action needs a curve, without any the route changes nothing
  return (lines.length) ? lines : null;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
