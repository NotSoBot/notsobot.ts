import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../utils';

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
          name: 'url',
          description: 'URL to download',
          required: true,
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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsDownload.CommandArgs) {
    return Formatter.Commands.ToolsDownload.createMessage(context, args);
  }
}
