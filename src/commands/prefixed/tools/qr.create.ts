import { Command, CommandClient } from 'detritus-client';

import { utilitiesQrCreate } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
  size?: string,
}

export const COMMAND_NAME = 'qr create';

export default class QRCreateCommand extends BaseCommand<CommandArgs> {
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

  async run(context: Command.Context, args: CommandArgs) {
    const response = await utilitiesQrCreate(context, args);
    return imageReply(context, response);
  }
}
