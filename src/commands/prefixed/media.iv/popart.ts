import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'popart';

export default class PopArtCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['pop'],
      args: [
        {aliases: ['g'], name: 'grid', type: Number, metadata: {description: '2 or 3'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Turn an Image or Video into a 2x2 Warhol style pop art grid',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -grid 3`,
        ],
        id: Formatter.Commands.MediaIVManipulationPopArt.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-grid <2|3>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationPopArt.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPopArt.createMessage(context, args);
  }
}
