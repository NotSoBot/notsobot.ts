import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'abovehead';

export default class AboveHeadCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['above head', 'overhead', 'headlabel'],
      args: [
        {
          name: 'faces',
          aliases: ['face', 'f'],
          type: Parameters.numbers({max: 99, maxAmount: Formatter.Commands.MediaIVManipulationFaceAbove.MAX_FACES, min: 0}),
          metadata: {description: 'drawfaces numbers of the heads it goes above (like 1,0), every head by default'},
        },
        {name: 'size', aliases: ['s'], type: 'float', metadata: {description: '0.25 to 3, the image\'s size in heads (1 by default)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put an image above people\'s heads in an Image or Video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png @notsobot`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png @notsobot -size 1.5`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 @notsobot -faces 0,2`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceAbove.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <emoji,user:id|mention|name,url> (-faces <numbers>) (-size <float>)',
      },
      maxAmount: 2,
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceAbove.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceAbove.createMessage(context, args);
  }
}
