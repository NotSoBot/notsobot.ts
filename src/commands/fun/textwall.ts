import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  
}

export interface CommandArgs {

}

export default class TextWallCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'textwall',

      aliases: ['twall'],
      label: 'text',
      metadata: {
        type: CommandTypes.FUN,
      },
    });
  }

  run(context: Command.Context, args: CommandArgs) {

  }
}
