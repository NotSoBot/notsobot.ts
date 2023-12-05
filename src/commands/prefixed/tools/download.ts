import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

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
      default: DefaultParameters.lastUrl,
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

  onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (args.url === undefined) {
      return editOrReply(context, '⚠ Unable to find any urls in the last 50 messages.');
    } else if (args.url === null) {
      return editOrReply(context, '⚠ Invalid url');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
