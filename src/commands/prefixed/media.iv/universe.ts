import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'universe';

export default class UniverseCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['uni'],
      args: [
        {aliases: ['b', 'space'], label: 'space', name: 'background', type: Number, metadata: {description: '1 to 4'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Blend an Image or Video into outer space',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -background 3`,
        ],
        id: Formatter.Commands.MediaIVManipulationUniverse.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-background <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationUniverse.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUniverse.createMessage(context, args);
  }
}
