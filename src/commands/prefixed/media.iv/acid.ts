import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'acid';

export default class AcidCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amount', type: Number},
        {aliases: ['l'], name: 'levels', type: Number},
        {aliases: ['s'], name: 'seed', type: Number},
      ],
      metadata: {
        description: 'Scramble the color palette of an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -amount 50`,
          `${COMMAND_NAME} notsobot -levels 4`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationAcid.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-levels <number>) (-seed <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationAcid.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationAcid.createMessage(context, args);
  }
}
