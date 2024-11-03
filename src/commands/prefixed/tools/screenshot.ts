import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'screenshot';

export default class ScreenshotCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ss'],
      args: [
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
        {name: 'timeout', aliases: ['t'], type: 'float'},
      ],
      label: 'url',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Take a screenshot of a website',
        examples: [
          `${COMMAND_NAME} https://discordapp.com`,
        ],
        id: Formatter.Commands.ToolsScreenshot.COMMAND_ID,
        usage: '<url> (-safe) (-timeout <seconds>)',
      },
      type: Parameters.url,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsScreenshot.CommandArgs) {
    return !!args.url;
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsScreenshot.CommandArgs) {
    return Formatter.Commands.ToolsScreenshot.createMessage(context, args);
  }
}
