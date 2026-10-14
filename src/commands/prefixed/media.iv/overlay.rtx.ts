import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay rtx';

export default class OverlayRTXCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o rtx', 'rtx'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Compare two Medias side by side with RTX OFF and RTX ON badges',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayRTX.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url>',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayRTX.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayRTX.createMessage(context, args);
  }
}
