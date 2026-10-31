import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag random';

export default class TagRandomCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t random'],
      args: [
        {name: 'content', type: Parameters.string({maxLength: 1000})},
        {name: 'name', type: Parameters.string({maxLength: 64})},
        {name: 'user', type: Parameters.memberOrUser({allowBots: false})},
      ],
      label: 'arguments',
      metadata: {
        category: CommandCategories.TAGS,
        description: 'Show a random tag',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.TagRandom.COMMAND_ID,
        usage: '<...arguments> (-content <text>) (-name <text>) (-user <user:id|mention|name>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }
}
