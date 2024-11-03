import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsScreenshotCommand extends BaseInteractionCommandOption {
  description = 'Screenshot a website';
  metadata = {
    id: Formatter.Commands.ToolsScreenshot.COMMAND_ID,
  };
  name = 'screenshot';

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
      options: [
        {
          name: 'url',
          description: 'URL to screenshot',
          required: true,
          value: Parameters.url,
        },
        {
          name: 'timeout',
          description: 'Max amount of seconds to wait before screenshotting',
          value: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsScreenshot.CommandArgs) {
    return Formatter.Commands.ToolsScreenshot.createMessage(context, args);
  }
}
