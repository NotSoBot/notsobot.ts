import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'prism';

export default class PrismCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'angle', aliases: ['a'], type: Number, metadata: {description: '-180 to 180'}},
        {name: 'clockwise', aliases: ['c'], type: Boolean},
        {name: 'repeat', aliases: ['r'], type: Boolean},
        {name: 'still', aliases: ['s'], type: Boolean},
        {name: 'tilt', aliases: ['t'], type: Number, metadata: {description: '0 to 90'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Wrap an Image or Video around a spinning pyramid, like the obama prism',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -repeat`,
          `${COMMAND_NAME} notsobot -still -angle 0`,
          `${COMMAND_NAME} notsobot -tilt 40`,
        ],
        id: Formatter.Commands.MediaIVManipulationPrism.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-angle <number>) (-clockwise) (-repeat) (-still) (-tilt <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPrism.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPrism.createMessage(context, args);
  }
}
