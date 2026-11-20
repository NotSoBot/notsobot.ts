import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'music identify';

// was `audio identify` (kept as an alias), its id stays `media.av.tools.identify`
export default class MusicIdentifyCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['audio identify', 'a identify'],
      args: [
        {name: 'start', aliases: ['s'], type: Parameters.secondsWithOptions({negatives: true})},
      ],
      metadata: {
        category: CommandCategories.MUSIC,
        description: 'Identify a song in an audio or video file',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
        ],
        id: Formatter.Commands.MediaAVToolsIdentify.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-start <duration>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVToolsIdentify.CommandArgs) {
    return Formatter.Commands.MediaAVToolsIdentify.createMessage(context, args);
  }
}
