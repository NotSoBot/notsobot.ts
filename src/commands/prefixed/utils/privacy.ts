import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'privacy';

export default class PrivacyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Privacy Policy',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.UTILS,
        id: Formatter.Commands.UtilsPrivacy.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.UtilsPrivacy.createMessage(context);
  }
}
