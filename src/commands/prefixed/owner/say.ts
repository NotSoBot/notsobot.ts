import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}


export const COMMAND_NAME = 'say';

export default class SayCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        description: 'Have the bot say something (owner only because exploits)',
        examples: [
          `${COMMAND_NAME} :spider:`,
        ],
        type: CommandTypes.OWNER,
        usage: '<text>',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: CommandArgs) {
    return context.reply(args.text);
  }
}
