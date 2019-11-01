import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface HashArgs {
  text: string;
}

export default class HashCommand extends BaseCommand<HashArgs> {
  name = 'hash';

  label = 'text';
  metadata = {
    description: 'Hash some text',
    examples: [
      'hash lolol',
      'hash lolol -use sha256',
    ],
    type: CommandTypes.TOOLS,
    usage: 'hash <text> (-use <hash-type>)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{name: 'use'}],
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  run(context: Command.Context, args: HashArgs) {
    return context.reply('ok');
  }
}
