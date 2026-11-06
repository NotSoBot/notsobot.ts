import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, CommandRatelimits, ScreenshotBrowsers } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'screenshot';

export default class ScreenshotCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ss'],
      args: [
        {name: 'browser', aliases: ['b'], type: Parameters.oneOf({choices: ScreenshotBrowsers}), metadata: {description: 'chrome or firefox, firefox is always 1920x1080'}},
        {name: 'height', aliases: ['h'], type: Number, metadata: {description: '1 to 4096'}},
        {name: 'lightmode', aliases: ['light'], type: Boolean},
        {name: 'timeout', aliases: ['t'], type: 'float', metadata: {description: '1 to 15'}},
        {name: 'wait', aliases: ['wa'], type: 'float', metadata: {description: '0 to 5'}},
        {name: 'width', aliases: ['wd'], type: Number, metadata: {description: '1 to 2048'}},
      ],
      label: 'url',
      metadata: {
        category: CommandCategories.UTILITY,
        pipeable: true,
        description: 'Take a screenshot of a website',
        examples: [
          `${COMMAND_NAME} https://discord.com`,
          `${COMMAND_NAME} https://discord.com -browser firefox`,
        ],
        id: Formatter.Commands.ToolsScreenshot.COMMAND_ID,
        usage: '<url> (-browser <chrome|firefox>) (-height <number>) (-lightmode) (-timeout <seconds>) (-wait <float>) (-width <number>)',
      },
      ratelimits: CommandRatelimits.BROWSER,
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
