import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string, 
}

export interface CommandArgs {
  text: string,
}

export const COMMAND_NAME = 'regional';

export default class RegionalCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        description: 'Convert text to regional emojis',
        examples: [
          `${COMMAND_NAME} lol`,
        ],
        type: CommandTypes.FUN,
        usage: `${COMMAND_NAME} <text>`,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
