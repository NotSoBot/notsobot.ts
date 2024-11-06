import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaDistortMethods } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'distort';

export default class DistortCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Use ImageMagick\'s Distort Operation on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot perspective 7 40 4 30 4 124 4 123 85 122 100 123 85 2 100 30`,
        ],
        id: Formatter.Commands.MediaIVManipulationDistort.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<red:number> ?<green:number> ?<blue:number> ?<alpha:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'method', type: Parameters.oneOf({choices: MediaDistortMethods})},
        {name: 'arguments', type: Parameters.arrayOfFloats, consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDistort.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDistort.createMessage(context, args);
  }
}
