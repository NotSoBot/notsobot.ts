import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'ripple';

export default class RippleCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amplitude', type: Number},
        {aliases: ['o'], name: 'offset', type: Number},
        {aliases: ['p'], name: 'power', type: 'float'},
        {aliases: ['r'], name: 'rmin', type: Number},
        {aliases: ['w'], name: 'width', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply a Ripple effect on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -amplitude 10`,
        ],
        id: Formatter.Commands.MediaIVManipulationRipple.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amplitude <number>) (-offset <number>) (-power <float>) (-rmin <number>) (-width <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationRipple.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRipple.createMessage(context, args);
  }
}
