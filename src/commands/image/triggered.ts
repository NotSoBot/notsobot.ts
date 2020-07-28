import { Command, CommandClient } from 'detritus-client';

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

export default class TriggeredCommand extends BaseImageCommand<CommandArgs> {
  name = 'triggered';

  args = [
    {name: 'type'},
  ];
  metadata = {
    examples: [
      'triggered',
      'triggered cake',
      'triggered cake -type 2',
    ],
    type: CommandTypes.IMAGE,
    usage: 'triggered ?<emoji|id|mention|name|url> (-type <triggered-type>)',
  };

  async run(context: Command.Context, args: CommandArgs) {

  }
}
