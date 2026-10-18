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
        {aliases: ['a'], name: 'amount', type: Number, metadata: {description: '0 to 100'}},
        {aliases: ['l'], name: 'levels', type: Number, metadata: {description: '2 to 16'}},
        {aliases: ['s'], name: 'seed', type: Number, metadata: {description: '0 to 2147483647'}},
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
