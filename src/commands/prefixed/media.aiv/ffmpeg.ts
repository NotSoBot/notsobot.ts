import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'ffmpeg';

export default class FFMPEGCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Run your own ffmpeg filters and options on a Media, like mediascript\'s ffmpeg',
        examples: [
          `${COMMAND_NAME} -vf negate`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -vf "hue=h=90" -af "volume=2"`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -af "aecho=0.8:0.9:500:0.3"`,
        ],
        id: Formatter.Commands.MediaAIVToolsFFMPEG.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <...ffmpeg options>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'options', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaAIVToolsFFMPEG.CommandArgs) {
    return !!args.options && super.onBeforeRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsFFMPEG.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsFFMPEG.createMessage(context, args);
  }
}
