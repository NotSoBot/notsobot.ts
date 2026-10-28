import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'edges2flesh';

export default class Edges2FleshCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['e2f', 'e2p'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Trace an Image or Video\'s edges and have an AI fill them in with flesh',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationEdges2Flesh.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEdges2Flesh.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdges2Flesh.createMessage(context, args);
  }
}
