import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';

import {
  DefaultParameters,
  Formatter,
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

  onCancelRun(context: Interaction.InteractionContext, args: DownloadCommandArgsBefore) {
	  return context.editOrRespond({
	    content: 'Message must have some sort of media or URL to download!',
	    flags: MessageFlags.EPHEMERAL,
	  });
  }

  async run(context: Interaction.InteractionContext, args: DownloadCommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, {
      safe: DefaultParameters.safe(context),
      url: args.url,
    });
  }
}
