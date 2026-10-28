import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'invertlab';

export default class InvertLABCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Invert an Image or Video\'s CIELAB channels one by one, 1 inverts and 0 keeps (lightness flips light and dark keeping the colors, a swaps green and red, b swaps blue and yellow)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 1 0 0`,
        ],
        id: Formatter.Commands.MediaIVManipulationInvertLAB.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<lightness:number> ?<a:number> ?<b:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'lightness'},
        {name: 'a'},
        {name: 'b', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationInvertLAB.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInvertLAB.createMessage(context, args);
  }
}
