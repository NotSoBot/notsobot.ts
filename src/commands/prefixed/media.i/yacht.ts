import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'yacht';

export default class YachtCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['boat'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write some text on the side of a yacht (up to 25 characters)',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaICreateYacht.COMMAND_ID,
        usage: '<text>',
      },
      type: Parameters.string({maxLength: Formatter.Commands.MediaICreateYacht.MAX_TEXT_LENGTH}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateYacht.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateYacht.CommandArgs) {
    return Formatter.Commands.MediaICreateYacht.createMessage(context, args);
  }
}
