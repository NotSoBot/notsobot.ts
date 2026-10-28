import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, DownloadQualities, Mimetypes, MimetypesToExtension, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'download';

export default class DownloadCommand extends BaseCommand<Formatter.Commands.ToolsDownload.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['dl'],
      args: [
        {name: 'format', aliases: ['f'], label: 'mediaFormat', type: Parameters.oneOf({choices: Mimetypes, descriptions: MimetypesToExtension})},
        {name: 'locale', aliases: ['language'], type: Parameters.locale},
        {name: 'position', aliases: ['p'], label: 'mediaPosition', type: Number},
        {name: 'quality', aliases: ['q'], type: Parameters.oneOf({choices: DownloadQualities})},
        {name: 'spoiler', aliases: ['s'], type: Boolean},
      ],
      default: DefaultParameters.lastUrl,
      label: 'url',
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Download an image or video from a link, like reels/shorts/tiktoks',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
        ],
        id: Formatter.Commands.ToolsDownload.COMMAND_ID,
        usage: '<url> (-format <choice>) (-locale <language>) (-position <number>) (-quality <choice>) (-spoiler)',
      },
      type: Parameters.url,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return !!args.url;
  }

  async onCancelRun(context: Command.Context, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.no_urls_found')}`});
    } else if (args.url === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.invalid_url')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
