import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import {
  Formatter,
  I18n,
  displayReply,
  findMediaUrlInMessages,
  getOrFetchRealUrl,
} from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface DownloadCommandArgsBefore extends ContextMenuMessageArgs {
  url?: string | null,
}

export interface DownloadCommandArgs extends ContextMenuMessageArgs {
  url: string,
}

export const COMMAND_NAME = 'Download';

export default class DownloadCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.ToolsDownload.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.download.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async onBeforeRun(context: Interaction.InteractionContext, args: DownloadCommandArgsBefore) {
	args.url = findMediaUrlInMessages([args.message], undefined, undefined, false);
    if (args.url) {
      args.url = await getOrFetchRealUrl(context, args.url);
    }
    return !!args.url;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: DownloadCommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('commands.context.download.no_media'), ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: DownloadCommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, {
      url: args.url,
    });
  }
}
