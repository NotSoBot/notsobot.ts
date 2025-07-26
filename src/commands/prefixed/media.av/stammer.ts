import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaStammerColorModes, MediaStammerMatcherModes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideosCommand } from '../basecommand';


export const COMMAND_NAME = 'stammer';

export default class StammerCommand extends BaseAudioOrVideosCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['c'], name: 'color', type: Parameters.oneOf({choices: MediaStammerColorModes})},
        {aliases: ['m'], name: 'matcher', type: Parameters.oneOf({choices: MediaStammerMatcherModes})},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Cut up the audio and video frames of a media to match with the modulator\'s audio frames',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/video_file.mp4 https://notsobot.com/some/audio_file.mp3`,
        ],
        id: Formatter.Commands.MediaAVManipulationStammer.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-color <MediaStammerColorModes>) (-matcher <MediaStammerMatcherModes>)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationStammer.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationStammer.createMessage(context, args);
  }
}
