import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay zuckerberg';

export default class OverlayZuckerbergCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o zuckerberg', 'zuckerberg'],
      metadata: {
        description: 'Make an Image or Video a Facebook post by Mark Zuckerberg',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsZuckerberg1.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsZuckerberg1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsZuckerberg1.createMessage(context, args);
  }
}
