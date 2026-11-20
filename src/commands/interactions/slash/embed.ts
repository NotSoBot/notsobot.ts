import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandRatelimits, DownloadQualities, DownloadQualitiesToTextWithTier, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


// `/download` with the post's author and text above the media, its options (and their translations) are download's
export default class EmbedCommand extends BaseSlashCommand {
  description = 'Embed a post from a link, with who posted it and its text';
  descriptionLocalizations = I18n.localizations('commands.embed.description');
  metadata = {
    id: Formatter.Commands.ToolsEmbed.COMMAND_ID,
  };
  name = 'embed';
  nameLocalizations = I18n.localizations('commands.embed.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      ratelimits: CommandRatelimits.BROWSER,
      options: [
        {
          default: DefaultParameters.lastUrl,
          name: 'url',
          description: 'URL of the post',
          ...I18n.optionLocalizations('commands.download.url'),
          value: Parameters.url,
        },
        {
          name: 'format',
          description: 'Media Mimetype Format',
          ...I18n.optionLocalizations('commands.download.format'),
          label: 'mediaFormat',
          onAutoComplete: Parameters.AutoComplete.downloadMediaFormats,
        },
        {
          name: 'position',
          description: 'Media Position in Gallery/Playlist',
          ...I18n.optionLocalizations('commands.download.position'),
          label: 'mediaPosition',
          type: Number,
        },
        {
          name: 'quality',
          description: 'Choose Max Video Quality',
          ...I18n.optionLocalizations('commands.download.quality'),
          choices: Parameters.Slash.oneOf({choices: DownloadQualities, descriptions: DownloadQualitiesToTextWithTier, defaultChoice: DownloadQualities.QUALITY_720, doNotSort: true}),
        },
        {
          name: 'spoiler',
          description: 'Spoilerize the media',
          ...I18n.optionLocalizations('commands.download.spoiler'),
          type: Boolean,
        },
        {
          name: 'view',
          description: 'Gallery or one per page for posts with more than one media (Default: Your Setting)',
          ...I18n.optionLocalizations('commands.download.view'),
          choices: Parameters.Slash.POST_GALLERY_VIEWS,
        },
        {
          name: 'locale',
          description: 'Language to Fetch the Page in',
          ...I18n.optionLocalizations('commands.download.locale'),
          value: Parameters.locale,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    return !!args.url;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    const { translate } = await I18n.getTranslator(context);
    if (args.url === undefined) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.no_urls_found')}`});
    } else if (args.url === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.invalid_url')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsEmbed.CommandArgs) {
    return Formatter.Commands.ToolsEmbed.createMessage(context, args);
  }
}
