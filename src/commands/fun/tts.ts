import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  use: string,
}

export interface CommandArgs {
  use: string,
}

export default class TTSCommand extends BaseCommand {
  name = 'tts';

  aliases = ['text-to-speech'];
  metadata = {
    description: 'Text to Speech',
    examples: [
      'tts give me a table',
      'tts give me a table -use spanish',
    ],
    type: CommandTypes.FUN,
    usage: 'tts <text> (-use <language/type>)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {name: 'use'},
      ],
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
