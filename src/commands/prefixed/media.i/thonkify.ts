import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'thonkify';

export default class ThonkifyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['thonk'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write text in the thinking emoji font',
        examples: [
          `${COMMAND_NAME} hello`,
        ],
        id: Formatter.Commands.MediaICreateThonkify.COMMAND_ID,
        usage: '<text (max 70 characters)>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateThonkify.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateThonkify.CommandArgs) {
    return Formatter.Commands.MediaICreateThonkify.createMessage(context, args);
  }
}
