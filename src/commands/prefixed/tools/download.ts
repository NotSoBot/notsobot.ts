import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'download';

export default class DownloadCommand extends BaseCommand<Formatter.Commands.ToolsDownload.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['dl'],
      args: [
        {name: 'spoiler', aliases: ['s'], type: Boolean},
      ],
      label: 'url',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Download a URL, like reels/shorts/tiktoks',
        examples: [
          `${COMMAND_NAME} https://discordapp.com`,
        ],
        id: Formatter.Commands.ToolsDownload.COMMAND_ID,
        usage: '<url> (-spoiler)',
      },
      type: Parameters.url,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return !!args.url;
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
