import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface HashArgs {
  text: string;
}

export const COMMAND_NAME = 'hash';

export default class HashCommand extends BaseCommand<HashArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'use'},
      ],
      label: 'text',
      metadata: {
        description: 'Hash some text',
        examples: [
          `${COMMAND_NAME} Discord Bots`,
          `${COMMAND_NAME} Discord Bots -use sha256`,
        ],
        type: CommandTypes.TOOLS,
        usage: `${COMMAND_NAME} <text> (-use <hash-type>)`,
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  run(context: Command.Context, args: HashArgs) {
    return context.reply('ok');
  }
}
