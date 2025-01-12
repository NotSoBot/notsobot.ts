import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'grain';

export default class GrainCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'flags', aliases: ['f']},
        {name: 'strength', aliases: ['s'], type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply a Film Grain effect to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -strength 100 -flags aptu`,
        ],
        id: Formatter.Commands.MediaIVManipulationGrain.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-flags <FFMPEGNoiseFlags>) (-strength <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationGrain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGrain.createMessage(context, args);
  }
}
