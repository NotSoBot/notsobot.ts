import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'qr create';

export default class QRCreateCommand extends BaseCommand<Formatter.Commands.ToolsQrCreate.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'margin', type: Number},
        {name: 'size'},
      ],
      label: 'query',
      metadata: {
        description: 'Generate a QR code',
        examples: [
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png -size 1024`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png -size 1024 -margin 0`,
        ],
        type: CommandTypes.TOOLS,
        usage: '<query> (-margin <number>) (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsQrCreate.CommandArgs) {
    return Formatter.Commands.ToolsQrScan.createMessage(context, args);
  }
}
