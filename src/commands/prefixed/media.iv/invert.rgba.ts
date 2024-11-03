import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'invertrgba';

export default class InvertRGBACommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Invert each individual channel with 1, or ignore with 0',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 0 1 0`,
        ],
        id: Formatter.Commands.MediaIVManipulationInvertRGBA.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<red:number> ?<green:number> ?<blue:number> ?<alpha:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'red'},
        {name: 'green'},
        {name: 'blue'},
        {name: 'alpha', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationInvertRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInvertRGBA.createMessage(context, args);
  }
}
