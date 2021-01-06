import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  use: string,
}

export interface CommandArgs {
  use: string,
}

export const COMMAND_NAME = 'text-to-speech';

export default class TTSCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tts'],
      args: [
        {name: 'use'},
      ],
      metadata: {
        description: 'Text to Speech',
        examples: [
          `${COMMAND_NAME} give me a table`,
          `${COMMAND_NAME} give me a table -use spanish`,
        ],
        type: CommandTypes.FUN,
        usage: `${COMMAND_NAME} <text> (-use <language/type>)`,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
