import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag random';

export default class TagRandomCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t random'],
      label: 'arguments',
      metadata: {
        description: 'Show a random tag',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.FUN,
      },
      type: Parameters.stringArguments,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }
}
