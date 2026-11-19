import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'skew';

export default class SkewCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['shear'],

      args: [
        {name: 'vertical', aliases: ['v'], type: Boolean, metadata: {description: 'slant it up and down instead of sideways'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Slant an Image or Video sideways (or up and down) by some degrees',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} -20`,
          `${COMMAND_NAME} 45 -vertical`,
        ],
        id: Formatter.Commands.MediaIVManipulationSkew.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<degrees:float> (-vertical)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'amount', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSkew.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSkew.createMessage(context, args);
  }
}
