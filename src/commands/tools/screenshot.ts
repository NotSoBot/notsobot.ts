import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'screenshot';

export default class ScreenshotCommand extends BaseCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ss'],
      label: 'url',
      metadata: {
        description: 'Take a screenshot of a website',
        examples: [
          `${COMMAND_NAME} https://discordapp.com`,
        ],
        type: CommandTypes.TOOLS,
        usage:  '<url>',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {

  }
}
