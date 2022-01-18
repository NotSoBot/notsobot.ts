import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'qr scan';

export default class QRScanCommand extends BaseImageCommand<CommandArgs> {
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

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsQrScan.createMessage(context, args);
  }
}
