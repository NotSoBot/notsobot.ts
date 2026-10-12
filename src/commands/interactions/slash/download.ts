import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes, Permissions } from 'detritus-client/lib/constants';

import { DownloadQualities, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export default class DownloadCommand extends BaseSlashCommand {
  description = 'Download Media from a URL';
  descriptionLocalizations = I18n.localizations('commands.download.description');
  metadata = {
    id: Formatter.Commands.ToolsDownload.COMMAND_ID,
  };
  name = 'download';
  nameLocalizations = I18n.localizations('commands.download.name');

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
      options: [
        {
          default: DefaultParameters.lastUrl,
          name: 'url',
          description: 'URL to download',
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
          choices: Parameters.Slash.oneOf({choices: DownloadQualities, defaultChoice: DownloadQualities.QUALITY_1080, doNotSort: true}),
        },
        {
          name: 'safe',
          description: 'Enable NSFW Scanning',
          ...I18n.optionLocalizations('commands.download.safe'),
          type: Boolean,
          default: DefaultParameters.safe,
          value: Parameters.Slash.safe,
        },
        {
          name: 'spoiler',
          description: 'Spoilerize the media',
          ...I18n.optionLocalizations('commands.download.spoiler'),
          type: Boolean,
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
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.no_urls_found')}`);
    } else if (args.url === null) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.invalid_url')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
