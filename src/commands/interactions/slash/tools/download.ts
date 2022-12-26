import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsDownloadCommand extends BaseInteractionCommandOption {
  description = 'Download Media from a URL';
  metadata = {
    id: Formatter.Commands.ToolsDownload.COMMAND_ID,
  };
  name = 'download';

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
      return editOrReply(context, '⚠ Unable to find any urls in the last 50 messages.');
    } else if (args.url === null) {
      return editOrReply(context, '⚠ Invalid url');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
