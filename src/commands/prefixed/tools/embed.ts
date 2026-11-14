import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, CommandRatelimits, DownloadQualities, Mimetypes, MimetypesToExtension, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'embed';

// `download` with the post's author and text above the media, like a link preview. a server's auto-embed (a premium
// perk) does the same for links posted on their own, this is anyone asking for one
export default class EmbedCommand extends BaseCommand<Formatter.Commands.ToolsEmbed.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

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
        description: 'Embed a post from a link: its video or images, with who posted it and its text above (TikTok, Instagram, X, Reddit, Bluesky...)',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
        ],
        id: Formatter.Commands.ToolsEmbed.COMMAND_ID,
        usage: '<url> (-format <choice>) (-locale <language>) (-position <number>) (-quality <choice>) (-spoiler)',
      },
      ratelimits: CommandRatelimits.BROWSER,
      type: Parameters.url,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsEmbed.CommandArgs) {
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

  async run(context: Command.Context, args: Formatter.Commands.ToolsEmbed.CommandArgs) {
    return Formatter.Commands.ToolsEmbed.createMessage(context, args);
  }
}
