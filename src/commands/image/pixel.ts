import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  amount: number,
  url?: null | string,
}

export interface CommandArgs {
  amount: number,
  url: string,
}

export default class PixelCommand extends BaseImageCommand<CommandArgs> {
  name = 'pixel';

  metadata = {
    description: 'Pixelate?',
    examples: [
      'pixel',
      'pixel cake',
      'pixel cake -amount 2',
    ],
    type: CommandTypes.IMAGE,
    usage: 'pixel ?<emoji|id|mention|name|url> (-amount <number>)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {name: 'amount', type: Number},
      ],
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
