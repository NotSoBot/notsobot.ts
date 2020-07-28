import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  type?: string,
  url?: null | string,
}

export interface CommandArgs {
  type?: string,
  url: string,
}

export default class RetroCommand extends BaseImageCommand<CommandArgs> {
  name = 'retro';

  args = [
    {name: 'type'},
  ];
  metadata = {
    examples: [
      'retro',
      'retro cake',
      'retro cake -type 2',
    ],
    type: CommandTypes.IMAGE,
    usage: 'retro ?<emoji|id|mention|name|url> (-type <retro-type>)',
  };

  async run(context: Command.Context, args: CommandArgs) {

  }
}
