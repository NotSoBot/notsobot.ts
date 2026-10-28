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
        // the api reads `colorMode`/`matcherMode` (same labels as the slash command), they were ignored as `color`/`matcher`
        {aliases: ['c'], label: 'colorMode', name: 'color', type: Parameters.oneOf({choices: MediaStammerColorModes})},
        {aliases: ['m'], label: 'matcherMode', name: 'matcher', type: Parameters.oneOf({choices: MediaStammerMatcherModes})},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Rebuild the second media\'s audio out of tiny pieces of the first one\'s audio and video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 https://cdn.nsb.gg/assets/samples/music.mp3`,
        ],
        id: Formatter.Commands.MediaAVManipulationStammer.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-color <choice>) (-matcher <choice>)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVManipulationStammer.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationStammer.createMessage(context, args);
  }
}
