import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'tunnel';

export default class TunnelCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'spiral', aliases: ['s'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply a Tunnel effect on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -s`,
        ],
        id: Formatter.Commands.MediaIVManipulationTunnel.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-spiral)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationTunnel.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTunnel.createMessage(context, args);
  }
}
