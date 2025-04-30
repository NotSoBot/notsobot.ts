import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes, Permissions } from 'detritus-client/lib/constants';

import { BooleanEmojis, DownloadQualities } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export default class DownloadCommand extends BaseSlashCommand {
  description = 'Download Media from a URL';
  metadata = {
    id: Formatter.Commands.ToolsDownload.COMMAND_ID,
  };
  name = 'download';

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
          value: Parameters.url,
        },
        {
          name: 'format',
          description: 'Media Mimetype Format',
          label: 'mediaFormat',
          onAutoComplete: Parameters.AutoComplete.downloadMediaFormats,
        },
        {
          name: 'position',
          description: 'Media Position in Gallery/Playlist',
          label: 'mediaPosition',
          type: Number,
        },
        {
          name: 'quality',
          description: 'Choose Max Video Quality',
          choices: Parameters.Slash.oneOf({choices: DownloadQualities, defaultChoice: DownloadQualities.QUALITY_720, doNotSort: true}),
        },
        {
          name: 'spoiler',
          description: 'Spoilerize the media',
          type: Boolean,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: {url?: null | string}) {
    if (args.url === undefined) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any urls in the last 50 messages.`);
    } else if (args.url === null) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Invalid url`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
