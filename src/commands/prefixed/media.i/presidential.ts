import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'presidential';

export default class PresidentialCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['alert', 'presidentialalert'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Create an iPhone Presidential Alert with some text',
        examples: [
          `${COMMAND_NAME} this is not a drill`,
        ],
        id: Formatter.Commands.MediaICreatePresidential.COMMAND_ID,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreatePresidential.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreatePresidential.CommandArgs) {
    return Formatter.Commands.MediaICreatePresidential.createMessage(context, args);
  }
}
