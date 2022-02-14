import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'qr scan';

export default class QRScanCommand extends BaseImageCommand<Formatter.Commands.ToolsQrScan.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Scan an image for QR Codes',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png`,
        ],
        type: CommandTypes.TOOLS,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsQrScan.CommandArgs) {
    return Formatter.Commands.ToolsQrScan.createMessage(context, args);
  }
}
