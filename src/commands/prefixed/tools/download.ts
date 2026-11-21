import { Command, CommandClient } from 'detritus-client';

import { CommandResults, getCommandResult, setCommandResult } from '../../../commandresults';
import { AutoEmbedReactions, CommandCategories, CommandRatelimits, DiscordReactionEmojis, DownloadQualities, Mimetypes, MimetypesToExtension, PostGalleryViews, StatusEmojis } from '../../../constants';
import { captureCommandError } from '../../../sentry';
import { CommandRunCancelledError, DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';
import { getAutoEmbedLink } from '../../../utils/autoembed';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'download';

// auto-embed (`NotSoCommandClient.findAutoEmbedLink`) runs this command for a message whose only link is to a post.
// those never reply with an error, every way it can fail reacts to the link instead
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
        // a post with more than one media as a gallery or one per page, over their settings
        {name: 'view', type: Parameters.oneOf({choices: PostGalleryViews})},
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
        usage: '<url> (-format <choice>) (-locale <language>) (-position <number>) (-quality <choice>) (-spoiler) (-view <gallery|pages>)',
      },
      ratelimits: CommandRatelimits.BROWSER,
      type: Parameters.url,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return !!args.url;
  }

  async onCancelRun(context: Command.Context, args: {url?: null | string}) {
    if (getAutoEmbedLink(context)) {
      return Formatter.Commands.ToolsDownload.reactAutoEmbed(context, AutoEmbedReactions.FAILED);
    }
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.no_urls_found')}`});
    } else if (args.url === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.invalid_url')}`});
    }
    return super.onCancelRun(context, args);
  }

  // a link that was blocked (rules, a blocked user) wasn't a use of the command, don't log every one of them
  async onFinally(context: Command.Context) {
    if (getAutoEmbedLink(context) && getCommandResult(context) === CommandResults.BLOCKED) {
      return;
    }
    return super.onFinally(context);
  }

  async onRatelimit(
    context: Command.Context,
    ratelimits: Array<Command.CommandRatelimitInfo>,
    metadata: Command.CommandRatelimitMetadata,
  ) {
    if (getAutoEmbedLink(context)) {
      if (!context.message.reactions.has(DiscordReactionEmojis.WAIT.id)) {
        await Formatter.Commands.ToolsDownload.reactAutoEmbed(context, `${DiscordReactionEmojis.WAIT.name}:${DiscordReactionEmojis.WAIT.id}`);
      }
      return;
    }
    return super.onRatelimit(context, ratelimits, metadata);
  }

  async onRunError(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs, error: any) {
    if (!getAutoEmbedLink(context)) {
      return super.onRunError(context, args, error);
    }
    // its trigger was edited or deleted, the newer run (if any) owns the reply
    if (error instanceof CommandRunCancelledError) {
      return;
    }
    captureCommandError(context, error);
    const emoji = await Formatter.Commands.ToolsDownload.getAutoEmbedErrorReaction(error);
    return Formatter.Commands.ToolsDownload.reactAutoEmbed(context, emoji);
  }

  async onTypeError(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs, errors: Command.ParsedErrors) {
    if (!getAutoEmbedLink(context)) {
      return super.onTypeError(context, args, errors);
    }
    setCommandResult(context, CommandResults.ARGUMENT_ERROR);
    return Formatter.Commands.ToolsDownload.reactAutoEmbed(context, AutoEmbedReactions.FAILED);
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
