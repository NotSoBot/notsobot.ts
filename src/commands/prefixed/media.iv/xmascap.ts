import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceXmasCapColors } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'xmascap';

export default class XmascapCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['santahat'],
      args: [
        {name: 'color', aliases: ['c'], type: Parameters.oneOf({choices: MediaFaceXmasCapColors})},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put a Santa hat on every face in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -color blue`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceXmasCap.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-color <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceXmasCap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceXmasCap.createMessage(context, args);
  }
}
