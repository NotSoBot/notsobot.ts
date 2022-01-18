import { Command, CommandClient } from 'detritus-client';

import { utilitiesScreenshot } from '../../../api';
import { CommandTypes } from '../../../constants';
import { Parameters, imageReply } from '../../../utils';

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
        usage: '<url>',
      },
      type: Parameters.url,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return !!args.url;
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await utilitiesScreenshot(context, args);
    return imageReply(context, response);
  }
}
