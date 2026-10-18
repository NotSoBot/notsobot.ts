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
        {name: 'height', aliases: ['h'], type: Number, metadata: {description: '1 to 4096'}},
        {name: 'lightmode', aliases: ['light'], type: Boolean},
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
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
          `${COMMAND_NAME} https://discordapp.com`,
        ],
        id: Formatter.Commands.ToolsScreenshot.COMMAND_ID,
        usage: '<url> (-height <number>) (-lightmode) (-safe) (-timeout <seconds>) (-wait <float>) (-width <number>)',
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
