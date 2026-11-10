import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationVeg } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.veg';

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 1280x720, scaled back to the clip's size
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'veg',
  inputs: ['video', 'preview1280'],
  script: [
    'load FILE_1 clip',
    'loadveg FILE_2 p1280',
    'vegrender clip p1280',
    'resize clip 640 360',
    'render clip',
  ].join('\n'),
};

// the medias after the first that can share the project's sources (the api's `MAX_MEDIASCRIPT_VEG_MEDIAS` - 1)
export const MAX_EXTRA_MEDIAS = 3;

export interface CommandArgs {
  // more medias for the project's other sources: its first source (as they first play) becomes `url`, the second
  // `also[0]` and so on, round again when there are more sources than medias
  also?: Array<string>,
  cutoff?: boolean,
  url: string,
  // the .veg project's url, every one of its sources becomes `url` (or one of `also`)
  veg: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationVeg(context, {
    cutoff: args.cutoff,
    extraUrls: (args.also || []).slice(0, MAX_EXTRA_MEDIAS),
    safe: DefaultParameters.safe(context),
    url: args.url,
    vegUrl: args.veg,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
