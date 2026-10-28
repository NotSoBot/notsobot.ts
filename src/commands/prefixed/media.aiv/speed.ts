import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'speed';

export default class SpeedCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Edit an Animated Image/Audio/Video\'s Speed',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg 0.5`,
        ],
        id: Formatter.Commands.MediaAIVManipulationSpeed.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<speed multiplier:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'speed', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationSpeed.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSpeed.createMessage(context, args);
  }
}
