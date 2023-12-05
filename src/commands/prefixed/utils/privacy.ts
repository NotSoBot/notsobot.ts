import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { editOrReply } from '../../../utils';

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
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return editOrReply(context, '<https://beta.notsobot.com/legal/privacy>');
  }
}
