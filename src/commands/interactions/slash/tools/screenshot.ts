import { Interaction } from 'detritus-client';

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
      options: [
        {
          name: 'url',
          description: 'URL to screenshot',
          required: true,
          value: Parameters.url,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsScreenshot.CommandArgs) {
    return Formatter.Commands.ToolsScreenshot.createMessage(context, args);
  }
}
